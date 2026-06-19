import 'dotenv/config'
import { LlmRequest, LlmResponse } from '../types/llm.types';
import { parseAnthropicUsage } from './token.service';
import { calculateCost } from './cost.service';

import { EventSourceParserStream } from 'eventsource-parser/stream';
import type { Response } from 'express';
import logger from '../logger';

const BASE_URL = process.env.GPTUNNEL_BASE_URL ?? "";
const API_KEY = process.env.GPTUNNEL_API_KEY ?? "";

export async function anthropicChat(body: LlmRequest): Promise<LlmResponse> {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic upstream error ${res.status}: ${text}`);
  }

  const data = await res.json() as Record<string, any>;

  const usage = parseAnthropicUsage(data['usage']);
  const costUSD = calculateCost(body.model, usage.inputTokens, usage.outputTokens);
  const content = (data['content'] as Array<{ text: string }>)[0]?.text ?? '';

  return { content, model: body.model, usage, costUSD };
}

export async function anthropicStream(body: LlmRequest, res: Response): Promise<void> {
  const upstream = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    throw new Error(`Anthropic upstream error ${upstream.status}: ${text}`);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let inputTokens = 0;
  let outputTokens = 0;

  const stream = upstream.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  for await (const event of stream) {
    res.write(`event: ${event.event ?? 'message'}\ndata: ${event.data}\n\n`);

    if (event.event === 'message_start') {
      const parsed = JSON.parse(event.data) as Record<string, any>;
      inputTokens = parsed?.message?.usage?.input_tokens ?? 0;
    }

    if (event.event === 'message_delta') {
      const parsed = JSON.parse(event.data) as Record<string, any>;
      outputTokens = parsed?.usage?.output_tokens ?? 0;
    }
  }

  const usage   = parseAnthropicUsage({ input_tokens: inputTokens, output_tokens: outputTokens });
  const costUSD = calculateCost(body.model, inputTokens, outputTokens);

  logger.info({ mode: 'streaming', model: body.model, ...usage, costUSD });

  res.end();
}
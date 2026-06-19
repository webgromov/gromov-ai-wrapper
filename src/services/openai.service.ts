import { EventSourceParserStream } from 'eventsource-parser/stream';
import type { Response } from 'express';
import { LlmRequest, LlmResponse } from '../types/llm.types';
import { parseOpenAiUsage } from './token.service';
import { calculateCost } from './cost.service';
import logger from '../logger';

const BASE_URL = process.env.GPTUNNEL_BASE_URL!;
const API_KEY  = process.env.GPTUNNEL_API_KEY!;

export async function openaiChat(body: LlmRequest): Promise<LlmResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: false }),
  });

  const data = await res.json() as Record<string, any>;

  const usage = parseOpenAiUsage(data['usage']);
  const costUSD = calculateCost(body.model, usage.inputTokens, usage.outputTokens);
  const content = data['choices']?.[0]?.message?.content ?? '';

  return { content, model: body.model, usage, costUSD };
}

export async function openaiStream(body: LlmRequest, res: Response): Promise<void> {
  const upstream = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: true, stream_options: { include_usage: true } }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    throw new Error(`OpenAI upstream error ${upstream.status}: ${text}`);
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
    if (event.data === '[DONE]') {
      res.write('data: [DONE]\n\n');
      break;
    }

    res.write(`data: ${event.data}\n\n`);

    const parsed = JSON.parse(event.data) as Record<string, any>;
    if (parsed?.usage) {
      inputTokens  = parsed.usage.prompt_tokens     ?? 0;
      outputTokens = parsed.usage.completion_tokens ?? 0;
    }
  }

  const usage = parseOpenAiUsage({ prompt_tokens: inputTokens, completion_tokens: outputTokens });
  const costUSD = calculateCost(body.model, inputTokens, outputTokens);

  logger.info({ mode: 'streaming', model: body.model, ...usage, costUSD });

  res.end();
}

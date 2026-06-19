import { Request, Response } from 'express';
import { LlmRequest } from '../types/llm.types';
import { anthropicChat, anthropicStream } from '../services/anthropic.service';
import { openaiChat, openaiStream } from '../services/openai.service';
import logger from '../logger';

import { prisma } from '../libs/prisma'

function detectProvider(model: string): 'anthropic' | 'openai' {
  if (model.startsWith('claude-')) return 'anthropic';
  return 'openai';
}

export async function llmHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as LlmRequest;
  const provider = detectProvider(body.model);
  const isStream = body.stream === true;
  const startedAt = Date.now();

  try {
    if (isStream) {
      const { costUSD } = provider === 'anthropic'
        ? await anthropicStream(body, res)
        : await openaiStream(body, res);

      await prisma.user.update({
        where: { id: req.user.id },
        data: { balance: { decrement: costUSD } },
      });
      return;
    }

    const result = provider === 'anthropic'
      ? await anthropicChat(body)
      : await openaiChat(body);
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { balance: { decrement: result.costUSD } },
    });

    logger.info({
      mode: 'json',
      model: body.model,
      ...result.usage,
      costUSD: result.costUSD,
      latencyMs: Date.now() - startedAt,
    });

    res.json(result);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ error: message, model: body.model });
    res.status(502).json({ error: message });
  }
}

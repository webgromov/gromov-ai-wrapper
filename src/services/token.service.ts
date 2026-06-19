import { TokenUsage } from '../types/llm.types';

export function parseAnthropicUsage(usage: Record<string, number>): TokenUsage {
  const inputTokens  = usage['input_tokens']  ?? 0;
  const outputTokens = usage['output_tokens'] ?? 0;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

export function parseOpenAiUsage(usage: Record<string, number>): TokenUsage {
  const inputTokens  = usage['prompt_tokens']     ?? 0;
  const outputTokens = usage['completion_tokens'] ?? 0;

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage['total_tokens'] ?? inputTokens + outputTokens,
  };
}

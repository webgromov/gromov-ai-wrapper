import logger from '../logger';

const PRICING: Record<string, { input: number;  output: number}> = {
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'gpt-5-mini': { input: 0.40, output: 1.60 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model];

  if (!price) {
    logger.warn(`Unknown model for cost calculation: ${model}`);
    return 0;
  }

  return (inputTokens * price.input + outputTokens * price.output) / 1000000;
}
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  stream?: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  costUSD: number;
}
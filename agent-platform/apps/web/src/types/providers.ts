/**
 * LLM Provider Configuration Types
 * Supports OpenAI, Anthropic, Google, xAI (Grok), and OpenRouter
 */

export interface LLMProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  enabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface ModelPricing {
  inputCostPer1M: number;
  outputCostPer1M: number;
  intelligenceIndex?: number; // From Artificial Analysis
  speedTokensPerSecond?: number;
}

export const SUPPORTED_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', pricing: { inputCostPer1M: 2.5, outputCostPer1M: 10, intelligenceIndex: 26.31, speedTokensPerSecond: 150 } },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', pricing: { inputCostPer1M: 0.15, outputCostPer1M: 0.6, intelligenceIndex: 21.15, speedTokensPerSecond: 200 } },
      { id: 'o1-preview', name: 'O1 Preview', pricing: { inputCostPer1M: 15, outputCostPer1M: 60, intelligenceIndex: 35.2, speedTokensPerSecond: 80 } },
      { id: 'o1-mini', name: 'O1 Mini', pricing: { inputCostPer1M: 3, outputCostPer1M: 12, intelligenceIndex: 28.8, speedTokensPerSecond: 120 } },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', pricing: { inputCostPer1M: 10, outputCostPer1M: 30, intelligenceIndex: 24.5, speedTokensPerSecond: 100 } },
      { id: 'gpt-4', name: 'GPT-4', pricing: { inputCostPer1M: 30, outputCostPer1M: 60, intelligenceIndex: 23.1, speedTokensPerSecond: 50 } },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', pricing: { inputCostPer1M: 0.5, outputCostPer1M: 1.5, intelligenceIndex: 18.2, speedTokensPerSecond: 300 } },
    ],
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', pricing: { inputCostPer1M: 3, outputCostPer1M: 15, intelligenceIndex: 32.4, speedTokensPerSecond: 120 } },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', pricing: { inputCostPer1M: 0.8, outputCostPer1M: 4, intelligenceIndex: 20.22, speedTokensPerSecond: 180 } },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', pricing: { inputCostPer1M: 15, outputCostPer1M: 75, intelligenceIndex: 31.8, speedTokensPerSecond: 60 } },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', pricing: { inputCostPer1M: 3, outputCostPer1M: 15, intelligenceIndex: 28.6, speedTokensPerSecond: 100 } },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', pricing: { inputCostPer1M: 0.25, outputCostPer1M: 1.25, intelligenceIndex: 19.8, speedTokensPerSecond: 200 } },
    ],
    baseUrl: 'https://api.anthropic.com',
  },
  google: {
    name: 'Google',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', pricing: { inputCostPer1M: 0, outputCostPer1M: 0, intelligenceIndex: 25.3, speedTokensPerSecond: 250 } }, // Free tier
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', pricing: { inputCostPer1M: 1.25, outputCostPer1M: 5, intelligenceIndex: 24.8, speedTokensPerSecond: 120 } },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', pricing: { inputCostPer1M: 0.075, outputCostPer1M: 0.3, intelligenceIndex: 22.1, speedTokensPerSecond: 180 } },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', pricing: { inputCostPer1M: 0.5, outputCostPer1M: 1.5, intelligenceIndex: 21.5, speedTokensPerSecond: 100 } },
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
  },
  xai: {
    name: 'xAI (Grok)',
    models: [
      { id: 'grok-2-1212', name: 'Grok 2', pricing: { inputCostPer1M: 2, outputCostPer1M: 10, intelligenceIndex: 60.25, speedTokensPerSecond: 200 } },
      { id: 'grok-1.5', name: 'Grok 1.5', pricing: { inputCostPer1M: 5, outputCostPer1M: 15, intelligenceIndex: 55.8, speedTokensPerSecond: 150 } },
      { id: 'grok-1.5-vision', name: 'Grok 1.5 Vision', pricing: { inputCostPer1M: 5, outputCostPer1M: 15, intelligenceIndex: 56.2, speedTokensPerSecond: 140 } },
      { id: 'grok-beta', name: 'Grok Beta', pricing: { inputCostPer1M: 5, outputCostPer1M: 15, intelligenceIndex: 52.1, speedTokensPerSecond: 130 } },
    ],
    baseUrl: 'https://api.x.ai/v1',
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)', pricing: { inputCostPer1M: 2.5, outputCostPer1M: 10 } },
      { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)', pricing: { inputCostPer1M: 3, outputCostPer1M: 15 } },
      { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (via OpenRouter)', pricing: { inputCostPer1M: 0, outputCostPer1M: 0 } },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (via OpenRouter)', pricing: { inputCostPer1M: 0.59, outputCostPer1M: 0.79 } },
      { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B (via OpenRouter)', pricing: { inputCostPer1M: 0.65, outputCostPer1M: 0.65 } },
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  custom: {
    name: 'Custom OpenAI API',
    models: [
      { id: 'custom-model', name: 'Custom Model', pricing: { inputCostPer1M: 0, outputCostPer1M: 0 } }, // User-defined pricing
    ],
    baseUrl: '', // User-defined
  },
} as const;

export type ProviderType = keyof typeof SUPPORTED_PROVIDERS;

export interface AgentTelemetry {
  agentId: string;
  timestamp: Date;
  metrics: {
    executionTime: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    cost: number;
    success: boolean;
    errorMessage?: string;
  };
  context: {
    model: string;
    provider: ProviderType;
    temperature: number;
    maxTokens: number;
  };
}

export interface WorkflowTelemetry {
  workflowId: string;
  timestamp: Date;
  nodes: Array<{
    nodeId: string;
    agentId?: string;
    executionTime: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: any;
    error?: string;
  }>;
  totalCost: number;
  totalTime: number;
  success: boolean;
}

export interface SystemSettings {
  defaultProvider: ProviderType;
  defaultModel: string;
  providers: Record<ProviderType, LLMProviderConfig>;
  telemetry: {
    enabled: boolean;
    retentionDays: number;
    aggregationInterval: 'realtime' | 'hourly' | 'daily';
  };
  optimization: {
    autoOptimize: boolean;
    targetMetrics: Array<'cost' | 'speed' | 'accuracy' | 'quality'>;
    optimizationInterval: 'daily' | 'weekly' | 'monthly';
  };
}

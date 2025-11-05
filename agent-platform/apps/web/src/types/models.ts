/**
 * LLM Model and Provider Types
 * Updated from ArtificialAnalysis.ai (Nov 2025)
 */

export interface ModelInfo {
  name: string;
  provider: string;
  inputPricePer1M: number;
  outputPricePer1M: number;
  contextWindow: number;
  intelligenceScore: number;
  speedTokensPerSecond: number | null;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  maxOutputTokens: number | null;
}

export interface ProviderInfo {
  name: string;
  baseUrl: string | null;
  envKey: string;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
}

export interface CustomProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models?: string[];
}

// Complete model catalog (Nov 2025)
export const MODELS: Record<string, ModelInfo> = {
  // OpenAI Models
  "gpt-4o": {
    name: "GPT-4o",
    provider: "openai",
    inputPricePer1M: 2.50,
    outputPricePer1M: 10.00,
    contextWindow: 128000,
    intelligenceScore: 88.7,
    speedTokensPerSecond: 107.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 16384
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    provider: "openai",
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60,
    contextWindow: 128000,
    intelligenceScore: 82.0,
    speedTokensPerSecond: 158.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 16384
  },
  "o1": {
    name: "o1",
    provider: "openai",
    inputPricePer1M: 15.00,
    outputPricePer1M: 60.00,
    contextWindow: 200000,
    intelligenceScore: 91.8,
    speedTokensPerSecond: 45.0,
    supportsVision: false,
    supportsFunctionCalling: false,
    supportsStreaming: true,
    maxOutputTokens: 100000
  },
  "o1-mini": {
    name: "o1-mini",
    provider: "openai",
    inputPricePer1M: 3.00,
    outputPricePer1M: 12.00,
    contextWindow: 128000,
    intelligenceScore: 85.2,
    speedTokensPerSecond: 68.0,
    supportsVision: false,
    supportsFunctionCalling: false,
    supportsStreaming: true,
    maxOutputTokens: 65536
  },
  
  // Anthropic Models
  "claude-3-5-sonnet-20241022": {
    name: "Claude 3.5 Sonnet (Oct 2024)",
    provider: "anthropic",
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00,
    contextWindow: 200000,
    intelligenceScore: 89.0,
    speedTokensPerSecond: 82.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  "claude-3-5-haiku-20241022": {
    name: "Claude 3.5 Haiku (Oct 2024)",
    provider: "anthropic",
    inputPricePer1M: 0.80,
    outputPricePer1M: 4.00,
    contextWindow: 200000,
    intelligenceScore: 81.9,
    speedTokensPerSecond: 125.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  "claude-3-opus-20240229": {
    name: "Claude 3 Opus",
    provider: "anthropic",
    inputPricePer1M: 15.00,
    outputPricePer1M: 75.00,
    contextWindow: 200000,
    intelligenceScore: 86.8,
    speedTokensPerSecond: 35.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 4096
  },
  
  // Google Models
  "gemini-1.5-pro-002": {
    name: "Gemini 1.5 Pro (002)",
    provider: "google",
    inputPricePer1M: 1.25,
    outputPricePer1M: 5.00,
    contextWindow: 2000000,
    intelligenceScore: 85.9,
    speedTokensPerSecond: 98.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  "gemini-1.5-flash-002": {
    name: "Gemini 1.5 Flash (002)",
    provider: "google",
    inputPricePer1M: 0.075,
    outputPricePer1M: 0.30,
    contextWindow: 1000000,
    intelligenceScore: 78.9,
    speedTokensPerSecond: 234.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  "gemini-2.0-flash-exp": {
    name: "Gemini 2.0 Flash (Experimental)",
    provider: "google",
    inputPricePer1M: 0.00,
    outputPricePer1M: 0.00,
    contextWindow: 1000000,
    intelligenceScore: 84.5,
    speedTokensPerSecond: 312.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  
  // xAI (Grok) Models
  "grok-2-1212": {
    name: "Grok 2 (Dec 2024)",
    provider: "xai",
    inputPricePer1M: 2.00,
    outputPricePer1M: 10.00,
    contextWindow: 131072,
    intelligenceScore: 84.3,
    speedTokensPerSecond: 95.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 32768
  },
  "grok-2-vision-1212": {
    name: "Grok 2 Vision (Dec 2024)",
    provider: "xai",
    inputPricePer1M: 2.00,
    outputPricePer1M: 10.00,
    contextWindow: 8192,
    intelligenceScore: 83.1,
    speedTokensPerSecond: 92.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 16384
  },
  "grok-beta": {
    name: "Grok Beta",
    provider: "xai",
    inputPricePer1M: 5.00,
    outputPricePer1M: 15.00,
    contextWindow: 131072,
    intelligenceScore: 87.2,
    speedTokensPerSecond: 88.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 32768
  },
  
  // Meta (Llama) Models
  "llama-3.3-70b": {
    name: "Llama 3.3 70B",
    provider: "meta",
    inputPricePer1M: 0.35,
    outputPricePer1M: 0.40,
    contextWindow: 128000,
    intelligenceScore: 82.4,
    speedTokensPerSecond: 178.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 32768
  },
  "llama-3.1-405b": {
    name: "Llama 3.1 405B",
    provider: "meta",
    inputPricePer1M: 2.70,
    outputPricePer1M: 2.70,
    contextWindow: 128000,
    intelligenceScore: 85.2,
    speedTokensPerSecond: 54.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 16384
  },
  
  // Mistral Models
  "mistral-large-2411": {
    name: "Mistral Large (Nov 2024)",
    provider: "mistral",
    inputPricePer1M: 2.00,
    outputPricePer1M: 6.00,
    contextWindow: 128000,
    intelligenceScore: 84.0,
    speedTokensPerSecond: 112.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 32768
  },
  "mistral-small-2409": {
    name: "Mistral Small (Sep 2024)",
    provider: "mistral",
    inputPricePer1M: 0.20,
    outputPricePer1M: 0.60,
    contextWindow: 128000,
    intelligenceScore: 78.2,
    speedTokensPerSecond: 156.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 16384
  },
  
  // DeepSeek Models
  "deepseek-chat": {
    name: "DeepSeek Chat",
    provider: "deepseek",
    inputPricePer1M: 0.14,
    outputPricePer1M: 0.28,
    contextWindow: 64000,
    intelligenceScore: 79.3,
    speedTokensPerSecond: 142.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  "deepseek-reasoner": {
    name: "DeepSeek Reasoner",
    provider: "deepseek",
    inputPricePer1M: 0.55,
    outputPricePer1M: 2.19,
    contextWindow: 64000,
    intelligenceScore: 85.7,
    speedTokensPerSecond: 76.0,
    supportsVision: false,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 8192
  },
  
  // Amazon Bedrock Models
  "nova-pro": {
    name: "Amazon Nova Pro",
    provider: "amazon",
    inputPricePer1M: 0.80,
    outputPricePer1M: 3.20,
    contextWindow: 300000,
    intelligenceScore: 78.0,
    speedTokensPerSecond: 134.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 5000
  },
  "nova-lite": {
    name: "Amazon Nova Lite",
    provider: "amazon",
    inputPricePer1M: 0.06,
    outputPricePer1M: 0.24,
    contextWindow: 300000,
    intelligenceScore: 71.2,
    speedTokensPerSecond: 201.0,
    supportsVision: true,
    supportsFunctionCalling: true,
    supportsStreaming: true,
    maxOutputTokens: 5000
  },
};

export const PROVIDERS: Record<string, ProviderInfo> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  google: {
    name: "Google AI",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    envKey: "GOOGLE_API_KEY",
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  xai: {
    name: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1",
    envKey: "XAI_API_KEY",
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  meta: {
    name: "Meta AI",
    baseUrl: "https://api.together.xyz/v1",
    envKey: "TOGETHER_API_KEY",
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
  mistral: {
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    envKey: "MISTRAL_API_KEY",
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
  amazon: {
    name: "Amazon Bedrock",
    baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
    envKey: "AWS_ACCESS_KEY_ID",
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctionCalling: true,
  },
  custom: {
    name: "Custom OpenAI-Compatible API",
    baseUrl: null,
    envKey: "CUSTOM_API_KEY",
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctionCalling: true,
  },
};

// Utility functions
export function getModelInfo(modelId: string): ModelInfo | null {
  return MODELS[modelId] || null;
}

export function getProviderModels(provider: string): ModelInfo[] {
  return Object.values(MODELS).filter(m => m.provider === provider);
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelInfo(modelId);
  if (!model) return 0;
  
  const inputCost = (inputTokens / 1000000) * model.inputPricePer1M;
  const outputCost = (outputTokens / 1000000) * model.outputPricePer1M;
  
  return inputCost + outputCost;
}

export function getBestValueModels(minIntelligence: number = 80.0): string[] {
  const qualified = Object.entries(MODELS)
    .filter(([_, model]) => model.intelligenceScore >= minIntelligence)
    .sort((a, b) => {
      const costA = a[1].inputPricePer1M + a[1].outputPricePer1M;
      const costB = b[1].inputPricePer1M + b[1].outputPricePer1M;
      return costA - costB;
    });
  
  return qualified.slice(0, 10).map(([id]) => id);
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
}

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sampling configuration
 */
export interface SamplingConfig {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  enabledTools?: string[];
  stopSequences?: string[];
}

/**
 * Sampling result
 */
export interface SamplingResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * Perform AI sampling using configured provider
 * Supports OpenAI, Anthropic, Google AI, and others
 */
export async function performSampling(config: SamplingConfig): Promise<SamplingResult> {
  const model = config.model || process.env.DEFAULT_MODEL || "gpt-4-turbo-preview";
  
  // Determine provider based on model name
  if (model.startsWith("gpt-") || model.startsWith("o1-")) {
    return await sampleOpenAI(config, model);
  } else if (model.startsWith("claude-")) {
    return await sampleAnthropic(config, model);
  } else if (model.startsWith("gemini-")) {
    return await sampleGoogle(config, model);
  } else {
    // Default to OpenAI-compatible API
    return await sampleOpenAI(config, model);
  }
}

/**
 * Sample using OpenAI API
 */
async function sampleOpenAI(config: SamplingConfig, model: string): Promise<SamplingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: config.messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4000,
        top_p: config.topP ?? 1.0,
        stop: config.stopSequences
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const choice = response.data.choices[0];
    
    return {
      content: choice.message.content,
      model: response.data.model,
      usage: {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens
      },
      finishReason: choice.finish_reason
    };

  } catch (error: any) {
    throw new Error(`OpenAI sampling failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Sample using Anthropic API
 */
async function sampleAnthropic(config: SamplingConfig, model: string): Promise<SamplingResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Convert messages format for Anthropic
  const systemMessage = config.messages.find(m => m.role === "system");
  const otherMessages = config.messages.filter(m => m.role !== "system");

  try {
    const response = await axios.post(
      `${baseURL}/v1/messages`,
      {
        model,
        messages: otherMessages,
        system: systemMessage?.content,
        max_tokens: config.maxTokens ?? 4000,
        temperature: config.temperature ?? 0.7,
        top_p: config.topP ?? 1.0,
        stop_sequences: config.stopSequences
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.content[0].text;
    
    return {
      content,
      model: response.data.model,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      },
      finishReason: response.data.stop_reason
    };

  } catch (error: any) {
    throw new Error(`Anthropic sampling failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Sample using Google AI API
 */
async function sampleGoogle(config: SamplingConfig, model: string): Promise<SamplingResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY not configured");
  }

  // Convert messages to Google format
  const contents = config.messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      {
        contents,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 4000,
          topP: config.topP ?? 1.0,
          stopSequences: config.stopSequences
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        params: {
          key: apiKey
        }
      }
    );

    const candidate = response.data.candidates[0];
    const content = candidate.content.parts[0].text;
    
    return {
      content,
      model,
      usage: {
        promptTokens: response.data.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.data.usageMetadata?.totalTokenCount || 0
      },
      finishReason: candidate.finishReason
    };

  } catch (error: any) {
    throw new Error(`Google AI sampling failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get available models from configured providers
 */
export async function getAvailableModels(): Promise<Array<{
  id: string;
  provider: string;
  name: string;
  contextWindow: number;
}>> {
  const models: Array<{id: string; provider: string; name: string; contextWindow: number}> = [];

  // OpenAI models
  if (process.env.OPENAI_API_KEY) {
    models.push(
      { id: "gpt-4-turbo-preview", provider: "openai", name: "GPT-4 Turbo", contextWindow: 128000 },
      { id: "gpt-4", provider: "openai", name: "GPT-4", contextWindow: 8192 },
      { id: "gpt-3.5-turbo", provider: "openai", name: "GPT-3.5 Turbo", contextWindow: 16385 },
      { id: "o1-preview", provider: "openai", name: "o1 Preview", contextWindow: 128000 },
      { id: "o1-mini", provider: "openai", name: "o1 Mini", contextWindow: 128000 }
    );
  }

  // Anthropic models
  if (process.env.ANTHROPIC_API_KEY) {
    models.push(
      { id: "claude-3-opus-20240229", provider: "anthropic", name: "Claude 3 Opus", contextWindow: 200000 },
      { id: "claude-3-sonnet-20240229", provider: "anthropic", name: "Claude 3 Sonnet", contextWindow: 200000 },
      { id: "claude-3-haiku-20240307", provider: "anthropic", name: "Claude 3 Haiku", contextWindow: 200000 }
    );
  }

  // Google models
  if (process.env.GOOGLE_AI_API_KEY) {
    models.push(
      { id: "gemini-pro", provider: "google", name: "Gemini Pro", contextWindow: 32768 },
      { id: "gemini-pro-vision", provider: "google", name: "Gemini Pro Vision", contextWindow: 16384 }
    );
  }

  return models;
}

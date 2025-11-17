import axios from "axios";
import dotenv from "dotenv";
import { z } from "zod";
import type { SamplingClient } from "./SamplingClient.js";
import type { SamplingMessage, TextContent } from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

// Log module initialization to STDERR (will show in logs)
console.error("[sampling-service] ===== MODULE LOADED =====");

/**
 * Convert Zod schema to JSON Schema (simplified implementation)
 * For production, consider using zod-to-json-schema library
 */
function zodToJsonSchema(schema: z.ZodType<any>): any {
  // Basic conversion - can be enhanced with full zod-to-json-schema library
  try {
    // For now, return a permissive schema that allows the LLM to structure output
    // In production, implement full Zod to JSON Schema conversion
    return {
      type: "object",
      properties: {},
      additionalProperties: true
    };
  } catch (error) {
    console.error("Failed to convert Zod schema to JSON Schema:", error);
    return { type: "object", additionalProperties: true };
  }
}

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
  includeContext?: "none" | "thisServer" | "allServers";
  
  // Structured output support
  structuredOutput?: {
    schema: z.ZodType<any>;
    name?: string;
    description?: string;
    strict?: boolean;
  };
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
  
  // Structured output result
  structuredData?: any;
}

// Global MCP sampling client (set by index.ts)
let mcpSamplingClient: SamplingClient | null = null;

/**
 * Set the MCP sampling client for use by agents
 * This allows agents to use the client's LLM instead of API keys
 */
export function setMCPSamplingClient(client: SamplingClient | null): void {
  console.error(`[setMCPSamplingClient] CALLED - Setting client to: ${client ? 'NOT NULL' : 'NULL'}`);
  console.error(`[setMCPSamplingClient] Client type: ${typeof client}`);
  mcpSamplingClient = client;
  console.error(`[setMCPSamplingClient] Global variable after set: ${mcpSamplingClient ? 'NOT NULL' : 'NULL'}`);
}

/**
 * Perform AI sampling using configured provider
 * Prefers MCP sampling if available, falls back to API providers
 */
export async function performSampling(config: SamplingConfig): Promise<SamplingResult> {
  const model = config.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku";
  
  console.error(`\n========== [performSampling] START ==========`);
  console.error(`[performSampling] Called with model: ${model}`);
  console.error(`[performSampling] MCP client variable state: ${mcpSamplingClient ? 'NOT NULL' : 'NULL'}`);
  console.error(`[performSampling] MCP client type: ${typeof mcpSamplingClient}`);
  
  // FIRST: Try MCP sampling if client is available
  if (mcpSamplingClient) {
    try {
      console.error('[performSampling] Attempting MCP sampling...');
      const result = await sampleViaMCP(config, model);
      console.error('[performSampling] MCP sampling SUCCESS!');
      return result;
    } catch (error) {
      console.error("[performSampling] MCP sampling failed with error:");
      console.error(JSON.stringify(error, null, 2));
      console.error(`[performSampling] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[performSampling] Stack: ${error instanceof Error ? error.stack : 'no stack'}`);
      // Fall through to API providers
    }
  } else {
    console.error('[performSampling] ❌ NO MCP CLIENT - falling back to API providers');
  }
  console.error(`========== [performSampling] END ==========\n`);
  
  // FALLBACK: Use API providers based on model name
  if (model.startsWith("gpt-") || model.startsWith("o1-")) {
    return await sampleOpenAI(config, model);
  } else if (model.startsWith("claude-")) {
    return await sampleAnthropic(config, model);
  } else if (model.startsWith("gemini-")) {
    return await sampleGoogle(config, model);
  } else if (model.startsWith("grok-")) {
    return await sampleXAI(config, model);
  } else {
    // Default to OpenAI-compatible API
    return await sampleOpenAI(config, model);
  }
}

/**
 * Sample using MCP client (delegates to connected client's LLM)
 */
async function sampleViaMCP(config: SamplingConfig, model: string): Promise<SamplingResult> {
  console.error('[sampleViaMCP] Starting MCP sampling');
  console.error(`[sampleViaMCP] MCP client: ${mcpSamplingClient ? 'available' : 'null'}`);
  
  if (!mcpSamplingClient) {
    throw new Error("MCP sampling client not available");
  }

  // Separate system messages from user/assistant messages
  const systemMessages = config.messages.filter(m => m.role === "system");
  const conversationMessages = config.messages.filter(m => m.role !== "system");

  // Convert conversation messages to MCP format
  const mcpMessages: SamplingMessage[] = conversationMessages.map(msg => ({
    role: msg.role as "user" | "assistant",
    content: {
      type: "text",
      text: msg.content
    } as TextContent
  }));

  // Combine system messages into system prompt
  const systemPrompt = systemMessages.length > 0
    ? systemMessages.map(m => m.content).join("\n\n")
    : undefined;

  console.error('[sampleViaMCP] Calling samplingClient.sample()...');
  
  // Execute MCP sampling with tool access if requested
  const result = await mcpSamplingClient.sample({
    messages: mcpMessages,
    systemPrompt,
    maxTokens: config.maxTokens ?? 4000,
    temperature: config.temperature ?? 0.7,
    topP: config.topP ?? 1.0,
    includeContext: config.includeContext ?? (config.enabledTools && config.enabledTools.length > 0 ? "thisServer" : undefined)
  });

  console.error('[sampleViaMCP] Sample complete, got result');

  // Extract content from result
  let content = "";
  if (result.content) {
    if (result.content.type === "text") {
      content = result.content.text;
    } else {
      content = JSON.stringify(result.content);
    }
  }

  // Parse structured output if requested
  let structuredData: any = undefined;
  if (config.structuredOutput && content) {
    try {
      // Try to extract JSON from content (might have markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                        content.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        const validated = config.structuredOutput.schema.parse(parsed);
        structuredData = validated;
      }
    } catch (error) {
      console.error("Failed to parse/validate structured output from MCP:", error);
      // Still return the content, but without structured data
    }
  }

  // Estimate token usage (MCP doesn't provide this)
  const estimatedPromptTokens = Math.ceil(config.messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4);
  const estimatedCompletionTokens = Math.ceil(content.length / 4);

  return {
    content,
    model: result.model || model,
    usage: {
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: estimatedPromptTokens + estimatedCompletionTokens
    },
    finishReason: result.stopReason || "stop",
    structuredData
  };
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
    const requestBody: any = {
      model,
      messages: config.messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4000,
      top_p: config.topP ?? 1.0,
      stop: config.stopSequences
    };

    // Add structured output if requested (OpenAI's response_format)
    if (config.structuredOutput) {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: {
          name: config.structuredOutput.name || "response",
          description: config.structuredOutput.description || "Structured response",
          schema: zodToJsonSchema(config.structuredOutput.schema),
          strict: config.structuredOutput.strict ?? true
        }
      };
    }

    const response = await axios.post(
      `${baseURL}/chat/completions`,
      requestBody,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const choice = response.data.choices[0];
    const content = choice.message.content;
    
    // Parse structured output if requested
    let structuredData: any = undefined;
    if (config.structuredOutput && content) {
      try {
        const parsed = JSON.parse(content);
        const validated = config.structuredOutput.schema.parse(parsed);
        structuredData = validated;
      } catch (error) {
        console.error("Failed to parse/validate structured output:", error);
        // Still return the content, but without structured data
      }
    }
    
    return {
      content,
      model: response.data.model,
      usage: {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens
      },
      finishReason: choice.finish_reason,
      structuredData
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
 * Sample using xAI (Grok) API
 */
async function sampleXAI(config: SamplingConfig, model: string): Promise<SamplingResult> {
  const apiKey = process.env.XAI_API_KEY;
  const baseURL = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
  
  if (!apiKey) {
    throw new Error("XAI_API_KEY not configured");
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
      model,
      usage: {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0
      },
      finishReason: choice.finish_reason
    };

  } catch (error: any) {
    throw new Error(`xAI sampling failed: ${error.response?.data?.error?.message || error.message}`);
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
      { id: "gpt-5", provider: "openai", name: "GPT-5", contextWindow: 256000 },
      { id: "gpt-5-mini", provider: "openai", name: "GPT-5 Mini", contextWindow: 128000 },
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
      { id: "claude-4.5-sonnet", provider: "anthropic", name: "Claude 4.5 Sonnet", contextWindow: 200000 },
      { id: "claude-sonnet-4.5-haiku", provider: "anthropic", name: "Claude Sonnet 4.5 Haiku", contextWindow: 200000 },
      { id: "claude-3-opus-20240229", provider: "anthropic", name: "Claude 3 Opus", contextWindow: 200000 },
      { id: "claude-3-sonnet-20240229", provider: "anthropic", name: "Claude 3 Sonnet", contextWindow: 200000 },
      { id: "claude-3-haiku-20240307", provider: "anthropic", name: "Claude 3 Haiku", contextWindow: 200000 }
    );
  }

  // Google models
  if (process.env.GOOGLE_AI_API_KEY) {
    models.push(
      { id: "gemini-2.5-pro", provider: "google", name: "Gemini 2.5 Pro", contextWindow: 2000000 },
      { id: "gemini-pro", provider: "google", name: "Gemini Pro", contextWindow: 32768 },
      { id: "gemini-pro-vision", provider: "google", name: "Gemini Pro Vision", contextWindow: 16384 }
    );
  }

  // xAI models (Grok)
  if (process.env.XAI_API_KEY) {
    models.push(
      { id: "grok-code-fast", provider: "xai", name: "Grok Code Fast", contextWindow: 131072 }
    );
  }

  return models;
}

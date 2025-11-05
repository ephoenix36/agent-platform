/**
 * Sampling Manager for Client LLM Token Sampling
 * 
 * Handles requests for token sampling from the MCP client,
 * maintaining sampling history and managing async sampling operations.
 */

import { randomUUID } from 'crypto';

export interface SamplingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SamplingRequest {
  id: string;
  messages: SamplingMessage[];
  maxTokens: number;
  temperature: number;
  stopSequences?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SamplingResult {
  requestId: string;
  content: string;
  tokensUsed: number;
  finishReason: 'stop' | 'length' | 'error';
  model?: string;
  timestamp: string;
  error?: string;
}

export interface RequestSamplingParams {
  messages: SamplingMessage[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  metadata?: Record<string, any>;
}

export class SamplingManager {
  private requests: Map<string, SamplingRequest> = new Map();
  private results: Map<string, SamplingResult> = new Map();

  /**
   * Request token sampling from the client
   * 
   * Note: In a real MCP implementation, this would use the sampling capability
   * to request the client to perform LLM sampling. For now, this is a placeholder
   * that tracks requests.
   */
  async requestSampling(params: RequestSamplingParams): Promise<SamplingRequest> {
    const request: SamplingRequest = {
      id: randomUUID(),
      messages: params.messages,
      maxTokens: params.maxTokens || 1000,
      temperature: params.temperature || 0.7,
      stopSequences: params.stopSequences,
      metadata: params.metadata,
      createdAt: new Date().toISOString()
    };

    this.requests.set(request.id, request);

    // In a real implementation, this would trigger the MCP sampling capability
    // For now, we simulate a response
    const simulatedResult = await this.simulateSampling(request);
    this.results.set(request.id, simulatedResult);

    return request;
  }

  /**
   * Get sampling result
   */
  async getResult(requestId: string): Promise<SamplingResult | null> {
    return this.results.get(requestId) || null;
  }

  /**
   * Get sampling request details
   */
  async getRequest(requestId: string): Promise<SamplingRequest | null> {
    return this.requests.get(requestId) || null;
  }

  /**
   * List recent sampling requests
   */
  async listRequests(limit: number = 20): Promise<SamplingRequest[]> {
    const requests = Array.from(this.requests.values());
    
    // Sort by creation time (most recent first)
    requests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return requests.slice(0, limit);
  }

  /**
   * Get sampling statistics
   */
  async getStatistics(): Promise<{
    totalRequests: number;
    successfulSamples: number;
    failedSamples: number;
    averageTokens: number;
    totalTokensUsed: number;
  }> {
    const results = Array.from(this.results.values());
    
    const successful = results.filter(r => r.finishReason !== 'error');
    const failed = results.filter(r => r.finishReason === 'error');
    const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
    const avgTokens = results.length > 0 ? totalTokens / results.length : 0;

    return {
      totalRequests: this.requests.size,
      successfulSamples: successful.length,
      failedSamples: failed.length,
      averageTokens: avgTokens,
      totalTokensUsed: totalTokens
    };
  }

  /**
   * Clear old requests (cleanup)
   */
  async clearOldRequests(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    let cleared = 0;
    for (const [id, request] of this.requests.entries()) {
      if (new Date(request.createdAt) < cutoffTime) {
        this.requests.delete(id);
        this.results.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Simulate sampling (placeholder for real MCP sampling capability)
   * 
   * In a real implementation, this would use the MCP protocol's sampling
   * feature to request the client to perform LLM sampling.
   */
  private async simulateSampling(request: SamplingRequest): Promise<SamplingResult> {
    // This is a placeholder. In real usage, the MCP client would handle sampling.
    
    // Extract the last user message for context
    const lastUserMessage = [...request.messages]
      .reverse()
      .find(m => m.role === 'user');

    const simulatedContent = `[SIMULATED RESPONSE] This is a placeholder response to: "${
      lastUserMessage?.content.substring(0, 50) || 'unknown request'
    }..."

In a production MCP server, this would use the sampling capability to request
the client to perform actual LLM token sampling. The client would return the
generated tokens, which would then be processed and returned here.`;

    return {
      requestId: request.id,
      content: simulatedContent,
      tokensUsed: 150, // Simulated
      finishReason: 'stop',
      model: 'simulated-model',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process external sampling result (for when real sampling is implemented)
   */
  async processSamplingResult(
    requestId: string,
    content: string,
    tokensUsed: number,
    finishReason: 'stop' | 'length' | 'error',
    model?: string,
    error?: string
  ): Promise<SamplingResult> {
    const result: SamplingResult = {
      requestId,
      content,
      tokensUsed,
      finishReason,
      model,
      timestamp: new Date().toISOString(),
      error
    };

    this.results.set(requestId, result);
    return result;
  }

  /**
   * Create a conversation context from messages
   */
  async createConversationContext(messages: SamplingMessage[]): Promise<string> {
    return messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
  }

  /**
   * Validate sampling request
   */
  validateRequest(params: RequestSamplingParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.messages || params.messages.length === 0) {
      errors.push('Messages array is required and must not be empty');
    }

    if (params.maxTokens && (params.maxTokens < 1 || params.maxTokens > 4000)) {
      errors.push('maxTokens must be between 1 and 4000');
    }

    if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
      errors.push('temperature must be between 0 and 2');
    }

    // Validate message structure
    if (params.messages) {
      params.messages.forEach((msg, idx) => {
        if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
          errors.push(`Message ${idx}: role must be 'user', 'assistant', or 'system'`);
        }
        if (!msg.content || typeof msg.content !== 'string') {
          errors.push(`Message ${idx}: content is required and must be a string`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Sampling Client Test Suite
 * 
 * Tests for MCP sampling integration with retry logic,
 * timeout handling, and response caching.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SamplingClient } from '../../src/services/SamplingClient.js';
import type { 
  CreateMessageRequest,
  CreateMessageResult,
  TextContent,
  SamplingMessage
} from '@modelcontextprotocol/sdk/types.js';

// Mock MCP Server class
class MockMcpServer {
  public requestSamplingHandler: ((request: CreateMessageRequest) => Promise<CreateMessageResult>) | null = null;

  setRequestHandler(
    schema: { method: string },
    handler: (request: CreateMessageRequest) => Promise<CreateMessageResult>
  ) {
    if (schema.method === 'sampling/createMessage') {
      this.requestSamplingHandler = handler;
    }
  }

  async createMessage(request: CreateMessageRequest): Promise<CreateMessageResult> {
    if (!this.requestSamplingHandler) {
      throw new Error('Sampling not supported by client');
    }
    return this.requestSamplingHandler(request);
  }
}

describe('SamplingClient', () => {
  let samplingClient: SamplingClient;
  let mockServer: MockMcpServer;

  beforeEach(() => {
    mockServer = new MockMcpServer();
    samplingClient = new SamplingClient(mockServer as any, 200); // 200ms cache TTL for testing
  });

  describe('Basic Sampling', () => {
    it('should successfully execute sampling request', async () => {
      const mockResponse: CreateMessageResult = {
        model: 'gpt-4',
        role: 'assistant',
        content: {
          type: 'text',
          text: 'Hello from LLM'
        } as TextContent,
        stopReason: 'endTurn'
      };

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => mockResponse
      );

      const messages: SamplingMessage[] = [
        {
          role: 'user',
          content: { type: 'text', text: 'Hello' } as TextContent
        }
      ];

      const result = await samplingClient.sample({
        messages,
        maxTokens: 100
      });

      expect(result).toEqual(mockResponse);
    });

    it('should include system prompt when provided', async () => {
      let capturedRequest: CreateMessageRequest | undefined;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async (request) => {
          capturedRequest = request;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: 'Response' } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      await samplingClient.sample({
        messages: [
          { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
        ],
        systemPrompt: 'You are a helpful assistant',
        maxTokens: 100
      });

      expect(capturedRequest?.params?.systemPrompt).toBe('You are a helpful assistant');
    });

    it('should pass temperature and top_p parameters', async () => {
      let capturedRequest: CreateMessageRequest | undefined;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async (request) => {
          capturedRequest = request;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: 'Response' } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      await samplingClient.sample({
        messages: [
          { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
        ],
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9
      });

      expect(capturedRequest?.params?.temperature).toBe(0.7);
      expect(capturedRequest?.params?.topP).toBe(0.9);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      let attemptCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Transient network error');
          }
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: 'Success after retries' } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      const result = await samplingClient.sample({
        messages: [
          { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
        ],
        maxTokens: 100
      });

      expect(attemptCount).toBe(3);
      expect((result.content as TextContent).text).toBe('Success after retries');
    });

    it('should fail after max retries exceeded', async () => {
      let attemptCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          attemptCount++;
          throw new Error('Persistent failure');
        }
      );

      await expect(
        samplingClient.sample({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
          ],
          maxTokens: 100
        })
      ).rejects.toThrow('Sampling failed after 3 attempts');

      expect(attemptCount).toBe(3);
    });

    it('should use exponential backoff between retries', async () => {
      const timestamps: number[] = [];

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          timestamps.push(Date.now());
          if (timestamps.length < 3) {
            throw new Error('Retry needed');
          }
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: 'Success' } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      await samplingClient.sample({
        messages: [
          { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
        ],
        maxTokens: 100
      });

      // Check backoff delays (100ms, 200ms)
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];

      expect(delay1).toBeGreaterThanOrEqual(80); // ~100ms with tolerance
      expect(delay1).toBeLessThan(150);
      expect(delay2).toBeGreaterThanOrEqual(180); // ~200ms with tolerance
      expect(delay2).toBeLessThan(250);
    });

    it('should allow custom retry count', async () => {
      let attemptCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          attemptCount++;
          throw new Error('Always fails');
        }
      );

      await expect(
        samplingClient.sample({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
          ],
          maxTokens: 100,
          retries: 5
        })
      ).rejects.toThrow('Sampling failed after 5 attempts');

      expect(attemptCount).toBe(5);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout if sampling takes too long', async () => {
      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 2000));
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: 'Too slow' } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      const startTime = Date.now();

      await expect(
        samplingClient.sample({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
          ],
          maxTokens: 100,
          timeout: 500, // 500ms timeout
          retries: 1 // Only 1 attempt to avoid waiting for retries
        })
      ).rejects.toThrow();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(800); // Should timeout around 500ms
    });

    it('should use default timeout of 30s', async () => {
      // This test verifies the timeout configuration exists
      // Full 30s test would be too slow
      const config = samplingClient.getConfig();
      expect(config.defaultTimeout).toBe(30000);
    });

    it('should not timeout for fast responses', async () => {
      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: 'Fast response' } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      await expect(
        samplingClient.sample({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
          ],
          maxTokens: 100,
          timeout: 5000
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Response Caching', () => {
    it('should cache identical requests', async () => {
      let callCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          callCount++;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: `Response ${callCount}` } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      const request = {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'Same question' } as TextContent }
        ],
        maxTokens: 100
      };

      const result1 = await samplingClient.sample(request);
      const result2 = await samplingClient.sample(request);

      // Should only call once, second is cached
      expect(callCount).toBe(1);
      expect(result1).toEqual(result2);
      expect((result1.content as TextContent).text).toBe('Response 1');
    });

    it('should not cache different requests', async () => {
      let callCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          callCount++;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: `Response ${callCount}` } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      await samplingClient.sample({
        messages: [
          { role: 'user', content: { type: 'text', text: 'Question 1' } as TextContent }
        ],
        maxTokens: 100
      });

      await samplingClient.sample({
        messages: [
          { role: 'user', content: { type: 'text', text: 'Question 2' } as TextContent }
        ],
        maxTokens: 100
      });

      expect(callCount).toBe(2);
    });

    it('should respect cache TTL', async () => {
      let callCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          callCount++;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: `Response ${callCount}` } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      const request = {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'Test' } as TextContent }
        ],
        maxTokens: 100
      };

      await samplingClient.sample(request);
      
      // Wait for cache to expire (200ms TTL for testing)
      await new Promise(resolve => setTimeout(resolve, 250));
      
      await samplingClient.sample(request);

      // Should call twice due to cache expiration
      expect(callCount).toBe(2);
    }, 10000);

    it('should allow disabling cache', async () => {
      let callCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          callCount++;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: `Response ${callCount}` } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      const request = {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'No cache' } as TextContent }
        ],
        maxTokens: 100,
        skipCache: true
      };

      await samplingClient.sample(request);
      await samplingClient.sample(request);

      // Should call twice, cache disabled
      expect(callCount).toBe(2);
    });
  });

  describe('Streaming Support', () => {
    it('should indicate streaming capability', () => {
      const config = samplingClient.getConfig();
      expect(config.supportsStreaming).toBe(true);
    });

    it('should handle streaming responses (future feature)', async () => {
      // Placeholder test for streaming implementation
      // MCP SDK supports streaming, but implementation is deferred
      expect(samplingClient.sample).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP client not supporting sampling', async () => {
      const noSamplingClient = new SamplingClient({} as any);

      await expect(
        noSamplingClient.sample({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
          ],
          maxTokens: 100
        })
      ).rejects.toThrow('Sampling not supported by client');
    });

    it('should validate request parameters', async () => {
      await expect(
        samplingClient.sample({
          messages: [],
          maxTokens: 100
        })
      ).rejects.toThrow('At least one message required');
    });

    it('should handle malformed responses gracefully', async () => {
      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          return {} as any; // Malformed response
        }
      );

      await expect(
        samplingClient.sample({
          messages: [
            { role: 'user', content: { type: 'text', text: 'Test' } as TextContent }
          ],
          maxTokens: 100
        })
      ).rejects.toThrow('Invalid sampling response');
    });
  });

  describe('Cache Management', () => {
    it('should allow clearing cache', async () => {
      let callCount = 0;

      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => {
          callCount++;
          return {
            model: 'gpt-4',
            role: 'assistant',
            content: { type: 'text', text: `Response ${callCount}` } as TextContent,
            stopReason: 'endTurn'
          };
        }
      );

      const request = {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'Test' } as TextContent }
        ],
        maxTokens: 100
      };

      await samplingClient.sample(request);
      samplingClient.clearCache();
      await samplingClient.sample(request);

      expect(callCount).toBe(2);
    });

    it('should track cache hit rate', async () => {
      mockServer.setRequestHandler(
        { method: 'sampling/createMessage' },
        async () => ({
          model: 'gpt-4',
          role: 'assistant',
          content: { type: 'text', text: 'Response' } as TextContent,
          stopReason: 'endTurn'
        })
      );

      const request = {
        messages: [
          { role: 'user' as const, content: { type: 'text' as const, text: 'Test' } as TextContent }
        ],
        maxTokens: 100
      };

      await samplingClient.sample(request);
      await samplingClient.sample(request);
      await samplingClient.sample(request);

      const stats = samplingClient.getCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });
  });
});

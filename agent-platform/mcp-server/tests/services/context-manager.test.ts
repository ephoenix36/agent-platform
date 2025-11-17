/**
 * Context Manager Service - Test Suite
 * 
 * Tests for smart context optimization, truncation, and summarization
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ContextManager, ContextStrategy, TruncationMethod } from '../../../src/services/context-manager.js';

describe('ContextManager Service', () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = new ContextManager();
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for text', () => {
      const text = "Hello world, this is a test message.";
      const tokens = manager.estimateTokens(text);
      
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20);  // Should be around 8-10 tokens
    });

    it('should handle longer text', () => {
      const longText = "This is a much longer piece of text that should contain significantly more tokens than a short message. ".repeat(10);
      const tokens = manager.estimateTokens(longText);
      
      expect(tokens).toBeGreaterThan(100);
    });

    it('should estimate tokens for conversation', () => {
      const conversation = [
        { role: 'user' as const, content: 'Hello!' },
        { role: 'assistant' as const, content: 'Hi there! How can I help you?' },
        { role: 'user' as const, content: 'Tell me about TypeScript.' }
      ];

      const tokens = manager.estimateTokens(conversation);
      
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('analyzeContext', () => {
    it('should analyze conversation context', async () => {
      const context = [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'What is TypeScript?' },
        { role: 'assistant' as const, content: 'TypeScript is a superset of JavaScript...' },
        { role: 'user' as const, content: 'Can you give me an example?' }
      ];

      const analysis = await manager.analyzeContext(context, 'gpt-4');
      
      expect(analysis.totalTokens).toBeGreaterThan(0);
      expect(analysis.messages).toHaveLength(4);
      expect(analysis.estimatedCost).toBeGreaterThan(0);
      expect(analysis.recommendations).toBeDefined();
    });

    it('should detect oversized context', async () => {
      const longContext = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: 'This is a message. '.repeat(100)
      }));

      const analysis = await manager.analyzeContext(longContext, 'gpt-4');
      
      expect(analysis.recommendations).toContain('Context is large');
    });
  });

  describe('optimizeContext', () => {
    it('should optimize using sliding window strategy', async () => {
      const context = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`
      }));

      const strategy: ContextStrategy = {
        id: 'test',
        name: 'Test Strategy',
        maxTokens: 1000,
        truncationMethod: 'sliding_window',
        preserveSystemPrompt: true,
        preserveRecentMessages: 5
      };

      const optimized = await manager.optimizeContext(context, strategy);
      
      expect(optimized.length).toBeLessThanOrEqual(context.length);
      expect(optimized.length).toBeGreaterThan(0);
    });

    it('should preserve system prompt', async () => {
      const context = [
        { role: 'system' as const, content: 'IMPORTANT SYSTEM PROMPT' },
        ...Array.from({ length: 10 }, (_, i) => ({
          role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: `Message ${i}`
        }))
      ];

      const strategy: ContextStrategy = {
        id: 'test',
        name: 'Test Strategy',
        maxTokens: 500,
        truncationMethod: 'sliding_window',
        preserveSystemPrompt: true,
        preserveRecentMessages: 3
      };

      const optimized = await manager.optimizeContext(context, strategy);
      
      expect(optimized[0].role).toBe('system');
      expect(optimized[0].content).toBe('IMPORTANT SYSTEM PROMPT');
    });

    it('should keep recent messages', async () => {
      const context = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`
      }));

      const strategy: ContextStrategy = {
        id: 'test',
        name: 'Test Strategy',
        maxTokens: 500,
        truncationMethod: 'sliding_window',
        preserveSystemPrompt: false,
        preserveRecentMessages: 5
      };

      const optimized = await manager.optimizeContext(context, strategy);
      
      // Should include the most recent messages
      const lastMessage = optimized[optimized.length - 1];
      expect(lastMessage.content).toContain('Message 19');
    });
  });

  describe('truncateContext', () => {
    it('should truncate to token limit', async () => {
      const context = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: 'This is a test message. '.repeat(10)
      }));

      const truncated = await manager.truncateContext(context, 'sliding_window', 1000);
      
      const tokens = manager.estimateTokens(truncated);
      expect(tokens).toBeLessThanOrEqual(1000);
    });

    it('should handle keep_important truncation', async () => {
      const context = [
        { role: 'user' as const, content: 'Very important question about the project requirements' },
        { role: 'assistant' as const, content: 'Sure, let me explain...' },
        { role: 'user' as const, content: 'Ok' },
        { role: 'assistant' as const, content: 'Right' },
        { role: 'user' as const, content: 'What about the critical security issue?' }
      ];

      const truncated = await manager.truncateContext(context, 'keep_important', 500);
      
      // Important messages should be kept
      expect(truncated.some(m => m.content.includes('important'))).toBe(true);
      expect(truncated.some(m => m.content.includes('critical'))).toBe(true);
    });
  });

  describe('summarizeContext', () => {
    it('should summarize older messages', async () => {
      const context = [
        { role: 'user' as const, content: 'Tell me about machine learning' },
        { role: 'assistant' as const, content: 'Machine learning is a subset of AI...' },
        { role: 'user' as const, content: 'What are neural networks?' },
        { role: 'assistant' as const, content: 'Neural networks are computational models...' },
        { role: 'user' as const, content: 'Can you show an example?' }
      ];

      const summarized = await manager.summarizeContext(context, 3);
      
      expect(summarized.length).toBeLessThan(context.length);
      expect(summarized.some(m => m.role === 'system' && m.content.includes('Previous conversation'))).toBe(true);
    });

    it('should preserve recent messages in summary', async () => {
      const context = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`
      }));

      const keepRecent = 3;
      const summarized = await manager.summarizeContext(context, keepRecent);
      
      // Last 3 messages should be preserved
      const lastMessages = summarized.slice(-keepRecent);
      expect(lastMessages.length).toBe(keepRecent);
      expect(lastMessages[lastMessages.length - 1].content).toContain('Message 9');
    });
  });

  describe('calculateImportance', () => {
    it('should assign higher importance to questions', () => {
      const question = "What is the most important requirement?";
      const statement = "Ok, got it.";
      
      const questionImportance = manager.calculateImportance(question);
      const statementImportance = manager.calculateImportance(statement);
      
      expect(questionImportance).toBeGreaterThan(statementImportance);
    });

    it('should assign higher importance to longer messages', () => {
      const short = "Ok";
      const long = "Let me explain this complex concept in detail with multiple examples and thorough explanations.";
      
      const shortImportance = manager.calculateImportance(short);
      const longImportance = manager.calculateImportance(long);
      
      expect(longImportance).toBeGreaterThan(shortImportance);
    });

    it('should detect keywords', () => {
      const withKeywords = "This is a critical security issue that needs immediate attention.";
      const generic = "This is a message.";
      
      const keywordImportance = manager.calculateImportance(withKeywords);
      const genericImportance = manager.calculateImportance(generic);
      
      expect(keywordImportance).toBeGreaterThan(genericImportance);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for context', () => {
      const context = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' }
      ];

      const cost = manager.estimateCost(context, 'gpt-4');
      
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should calculate different costs for different models', () => {
      const context = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: 'Test message. '.repeat(50)
      }));

      const gpt4Cost = manager.estimateCost(context, 'gpt-4');
      const gpt35Cost = manager.estimateCost(context, 'gpt-3.5-turbo');
      
      expect(gpt4Cost).toBeGreaterThan(gpt35Cost);
    });
  });

  describe('predefined strategies', () => {
    it('should have efficient strategy for cost savings', () => {
      const strategy = manager.getStrategy('efficient');
      
      expect(strategy).toBeDefined();
      expect(strategy.truncationMethod).toBe('summarize');
    });

    it('should have quality strategy for thorough conversations', () => {
      const strategy = manager.getStrategy('quality');
      
      expect(strategy).toBeDefined();
      expect(strategy.maxTokens).toBeGreaterThan(8000);
    });

    it('should have balanced strategy', () => {
      const strategy = manager.getStrategy('balanced');
      
      expect(strategy).toBeDefined();
      expect(strategy.truncationMethod).toBe('sliding_window');
    });
  });
});

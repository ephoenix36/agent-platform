/**
 * Context Manager Service
 * 
 * Provides smart context optimization, truncation, and token management
 */

import { Logger } from "../utils/logging.js";
import { getUsageTracker } from "./usage-tracker.js";

export type TruncationMethod = 'sliding_window' | 'summarize' | 'keep_important';

/**
 * Context strategy interface
 */
export interface ContextStrategy {
  id: string;
  name: string;
  maxTokens: number;
  truncationMethod: TruncationMethod;
  compressionRatio?: number;
  preserveSystemPrompt: boolean;
  preserveRecentMessages: number;
}

/**
 * Context analysis result
 */
export interface ContextAnalysis {
  totalTokens: number;
  estimatedCost: number;
  messages: Array<{
    role: string;
    tokens: number;
    importance: number;
  }>;
  recommendations: string[];
}

/**
 * Message interface
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Predefined optimization strategies
 */
const PREDEFINED_STRATEGIES: Record<string, ContextStrategy> = {
  efficient: {
    id: 'efficient',
    name: 'Efficient (Cost-Optimized)',
    maxTokens: 4000,
    truncationMethod: 'summarize',
    compressionRatio: 0.5,
    preserveSystemPrompt: true,
    preserveRecentMessages: 3
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    maxTokens: 8000,
    truncationMethod: 'sliding_window',
    preserveSystemPrompt: true,
    preserveRecentMessages: 8
  },
  quality: {
    id: 'quality',
    name: 'Quality (Preserve Context)',
    maxTokens: 16000,
    truncationMethod: 'keep_important',
    preserveSystemPrompt: true,
    preserveRecentMessages: 20
  }
};

/**
 * Context Manager Service
 */
export class ContextManager {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console as any;
  }

  /**
   * Estimate token count for text or messages
   * Uses a simple heuristic: ~4 characters per token
   */
  estimateTokens(input: string | Message[]): number {
    if (typeof input === 'string') {
      // Simple estimation: 4 chars ≈ 1 token
      // This is rough but fast; for production, use tiktoken
      return Math.ceil(input.length / 4);
    }

    // For messages, sum up all content
    return input.reduce((total, msg) => {
      return total + this.estimateTokens(msg.content);
    }, 0);
  }

  /**
   * Analyze context and provide recommendations
   */
  async analyzeContext(context: Message[], model: string): Promise<ContextAnalysis> {
    const messages = context.map(msg => {
      const tokens = this.estimateTokens(msg.content);
      const importance = this.calculateImportance(msg.content);
      
      return {
        role: msg.role,
        tokens,
        importance
      };
    });

    const totalTokens = messages.reduce((sum, m) => sum + m.tokens, 0);
    const estimatedCost = this.estimateCost(context, model);

    const recommendations: string[] = [];

    // Generate recommendations
    if (totalTokens > 8000) {
      recommendations.push('Context is large (>8000 tokens). Consider using summarization or truncation.');
    }

    if (totalTokens > 16000) {
      recommendations.push('Context exceeds 16K tokens. Some models may not support this length.');
    }

    const lowImportanceCount = messages.filter(m => m.importance < 0.3).length;
    if (lowImportanceCount > messages.length * 0.3) {
      recommendations.push(`${lowImportanceCount} messages have low importance. Consider removing them.`);
    }

    if (estimatedCost > 0.1) {
      recommendations.push(`Estimated cost is high ($${estimatedCost.toFixed(3)}). Consider optimization.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Context size is optimal.');
    }

    return {
      totalTokens,
      estimatedCost,
      messages,
      recommendations
    };
  }

  /**
   * Optimize context using a strategy
   */
  async optimizeContext(context: Message[], strategy: ContextStrategy): Promise<Message[]> {
    const currentTokens = this.estimateTokens(context);

    if (currentTokens <= strategy.maxTokens) {
      return context;  // Already under limit
    }

    this.logger.info?.(`[Context] Optimizing: ${currentTokens} → ${strategy.maxTokens} tokens using ${strategy.truncationMethod}`);

    return await this.truncateContext(
      context,
      strategy.truncationMethod,
      strategy.maxTokens,
      strategy.preserveSystemPrompt,
      strategy.preserveRecentMessages
    );
  }

  /**
   * Truncate context to fit token limit
   */
  async truncateContext(
    context: Message[],
    method: TruncationMethod,
    maxTokens: number,
    preserveSystemPrompt: boolean = true,
    preserveRecentMessages: number = 5
  ): Promise<Message[]> {
    // Separate system messages
    const systemMessages = context.filter(m => m.role === 'system');
    const conversationMessages = context.filter(m => m.role !== 'system');

    let result: Message[] = [];

    switch (method) {
      case 'sliding_window':
        result = this.truncateSlidingWindow(
          conversationMessages,
          maxTokens,
          preserveRecentMessages
        );
        break;

      case 'summarize':
        result = await this.summarizeContext(conversationMessages, preserveRecentMessages);
        break;

      case 'keep_important':
        result = this.truncateByImportance(conversationMessages, maxTokens);
        break;
    }

    // Add system prompts back if preserving
    if (preserveSystemPrompt && systemMessages.length > 0) {
      result = [...systemMessages, ...result];
    }

    return result;
  }

  /**
   * Truncate using sliding window (keep recent messages)
   */
  private truncateSlidingWindow(
    messages: Message[],
    maxTokens: number,
    keepCount: number
  ): Message[] {
    // Keep the most recent N messages
    const recent = messages.slice(-keepCount);
    const recentTokens = this.estimateTokens(recent);

    if (recentTokens <= maxTokens) {
      return recent;
    }

    // If still too large, remove oldest of recent messages
    let result = recent;
    while (this.estimateTokens(result) > maxTokens && result.length > 1) {
      result = result.slice(1);
    }

    return result;
  }

  /**
   * Truncate by keeping most important messages
   */
  private truncateByImportance(messages: Message[], maxTokens: number): Message[] {
    // Calculate importance for each message
    const scored = messages.map((msg, index) => ({
      message: msg,
      importance: this.calculateImportance(msg.content),
      tokens: this.estimateTokens(msg.content),
      index
    }));

    // Sort by importance (descending)
    scored.sort((a, b) => b.importance - a.importance);

    // Add messages until we hit token limit
    const result: typeof scored = [];
    let tokenCount = 0;

    for (const item of scored) {
      if (tokenCount + item.tokens <= maxTokens) {
        result.push(item);
        tokenCount += item.tokens;
      }
    }

    // Sort back to original order
    result.sort((a, b) => a.index - b.index);

    return result.map(item => item.message);
  }

  /**
   * Summarize older context, keeping recent messages
   */
  async summarizeContext(messages: Message[], keepRecentCount: number): Promise<Message[]> {
    if (messages.length <= keepRecentCount) {
      return messages;
    }

    const toSummarize = messages.slice(0, -keepRecentCount);
    const recent = messages.slice(-keepRecentCount);

    // Create a summary of older messages
    const summary = this.createSummary(toSummarize);

    return [
      {
        role: 'system',
        content: `Previous conversation summary:\n${summary}`
      },
      ...recent
    ];
  }

  /**
   * Create summary of messages
   */
  private createSummary(messages: Message[]): string {
    const points: string[] = [];

    for (const msg of messages) {
      // Extract key points (very simple extraction)
      const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      if (sentences.length > 0) {
        // Take first significant sentence
        const keyPoint = sentences[0].trim();
        points.push(`- ${msg.role === 'user' ? 'User asked' : 'Assistant responded'}: ${keyPoint.substring(0, 100)}...`);
      }
    }

    return points.slice(0, 10).join('\n') || 'Previous conversation contained general discussion.';
  }

  /**
   * Calculate importance score for a message (0-1)
   */
  calculateImportance(content: string): number {
    let score = 0.5;  // Base score

    // Length factor (longer messages often more important, but with diminishing returns)
    const length = content.length;
    if (length > 200) score += 0.1;
    if (length > 500) score += 0.1;

    // Question factor
    if (content.includes('?')) score += 0.15;
    if (content.match(/what|how|why|when|where|which|who/i)) score += 0.1;

    // Keyword factor (important terms)
    const importantKeywords = [
      'important', 'critical', 'urgent', 'required', 'must', 'need',
      'error', 'bug', 'issue', 'problem', 'fix',
      'please', 'help', 'explain', 'clarify'
    ];

    const lowerContent = content.toLowerCase();
    for (const keyword of importantKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.05;
      }
    }

    // Brevity penalty (very short messages less important)
    if (length < 20) score -= 0.2;

    // Clamp to 0-1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Estimate cost for context
   */
  estimateCost(context: Message[] | string, model: string): number {
    const tracker = getUsageTracker(this.logger);
    const tokens = this.estimateTokens(context);
    
    // Estimate rough split (60% prompt, 40% completion)
    const promptTokens = Math.round(tokens * 0.6);
    const completionTokens = Math.round(tokens * 0.4);
    
    return tracker.calculateCost(model, promptTokens, completionTokens);
  }

  /**
   * Get a predefined strategy
   */
  getStrategy(id: string): ContextStrategy {
    const strategy = PREDEFINED_STRATEGIES[id];
    if (!strategy) {
      throw new Error(`Unknown strategy: ${id}`);
    }
    return strategy;
  }

  /**
   * List all predefined strategies
   */
  listStrategies(): ContextStrategy[] {
    return Object.values(PREDEFINED_STRATEGIES);
  }
}

// Global instance
let globalManager: ContextManager | null = null;

/**
 * Get or create global context manager
 */
export function getContextManager(logger?: Logger): ContextManager {
  if (!globalManager) {
    globalManager = new ContextManager(logger);
  }
  return globalManager;
}

/**
 * Set global context manager (for testing)
 */
export function setContextManager(manager: ContextManager | null): void {
  globalManager = manager;
}

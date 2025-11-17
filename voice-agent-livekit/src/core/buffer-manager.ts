/**
 * Response Buffer Manager
 * Pre-generates and caches common responses for ultra-low latency
 */

import type {
  PreBufferedResponse,
  PerformanceConfig,
  ConversationMessage,
} from '../types.js';
import { log, PerfTimer } from '../utils/logger.js';
import { EventEmitter } from 'events';

export class BufferManager extends EventEmitter {
  private config: PerformanceConfig;
  private preBufferedResponses: Map<string, PreBufferedResponse> = new Map();
  private responseCache: Map<string, CachedResponse> = new Map();
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };
  
  constructor(config: PerformanceConfig) {
    super();
    this.config = config;
  }
  
  /**
   * Initialize pre-buffered responses
   */
  async initialize(): Promise<void> {
    const timer = new PerfTimer('buffer.initialize');
    
    if (!this.config.enablePreBuffering) {
      log.info('Pre-buffering disabled');
      return;
    }
    
    log.info('Initializing response buffer', {
      bufferSize: this.config.preBufferSize,
    });
    
    // Pre-buffer common greetings and acknowledgments
    await this.preBufferCommonResponses();
    
    timer.end({
      preBufferedCount: this.preBufferedResponses.size,
    });
  }
  
  /**
   * Try to get a pre-buffered response for user input
   */
  getPreBufferedResponse(userInput: string): string | null {
    const normalized = this.normalizeInput(userInput);
    
    // Check for exact matches first
    for (const [trigger, response] of this.preBufferedResponses.entries()) {
      if (typeof trigger === 'string') {
        if (normalized === trigger.toLowerCase()) {
          this.updateResponseUsage(trigger);
          this.cacheStats.hits++;
          log.info('Pre-buffered response hit', {
            trigger,
            usageCount: response.usageCount,
          });
          return response.response;
        }
      }
    }
    
    // Check regex patterns
    for (const [trigger, response] of this.preBufferedResponses.entries()) {
      if (response.trigger instanceof RegExp) {
        if (response.trigger.test(normalized)) {
          this.updateResponseUsage(trigger);
          this.cacheStats.hits++;
          log.info('Pre-buffered response hit (regex)', {
            pattern: response.trigger.source,
            usageCount: response.usageCount,
          });
          return response.response;
        }
      }
    }
    
    this.cacheStats.misses++;
    return null;
  }
  
  /**
   * Cache a generated response for future use
   */
  cacheResponse(input: string, response: string, ttlSeconds: number = 3600): void {
    const normalized = this.normalizeInput(input);
    
    const cached: CachedResponse = {
      input: normalized,
      response,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      hitCount: 0,
    };
    
    // Evict if cache is full
    if (this.responseCache.size >= 100) {
      this.evictLRU();
    }
    
    this.responseCache.set(normalized, cached);
    
    log.debug('Cached response', {
      input: normalized.substring(0, 50),
      cacheSize: this.responseCache.size,
    });
  }
  
  /**
   * Try to get a cached response
   */
  getCachedResponse(input: string): string | null {
    const normalized = this.normalizeInput(input);
    const cached = this.responseCache.get(normalized);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      this.responseCache.delete(normalized);
      return null;
    }
    
    cached.hitCount++;
    this.cacheStats.hits++;
    
    log.info('Cache hit', {
      input: normalized.substring(0, 50),
      hitCount: cached.hitCount,
      age: Math.round(age / 1000),
    });
    
    return cached.response;
  }
  
  /**
   * Add a custom pre-buffered response
   */
  addPreBufferedResponse(
    trigger: string | RegExp,
    response: string,
    priority: number = 5
  ): void {
    const key = typeof trigger === 'string' ? trigger : trigger.source;
    
    const preBuffered: PreBufferedResponse = {
      trigger,
      response,
      priority,
      usageCount: 0,
    };
    
    this.preBufferedResponses.set(key, preBuffered);
    
    log.info('Added pre-buffered response', {
      trigger: key,
      priority,
    });
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    cacheSize: number;
    preBufferedCount: number;
    hitRate: number;
  } {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0
      ? this.cacheStats.hits / totalRequests
      : 0;
    
    return {
      ...this.cacheStats,
      cacheSize: this.responseCache.size,
      preBufferedCount: this.preBufferedResponses.size,
      hitRate,
    };
  }
  
  /**
   * Clear all caches
   */
  clear(): void {
    this.responseCache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    log.info('Cache cleared');
  }
  
  /**
   * Pre-buffer common responses
   */
  private async preBufferCommonResponses(): Promise<void> {
    const commonResponses: Array<{
      trigger: string | RegExp;
      response: string;
      priority: number;
    }> = [
      // Greetings
      {
        trigger: /^(hi|hello|hey|greetings)$/i,
        response: "Hello! How can I assist you today?",
        priority: 10,
      },
      {
        trigger: /^good (morning|afternoon|evening)$/i,
        response: "Good {time}! How can I help you?",
        priority: 9,
      },
      
      // Acknowledgments
      {
        trigger: /^(thanks|thank you|thx)$/i,
        response: "You're welcome! Is there anything else I can help with?",
        priority: 10,
      },
      {
        trigger: /^(ok|okay|alright)$/i,
        response: "Great! What would you like to do next?",
        priority: 8,
      },
      
      // Farewells
      {
        trigger: /^(bye|goodbye|see you|cya)$/i,
        response: "Goodbye! Have a great day!",
        priority: 10,
      },
      
      // Help requests
      {
        trigger: /^(help|what can you do|capabilities)$/i,
        response: "I'm a voice assistant that can help you with various tasks. I can answer questions, execute commands using tools, and collaborate with expert agents to provide the best possible assistance. What would you like to do?",
        priority: 9,
      },
      
      // Affirmations
      {
        trigger: /^(yes|yeah|yep|sure|definitely)$/i,
        response: "Understood. Let's proceed.",
        priority: 7,
      },
      {
        trigger: /^(no|nope|nah|not really)$/i,
        response: "Okay, no problem. What would you like to do instead?",
        priority: 7,
      },
      
      // Common questions
      {
        trigger: /^(how are you|how's it going)$/i,
        response: "I'm functioning well, thank you! How can I help you today?",
        priority: 8,
      },
      {
        trigger: /^what('s| is) your name$/i,
        response: "I'm your voice assistant. You can call me Assistant. How may I help you?",
        priority: 8,
      },
    ];
    
    for (const { trigger, response, priority } of commonResponses) {
      this.addPreBufferedResponse(trigger, response, priority);
    }
    
    log.info('Pre-buffered common responses', {
      count: commonResponses.length,
    });
  }
  
  /**
   * Update usage stats for a response
   */
  private updateResponseUsage(trigger: string): void {
    const response = this.preBufferedResponses.get(trigger);
    if (response) {
      response.usageCount++;
      response.lastUsed = new Date();
    }
  }
  
  /**
   * Normalize user input for matching
   */
  private normalizeInput(input: string): string {
    return input.trim().toLowerCase();
  }
  
  /**
   * Evict least recently used cache entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, cached] of this.responseCache.entries()) {
      const lastAccess = cached.timestamp + (cached.hitCount * 1000);
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.responseCache.delete(oldestKey);
      this.cacheStats.evictions++;
      log.debug('Evicted LRU cache entry', { key: oldestKey });
    }
  }
}

interface CachedResponse {
  input: string;
  response: string;
  timestamp: number;
  ttl: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

/**
 * Specialized Base Node Types
 * Pre-configured base classes for common node patterns
 */

import { z } from 'zod';
import { BaseNode, NodeDefinition, NodeExecutionContext, NodeExecutionResult } from './base';

/**
 * Trigger Node Base
 * For nodes that start workflow execution (webhooks, schedules, events)
 */
export abstract class TriggerNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      ...this.defineTrigger(),
      inputs: [], // Triggers have no inputs
      category: 'triggers'
    };
  }

  /**
   * Define trigger-specific metadata
   */
  protected abstract defineTrigger(): Omit<NodeDefinition, 'inputs' | 'category'>;

  /**
   * Start listening for trigger events
   */
  abstract startListening(): Promise<void>;

  /**
   * Stop listening for trigger events
   */
  abstract stopListening(): Promise<void>;

  protected async onInitialize(): Promise<void> {
    await this.startListening();
  }

  protected async onCleanup(): Promise<void> {
    await this.stopListening();
  }
}

/**
 * Action Node Base
 * For nodes that perform actions (HTTP requests, database operations, API calls)
 */
export abstract class ActionNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      ...this.defineAction(),
      category: 'actions'
    };
  }

  /**
   * Define action-specific metadata
   */
  protected abstract defineAction(): Omit<NodeDefinition, 'category'>;
}

/**
 * Transform Node Base
 * For nodes that transform data (map, filter, aggregate)
 */
export abstract class TransformNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      ...this.defineTransform(),
      category: 'transforms'
    };
  }

  /**
   * Define transform-specific metadata
   */
  protected abstract defineTransform(): Omit<NodeDefinition, 'category'>;
}

/**
 * Condition Node Base
 * For nodes that make decisions (if/else, switch, filter)
 */
export abstract class ConditionNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      ...this.defineCondition(),
      category: 'conditions'
    };
  }

  /**
   * Define condition-specific metadata
   */
  protected abstract defineCondition(): Omit<NodeDefinition, 'category'>;

  /**
   * Evaluate condition
   * Returns true if condition is met, false otherwise
   */
  protected abstract evaluateCondition(
    context: NodeExecutionContext
  ): Promise<boolean>;

  protected async execute(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const result = await this.evaluateCondition(context);
    
    return this.success({
      result,
      met: result
    });
  }
}

/**
 * Iterator Node Base
 * For nodes that process arrays/collections (loop, map, batch)
 */
export abstract class IteratorNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      ...this.defineIterator(),
      category: 'iterators'
    };
  }

  /**
   * Define iterator-specific metadata
   */
  protected abstract defineIterator(): Omit<NodeDefinition, 'category'>;

  /**
   * Process a single item from the collection
   */
  protected abstract processItem(
    item: any,
    index: number,
    context: NodeExecutionContext
  ): Promise<any>;

  protected async execute(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const items = context.inputs.items;
    
    if (!Array.isArray(items)) {
      return this.error('Input "items" must be an array');
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await this.processItem(items[i], i, context);
        results.push(result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ index: i, error: err.message });
        
        // Stop on first error unless configured otherwise
        if (!this.config.continueOnError) {
          return this.error(err, {
            processed: results,
            errors
          });
        }
      }
    }

    return this.success({
      results,
      errors: errors.length > 0 ? errors : undefined,
      count: results.length
    });
  }
}

/**
 * Async Node Base
 * For nodes that perform asynchronous operations with retry logic
 */
export abstract class AsyncNode extends BaseNode {
  protected define(): NodeDefinition {
    const baseDefinition = this.defineAsync();
    
    // Add retry configuration to config schema
    const configSchema = baseDefinition.configSchema.extend({
      retryAttempts: z.number().min(0).max(10).default(3),
      retryDelay: z.number().min(0).default(1000),
      timeout: z.number().min(0).optional()
    });

    return {
      ...baseDefinition,
      configSchema,
      category: 'async'
    };
  }

  /**
   * Define async-specific metadata
   */
  protected abstract defineAsync(): Omit<NodeDefinition, 'category'>;

  /**
   * Execute the async operation
   */
  protected abstract executeAsync(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult>;

  protected async execute(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const { retryAttempts = 3, retryDelay = 1000, timeout } = this.config;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Execute with timeout if configured
        if (timeout) {
          return await this.withTimeout(
            this.executeAsync(context),
            timeout
          );
        }
        
        return await this.executeAsync(context);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        // Last attempt - return error
        if (attempt === retryAttempts) {
          return this.error(err);
        }

        // Wait before retry
        context.log(`Retry attempt ${attempt + 1} after error: ${err.message}`, 'warn');
        await this.delay(retryDelay);
      }
    }

    return this.error('Max retry attempts exceeded');
  }

  /**
   * Execute promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Cache Node Base
 * For nodes that cache results
 */
export abstract class CacheNode extends BaseNode {
  private cache: Map<string, { value: any; timestamp: number }> = new Map();

  /**
   * Generate cache key from context
   */
  protected getCacheKey(context: NodeExecutionContext): string {
    const cacheKey = this.config.cacheKey as string | undefined;
    if (cacheKey) {
      return cacheKey;
    }
    
    // Default: hash of inputs
    return JSON.stringify(context.inputs);
  }

  protected async execute(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult> {
    const cacheEnabled = this.config.cacheEnabled !== false;
    const cacheTTL = (this.config.cacheTTL as number) || 60000;

    if (!cacheEnabled) {
      return this.executeWithoutCache(context);
    }

    const key = this.getCacheKey(context);
    const cached = this.cache.get(key);

    // Check if cached value is still valid
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cacheTTL) {
        context.log('Using cached result', 'info');
        return this.success(cached.value, { fromCache: true });
      }
    }

    // Execute and cache result
    const result = await this.executeWithoutCache(context);
    
    if (result.status === 'success') {
      this.cache.set(key, {
        value: result.outputs,
        timestamp: Date.now()
      });
    }

    return result;
  }

  /**
   * Execute without cache
   */
  protected abstract executeWithoutCache(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult>;

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  protected async onCleanup(): Promise<void> {
    this.clearCache();
  }
}

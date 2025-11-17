/**
 * Standard Hook Implementations
 * 
 * Provides pre-built hooks for common use cases:
 * - LoggingHook: Structured logging for tool execution
 * - MetricsHook: Performance metrics collection
 * - ValidationHook: Input validation
 * - AuthHook: Authentication/authorization
 * - ToolInstrumentor: Wrapper to instrument tools with hooks
 */

import { Hook, HookContext, HookResult } from './types.js';
import { HookManager } from './HookManager.js';

/**
 * LoggingHook - Structured logging for tool execution
 */
export class LoggingHook {
  /**
   * Create a logging hook for tool:before event
   */
  static createBeforeHook(
    id: string,
    logger: (event: string, toolName: string, input: any) => void
  ): Hook {
    return {
      id,
      event: 'tool:before',
      priority: 10, // Low priority - log after other hooks
      type: 'logging',
      handler: async (context: HookContext): Promise<HookResult> => {
        try {
          logger(context.event, context.toolName || 'unknown', context.input);
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    };
  }

  /**
   * Create a logging hook for tool:after event
   */
  static createAfterHook(
    id: string,
    logger: (event: string, toolName: string, output: any, metadata: any) => void
  ): Hook {
    return {
      id,
      event: 'tool:after',
      priority: 10,
      type: 'logging',
      handler: async (context: HookContext): Promise<HookResult> => {
        try {
          logger(
            context.event,
            context.toolName || 'unknown',
            context.output,
            context.metadata
          );
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    };
  }
}

/**
 * MetricsHook - Performance metrics collection
 */
export class MetricsHook {
  /**
   * Create a metrics hook for tool:before event
   */
  static createBeforeHook(
    id: string,
    collector: (metric: any) => void
  ): Hook {
    return {
      id,
      event: 'tool:before',
      priority: 20, // Low priority - collect after critical hooks
      type: 'metrics',
      handler: async (context: HookContext): Promise<HookResult> => {
        try {
          collector({
            event: 'tool.start',
            toolName: context.toolName || 'unknown',
            timestamp: new Date().toISOString()
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    };
  }

  /**
   * Create a metrics hook for tool:after event
   */
  static createAfterHook(
    id: string,
    collector: (metric: any) => void
  ): Hook {
    return {
      id,
      event: 'tool:after',
      priority: 20,
      type: 'metrics',
      handler: async (context: HookContext): Promise<HookResult> => {
        try {
          collector({
            event: 'tool.complete',
            toolName: context.toolName || 'unknown',
            duration: context.metadata.duration,
            timestamp: new Date().toISOString()
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    };
  }
}

/**
 * ValidationHook - Input validation
 */
export class ValidationHook {
  /**
   * Create a validation hook
   */
  static createHook(
    id: string,
    validator: (input: any) => { valid: boolean; errors?: string[]; transformedData?: any }
  ): Hook {
    return {
      id,
      event: 'tool:before',
      priority: 5, // High priority - validate early
      type: 'validation',
      handler: async (context: HookContext): Promise<HookResult> => {
        try {
          const result = validator(context.input);

          if (!result.valid) {
            return {
              success: false,
              error: `Validation failed: ${result.errors?.join(', ')}`
            };
          }

          // Return transformed input if provided
          if (result.transformedData) {
            return {
              success: true,
              transformedInput: result.transformedData
            };
          }

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    };
  }
}

/**
 * AuthHook - Authentication/authorization
 */
export class AuthHook {
  /**
   * Create an auth hook
   */
  static createHook(
    id: string,
    authCheck: (input: any, metadata: any) => Promise<{ authorized: boolean; reason?: string; userId?: string }>
  ): Hook {
    return {
      id,
      event: 'tool:before',
      priority: 1, // Highest priority - auth first
      type: 'auth',
      handler: async (context: HookContext): Promise<HookResult> => {
        try {
          const result = await authCheck(context.input, context.metadata);

          if (!result.authorized) {
            return {
              success: false,
              error: `Unauthorized: ${result.reason || 'Access denied'}`
            };
          }

          return {
            success: true,
            data: result.userId ? { userId: result.userId } : undefined
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    };
  }
}

/**
 * ToolInstrumentor - Wrapper to instrument tools with hooks
 */
export class ToolInstrumentor {
  private hookManager?: HookManager;

  constructor(hookManager?: HookManager) {
    this.hookManager = hookManager;
  }

  /**
   * Instrument a tool handler with hook execution
   */
  instrument<TInput, TOutput>(
    toolName: string,
    handler: (input: TInput) => Promise<TOutput>
  ): (input: TInput) => Promise<TOutput> {
    return async (input: TInput): Promise<TOutput> => {
      const startTime = Date.now();

      try {
        // Execute before hooks
        if (this.hookManager) {
          await this.hookManager.executeHooks('tool:before', {
            event: 'tool:before',
            toolName,
            input,
            metadata: {}
          });
        }

        // Execute tool
        const output = await handler(input);

        // Execute after hooks
        if (this.hookManager) {
          const duration = Date.now() - startTime;
          await this.hookManager.executeHooks('tool:after', {
            event: 'tool:after',
            toolName,
            input,
            output,
            metadata: { duration }
          });
        }

        return output;
      } catch (error) {
        // Execute error hooks
        if (this.hookManager) {
          await this.hookManager.executeHooks('tool:error', {
            event: 'tool:error',
            toolName,
            input,
            error: error instanceof Error ? error : new Error(String(error)),
            metadata: { duration: Date.now() - startTime }
          });
        }

        // Re-throw error
        throw error;
      }
    };
  }
}

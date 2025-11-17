/**
 * Hook Manager
 * 
 * Manages lifecycle hooks with priority-based execution,
 * error isolation, and timeout enforcement.
 */

import {
  Hook,
  HookEvent,
  HookContext,
  HookResult,
  HookExecutionOptions,
  HookExecutionResult
} from './types.js';

export class HookManager {
  private hooks: Map<string, Hook> = new Map();
  private readonly DEFAULT_TIMEOUT = 500; // milliseconds

  /**
   * Register a new hook
   */
  registerHook(hook: Hook): void {
    // Validate priority range
    if (hook.priority < 0 || hook.priority > 100) {
      throw new Error('Hook priority must be between 0 and 100');
    }

    // Check for duplicate IDs
    if (this.hooks.has(hook.id)) {
      throw new Error(`Hook with id "${hook.id}" already registered`);
    }

    this.hooks.set(hook.id, hook);
  }

  /**
   * Remove a hook by ID
   */
  removeHook(hookId: string): void {
    this.hooks.delete(hookId);
  }

  /**
   * Get all hooks for a specific event
   */
  getHooks(event: HookEvent): Hook[] {
    const eventHooks = Array.from(this.hooks.values())
      .filter(hook => hook.event === event);

    // Sort by priority (lowest first), then by registration order
    return eventHooks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // For same priority, maintain registration order
      return 0;
    });
  }

  /**
   * Execute all hooks for an event
   */
  async executeHooks(
    event: HookEvent,
    context: HookContext,
    options: HookExecutionOptions = {}
  ): Promise<HookExecutionResult> {
    const {
      timeout = this.DEFAULT_TIMEOUT,
      stopOnError = false,
      collectResults = false
    } = options;

    const hooks = this.getHooks(event);
    const startTime = Date.now();
    const results: HookExecutionResult = {
      transformedInput: context.input,
      hookResults: collectResults ? [] : undefined
    };

    let currentInput = context.input;

    for (const hook of hooks) {
      // Check if execution was aborted
      if (context.aborted) {
        results.aborted = true;
        break;
      }

      const hookStartTime = Date.now();

      try {
        // Execute hook with timeout
        const result = await this.executeHookWithTimeout(
          hook,
          { ...context, input: currentInput },
          timeout
        );

        // Track result if requested
        if (collectResults && results.hookResults) {
          results.hookResults.push({
            hookId: hook.id,
            result,
            duration: Date.now() - hookStartTime
          });
        }

        // Apply transformations
        if (result.transformedInput !== undefined) {
          currentInput = result.transformedInput;
          results.transformedInput = currentInput;
        }

        if (result.transformedOutput !== undefined) {
          results.transformedOutput = result.transformedOutput;
        }

      } catch (error) {
        // Log error but continue execution (error isolation)
        console.error(
          `Hook "${hook.id}" failed:`,
          error instanceof Error ? error : new Error(String(error))
        );

        if (stopOnError) {
          break;
        }
      }
    }

    results.totalDuration = Date.now() - startTime;
    return results;
  }

  /**
   * Execute a single hook with timeout enforcement
   */
  private async executeHookWithTimeout(
    hook: Hook,
    context: HookContext,
    timeout: number
  ): Promise<HookResult> {
    return Promise.race([
      hook.handler(context),
      this.createTimeoutPromise(timeout, hook.id)
    ]);
  }

  /**
   * Create a timeout promise that rejects after specified duration
   */
  private createTimeoutPromise(ms: number, hookId: string): Promise<HookResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Hook "${hookId}" timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Get count of registered hooks
   */
  getHookCount(): number {
    return this.hooks.size;
  }

  /**
   * Get count of hooks for specific event
   */
  getEventHookCount(event: HookEvent): number {
    return this.getHooks(event).length;
  }

  /**
   * Clear all hooks (useful for testing)
   */
  clearAll(): void {
    this.hooks.clear();
  }
}

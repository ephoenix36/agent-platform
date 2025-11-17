/**
 * Tool Registration Helper with Hook Support
 * 
 * Provides utilities to wrap tool handlers with automatic hook instrumentation
 */

import { HookManager } from '../hooks/HookManager.js';
import { ToolInstrumentor } from '../hooks/standard-hooks.js';

/**
 * Global hook manager for tool instrumentation
 */
let globalHookManager: HookManager | undefined;

/**
 * Global tool instrumentor
 */
let globalInstrumentor: ToolInstrumentor | undefined;

/**
 * Initialize global hook support for tools
 */
export function initializeGlobalHooks(hookManager?: HookManager): void {
  globalHookManager = hookManager;
  globalInstrumentor = new ToolInstrumentor(hookManager);
}

/**
 * Get the global hook manager
 */
export function getHookManager(): HookManager {
  if (!globalHookManager) {
    throw new Error('Hook manager not initialized. Call initializeGlobalHooks first.');
  }
  return globalHookManager;
}

/**
 * Wrap a tool handler with hook instrumentation
 * 
 * Usage:
 * ```typescript
 * server.tool(
 *   "my_tool",
 *   "Description",
 *   schema,
 *   withHooks("my_tool", async (input) => {
 *     // handler logic
 *   })
 * );
 * ```
 */
export function withHooks<TInput, TOutput>(
  toolName: string,
  handler: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<TOutput> {
  // If no instrumentor is available, return unwrapped handler (backward compatible)
  if (!globalInstrumentor) {
    return handler;
  }

  return globalInstrumentor.instrument(toolName, handler);
}

/**
 * Get the global hook manager
 */
export function getGlobalHookManager(): HookManager | undefined {
  return globalHookManager;
}


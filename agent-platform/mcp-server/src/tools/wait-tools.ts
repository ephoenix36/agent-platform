import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { withHooks } from "../utils/hooked-registry.js";

/**
 * Wait handle for tracking async operations
 */
interface WaitHandle {
  id: string;
  type: 'agent' | 'workflow' | 'timer' | 'hook' | 'custom';
  status: 'pending' | 'completed' | 'failed' | 'timeout';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  timeout?: number;
  metadata?: Record<string, any>;
}

/**
 * Active wait handles storage
 * In production, this would be persisted to a database
 */
const waitHandles = new Map<string, WaitHandle>();

/**
 * Callback registry for async operations
 */
const callbacks = new Map<string, (result: any) => void>();

/**
 * Clear all wait handles (for testing purposes)
 */
export function clearWaitHandles() {
  waitHandles.clear();
  callbacks.clear();
}

/**
 * Register a wait handle for async operation
 */
export function registerWaitHandle(
  id: string,
  type: WaitHandle['type'],
  metadata?: Record<string, any>,
  timeout?: number
): WaitHandle {
  const handle: WaitHandle = {
    id,
    type,
    status: 'pending',
    startTime: new Date(),
    metadata,
    timeout
  };
  
  waitHandles.set(id, handle);
  
  // Set timeout if specified
  if (timeout) {
    setTimeout(() => {
      const current = waitHandles.get(id);
      if (current && current.status === 'pending') {
        current.status = 'timeout';
        current.endTime = new Date();
        current.error = `Operation timed out after ${timeout}ms`;
        
        // Trigger any waiting callbacks
        const callback = callbacks.get(id);
        if (callback) {
          callback({ error: current.error });
          callbacks.delete(id);
        }
      }
    }, timeout);
  }
  
  return handle;
}

/**
 * Complete a wait handle with result
 */
export function completeWaitHandle(id: string, result: any) {
  const handle = waitHandles.get(id);
  if (!handle) {
    throw new Error(`Wait handle ${id} not found`);
  }
  
  handle.status = 'completed';
  handle.endTime = new Date();
  handle.result = result;
  
  // Trigger any waiting callbacks
  const callback = callbacks.get(id);
  if (callback) {
    callback(result);
    callbacks.delete(id);
  }
}

/**
 * Fail a wait handle with error
 */
export function failWaitHandle(id: string, error: string) {
  const handle = waitHandles.get(id);
  if (!handle) {
    throw new Error(`Wait handle ${id} not found`);
  }
  
  handle.status = 'failed';
  handle.endTime = new Date();
  handle.error = error;
  
  // Trigger any waiting callbacks
  const callback = callbacks.get(id);
  if (callback) {
    callback({ error });
    callbacks.delete(id);
  }
}

/**
 * Get wait handle status
 */
export function getWaitHandle(id: string): WaitHandle | undefined {
  return waitHandles.get(id);
}

/**
 * Simple sleep/timer schema
 */
const sleepSchema = z.object({
  durationMs: z.number().min(0).describe("Duration to wait in milliseconds"),
  label: z.string().optional().describe("Optional label for the timer")
});

/**
 * Wait for single async operation schema
 */
const waitForSchema = z.object({
  handleId: z.string().describe("ID of the wait handle to wait for"),
  timeoutMs: z.number().optional().describe("Maximum time to wait in milliseconds"),
  pollIntervalMs: z.number().optional().default(100).describe("Interval for status polling in milliseconds")
});

/**
 * Wait for multiple async operations schema
 */
const waitForMultipleSchema = z.object({
  handleIds: z.array(z.string()).describe("Array of wait handle IDs to wait for"),
  mode: z.enum(['all', 'any', 'race']).describe(
    "Wait mode: 'all' waits for all to complete, 'any' returns when any completes, 'race' returns first result"
  ),
  timeoutMs: z.number().optional().describe("Maximum time to wait in milliseconds"),
  pollIntervalMs: z.number().optional().default(100).describe("Interval for status polling in milliseconds")
});

/**
 * Create wait handle schema
 */
const createWaitHandleSchema = z.object({
  handleId: z.string().describe("Unique identifier for the wait handle"),
  type: z.enum(['agent', 'workflow', 'timer', 'hook', 'custom']).describe("Type of async operation"),
  metadata: z.record(z.any()).optional().describe("Additional metadata"),
  timeoutMs: z.number().optional().describe("Timeout in milliseconds")
});

/**
 * Complete wait handle schema (for external completion)
 */
const completeWaitHandleSchema = z.object({
  handleId: z.string().describe("ID of the wait handle to complete"),
  result: z.any().describe("Result data for the wait handle"),
  error: z.string().optional().describe("Error message if operation failed")
});

/**
 * List wait handles schema
 */
const listWaitHandlesSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'timeout', 'all']).optional().default('all').describe("Filter by status"),
  type: z.enum(['agent', 'workflow', 'timer', 'hook', 'custom', 'all']).optional().default('all').describe("Filter by type")
});

/**
 * Calculate elapsed time for a wait handle
 */
function calculateElapsedTime(handle: WaitHandle): number {
  const endTime = handle.endTime || new Date();
  return endTime.getTime() - handle.startTime.getTime();
}

/**
 * Format elapsed time for human readability
 */
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${ms}ms`;
  }
}

/**
 * Register wait and async operation tools
 */
export async function registerWaitTools(server: McpServer, logger: Logger) {
  
  // ===== SLEEP / TIMER =====
  server.tool(
    "sleep",
    "Wait for a specified duration (simple timer/delay). Useful for rate limiting, pacing operations, or scheduled delays.",
    sleepSchema.shape,
    withHooks("sleep", async (input) => {
      try {
        const { durationMs, label } = input;
        const startTime = new Date();
        
        logger.info(`Sleep started: ${label || 'unnamed'} (${durationMs}ms)`);
        
        // Perform the sleep
        await new Promise(resolve => setTimeout(resolve, durationMs));
        
        const endTime = new Date();
        const actualDuration = endTime.getTime() - startTime.getTime();
        
        logger.info(`Sleep completed: ${label || 'unnamed'} (${actualDuration}ms)`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              label,
              requestedDurationMs: durationMs,
              actualDurationMs: actualDuration,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Sleep error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );

  // ===== CREATE WAIT HANDLE =====
  server.tool(
    "create_wait_handle",
    "Create a wait handle for tracking an async operation (agent, workflow, hook, etc.). Returns a handle ID that can be used with wait_for.",
    createWaitHandleSchema.shape,
    withHooks("create_wait_handle", async (input) => {
      try {
        const { handleId, type, metadata, timeoutMs } = input;
        
        // Check if handle already exists
        if (waitHandles.has(handleId)) {
          logger.error(`Wait handle ${handleId} already exists`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Wait handle ${handleId} already exists`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const handle = registerWaitHandle(handleId, type, metadata, timeoutMs);
        
        logger.info(`Created wait handle: ${handleId} (${type})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              handleId: handle.id,
              type: handle.type,
              status: handle.status,
              startTime: handle.startTime.toISOString(),
              timeout: timeoutMs,
              metadata: handle.metadata
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error creating wait handle:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );

  // ===== WAIT FOR SINGLE OPERATION =====
  server.tool(
    "wait_for",
    "Wait for a single async operation to complete. Polls the wait handle status until completion, failure, or timeout.",
    waitForSchema.shape,
    withHooks("wait_for", async (input) => {
      try {
        const { handleId, timeoutMs, pollIntervalMs } = input;
        
        const handle = waitHandles.get(handleId);
        
        if (!handle) {
          logger.error(`Wait handle ${handleId} not found`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Wait handle ${handleId} not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        logger.info(`Waiting for handle: ${handleId}`);
        
        const startWaitTime = Date.now();
        const effectiveTimeout = timeoutMs || handle.timeout;
        
        // Poll until complete, failed, timeout, or our wait timeout
        while (handle.status === 'pending') {
          // Check if we've exceeded our wait timeout
          if (effectiveTimeout && (Date.now() - startWaitTime) >= effectiveTimeout) {
            logger.warn(`Wait timeout for handle: ${handleId}`);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  handleId,
                  status: 'timeout',
                  error: `Wait timed out after ${effectiveTimeout}ms`,
                  elapsedMs: Date.now() - startWaitTime
                }, null, 2)
              }],
              isError: false // Not an error, just timeout
            };
          }
          
          // Wait for poll interval
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }
        
        const elapsedMs = calculateElapsedTime(handle);
        const waitedMs = Date.now() - startWaitTime;
        
        logger.info(`Wait completed for handle: ${handleId} (${handle.status})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              handleId: handle.id,
              type: handle.type,
              status: handle.status,
              result: handle.result,
              error: handle.error,
              operationElapsedMs: elapsedMs,
              operationElapsedTime: formatElapsedTime(elapsedMs),
              waitedMs,
              waitedTime: formatElapsedTime(waitedMs),
              startTime: handle.startTime.toISOString(),
              endTime: handle.endTime?.toISOString(),
              metadata: handle.metadata
            }, null, 2)
          }],
          isError: handle.status === 'failed'
        };
      } catch (error) {
        logger.error("Wait error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );

  // ===== WAIT FOR MULTIPLE OPERATIONS =====
  server.tool(
    "wait_for_multiple",
    "Wait for multiple async operations with different strategies: 'all' (wait for all), 'any' (wait for any one), or 'race' (first to complete).",
    waitForMultipleSchema.shape,
    withHooks("wait_for_multiple", async (input) => {
      try {
        const { handleIds, mode, timeoutMs, pollIntervalMs } = input;
        
        // Validate all handles exist
        const handles = handleIds.map(id => {
          const handle = waitHandles.get(id);
          if (!handle) {
            throw new Error(`Wait handle ${id} not found`);
          }
          return handle;
        });
        
        logger.info(`Waiting for ${handleIds.length} handles in '${mode}' mode`);
        
        const startWaitTime = Date.now();
        const results: Record<string, any> = {};
        
        // Poll until completion based on mode
        while (true) {
          // Check timeout
          if (timeoutMs && (Date.now() - startWaitTime) >= timeoutMs) {
            logger.warn(`Wait timeout for multiple handles (${mode} mode)`);
            
            const status: Record<string, any> = {};
            handles.forEach(h => {
              status[h.id] = {
                status: h.status,
                result: h.result,
                error: h.error
              };
            });
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  mode,
                  status: 'timeout',
                  error: `Wait timed out after ${timeoutMs}ms`,
                  completedCount: handles.filter(h => h.status === 'completed').length,
                  totalCount: handles.length,
                  handleStatus: status,
                  elapsedMs: Date.now() - startWaitTime
                }, null, 2)
              }],
              isError: false
            };
          }
          
          // Check completion based on mode
          const completed = handles.filter(h => h.status !== 'pending');
          const succeeded = handles.filter(h => h.status === 'completed');
          const failed = handles.filter(h => h.status === 'failed' || h.status === 'timeout');
          
          let shouldReturn = false;
          let returnStatus = 'completed';
          
          switch (mode) {
            case 'all':
              // Wait until all are done (completed or failed)
              shouldReturn = completed.length === handles.length;
              returnStatus = failed.length > 0 ? 'partial' : 'completed';
              break;
              
            case 'any':
              // Return when any one succeeds
              shouldReturn = succeeded.length > 0;
              returnStatus = 'completed';
              break;
              
            case 'race':
              // Return when any one completes (success or failure)
              shouldReturn = completed.length > 0;
              returnStatus = completed[0].status === 'completed' ? 'completed' : 'failed';
              break;
          }
          
          if (shouldReturn) {
            // Collect results
            handles.forEach(h => {
              results[h.id] = {
                type: h.type,
                status: h.status,
                result: h.result,
                error: h.error,
                elapsedMs: calculateElapsedTime(h),
                elapsedTime: formatElapsedTime(calculateElapsedTime(h)),
                metadata: h.metadata
              };
            });
            
            logger.info(`Wait completed for multiple handles: ${mode} mode, status: ${returnStatus}`);
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  mode,
                  status: returnStatus,
                  totalCount: handles.length,
                  completedCount: succeeded.length,
                  failedCount: failed.length,
                  pendingCount: handles.filter(h => h.status === 'pending').length,
                  results,
                  waitedMs: Date.now() - startWaitTime,
                  waitedTime: formatElapsedTime(Date.now() - startWaitTime)
                }, null, 2)
              }],
              isError: returnStatus === 'failed'
            };
          }
          
          // Wait for poll interval
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }
      } catch (error) {
        logger.error("Wait for multiple error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );

  // ===== COMPLETE WAIT HANDLE =====
  server.tool(
    "complete_wait_handle",
    "Manually complete or fail a wait handle. Used by external systems to signal completion of async operations.",
    completeWaitHandleSchema.shape,
    withHooks("complete_wait_handle", async (input) => {
      try {
        const { handleId, result, error } = input;
        
        const handle = waitHandles.get(handleId);
        
        if (!handle) {
          logger.error(`Wait handle ${handleId} not found`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Wait handle ${handleId} not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        if (handle.status !== 'pending') {
          logger.warn(`Wait handle ${handleId} is already ${handle.status}`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Wait handle ${handleId} is already ${handle.status}`,
                currentStatus: handle.status
              }, null, 2)
            }],
            isError: true
          };
        }
        
        if (error) {
          failWaitHandle(handleId, error);
          logger.info(`Wait handle ${handleId} failed: ${error}`);
        } else {
          completeWaitHandle(handleId, result);
          logger.info(`Wait handle ${handleId} completed successfully`);
        }
        
        const elapsedMs = calculateElapsedTime(handle);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              handleId: handle.id,
              type: handle.type,
              status: handle.status,
              result: handle.result,
              error: handle.error,
              elapsedMs,
              elapsedTime: formatElapsedTime(elapsedMs),
              startTime: handle.startTime.toISOString(),
              endTime: handle.endTime?.toISOString()
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error completing wait handle:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );

  // ===== LIST WAIT HANDLES =====
  server.tool(
    "list_wait_handles",
    "List all wait handles with optional filtering by status and type",
    listWaitHandlesSchema.shape,
    withHooks("list_wait_handles", async (input) => {
      try {
        const { status, type } = input;
        
        let filtered = Array.from(waitHandles.values());
        
        // Filter by status
        if (status !== 'all') {
          filtered = filtered.filter(h => h.status === status);
        }
        
        // Filter by type
        if (type !== 'all') {
          filtered = filtered.filter(h => h.type === type);
        }
        
        // Calculate stats
        const stats = {
          total: waitHandles.size,
          filtered: filtered.length,
          byStatus: {
            pending: Array.from(waitHandles.values()).filter(h => h.status === 'pending').length,
            completed: Array.from(waitHandles.values()).filter(h => h.status === 'completed').length,
            failed: Array.from(waitHandles.values()).filter(h => h.status === 'failed').length,
            timeout: Array.from(waitHandles.values()).filter(h => h.status === 'timeout').length
          },
          byType: {
            agent: Array.from(waitHandles.values()).filter(h => h.type === 'agent').length,
            workflow: Array.from(waitHandles.values()).filter(h => h.type === 'workflow').length,
            timer: Array.from(waitHandles.values()).filter(h => h.type === 'timer').length,
            hook: Array.from(waitHandles.values()).filter(h => h.type === 'hook').length,
            custom: Array.from(waitHandles.values()).filter(h => h.type === 'custom').length
          }
        };
        
        const handles = filtered.map(h => ({
          id: h.id,
          type: h.type,
          status: h.status,
          elapsedMs: calculateElapsedTime(h),
          elapsedTime: formatElapsedTime(calculateElapsedTime(h)),
          startTime: h.startTime.toISOString(),
          endTime: h.endTime?.toISOString(),
          hasResult: h.result !== undefined,
          hasError: h.error !== undefined,
          metadata: h.metadata
        }));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              stats,
              filters: {
                status: status !== 'all' ? status : 'none',
                type: type !== 'all' ? type : 'none'
              },
              handles
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error listing wait handles:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );

  logger.info("Wait tools registered successfully");
}

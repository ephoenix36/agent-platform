/**
 * Hook Tools
 * 
 * MCP tools for managing lifecycle hooks in the agent platform.
 * Allows agents to register, remove, and monitor hooks for tool execution.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { HookManager } from "../hooks/HookManager.js";
import { Hook, HookEvent, HookContext, HookResult } from "../hooks/types.js";

/**
 * Register hook schema
 */
const registerHookSchema = z.object({
  id: z.string().describe("Unique hook identifier"),
  event: z.enum([
    "tool:before",
    "tool:after",
    "tool:error",
    "agent:before",
    "agent:after",
    "workflow:before",
    "workflow:after",
    "workflow:step:before",
    "workflow:step:after"
  ]).describe("Hook event type"),
  priority: z.number().min(0).max(100).default(50).describe("Execution priority (0-100, lower runs first)"),
  type: z.enum(["validation", "transform", "logging", "metrics", "auth", "custom"]).optional().describe("Hook type/category"),
  handlerCode: z.string().describe("JavaScript function code that implements the hook handler")
});

/**
 * Remove hook schema
 */
const removeHookSchema = z.object({
  hookId: z.string().describe("ID of hook to remove")
});

/**
 * List hooks schema
 */
const listHooksSchema = z.object({
  event: z.enum([
    "tool:before",
    "tool:after",
    "tool:error",
    "agent:before",
    "agent:after",
    "workflow:before",
    "workflow:after",
    "workflow:step:before",
    "workflow:step:after"
  ]).optional().describe("Filter by event type")
});

/**
 * Get hook schema
 */
const getHookSchema = z.object({
  hookId: z.string().describe("Hook ID to retrieve")
});

/**
 * Create standard hook schema
 */
const createStandardHookSchema = z.object({
  type: z.enum(["logging", "metrics", "validation"]).describe("Standard hook type"),
  id: z.string().describe("Unique hook identifier"),
  event: z.enum([
    "tool:before",
    "tool:after",
    "tool:error"
  ]).describe("Hook event"),
  config: z.record(z.any()).optional().describe("Hook-specific configuration")
});

export function registerHookTools(
  server: McpServer,
  hookManager: HookManager,
  logger: Logger
) {
  /**
   * Register a new hook
   */
  server.tool(
    "register_hook",
    "Register a new lifecycle hook that executes during tool, workflow, or agent execution. Hooks can transform inputs, validate data, collect metrics, or handle errors.",
    registerHookSchema.shape,
    async (args: z.infer<typeof registerHookSchema>) => {
      try {
        // Create handler function from code
        const handlerFn = new Function('context', `
          return (async () => {
            ${args.handlerCode}
          })();
        `);

        const hook: Hook = {
          id: args.id,
          event: args.event as HookEvent,
          priority: args.priority,
          type: args.type,
          handler: async (context: HookContext): Promise<HookResult> => {
            try {
              const result = await handlerFn.call(null, context);
              return result || { success: true };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }
          }
        };

        hookManager.registerHook(hook);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              hookId: args.id,
              event: args.event,
              priority: args.priority,
              message: `Hook registered successfully`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to register hook:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Remove a hook
   */
  server.tool(
    "remove_hook",
    "Remove a registered hook by its ID. The hook will no longer execute for its event.",
    removeHookSchema.shape,
    async (args: z.infer<typeof removeHookSchema>) => {
      try {
        hookManager.removeHook(args.hookId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              hookId: args.hookId,
              message: "Hook removed successfully"
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to remove hook:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * List hooks
   */
  server.tool(
    "list_hooks",
    "List all registered hooks, optionally filtered by event type. Shows priority order and hook types.",
    listHooksSchema.shape,
    async (args: z.infer<typeof listHooksSchema>) => {
      try {
        let hooks: Hook[];
        
        if (args.event) {
          hooks = hookManager.getHooks(args.event as HookEvent);
        } else {
          // Get all hooks for all events
          const events: HookEvent[] = [
            "tool:before",
            "tool:after",
            "tool:error",
            "agent:before",
            "agent:after",
            "workflow:before",
            "workflow:after",
            "workflow:step:before",
            "workflow:step:after"
          ];
          
          hooks = events.flatMap(event => hookManager.getHooks(event));
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: hooks.length,
              hooks: hooks.map(h => ({
                id: h.id,
                event: h.event,
                priority: h.priority,
                type: h.type
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list hooks:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Get hook details
   */
  server.tool(
    "get_hook",
    "Get detailed information about a specific hook by its ID.",
    getHookSchema.shape,
    async (args: z.infer<typeof getHookSchema>) => {
      try {
        // Get all hooks and find the one with matching ID
        const events: HookEvent[] = [
          "tool:before",
          "tool:after",
          "tool:error",
          "agent:before",
          "agent:after",
          "workflow:before",
          "workflow:after",
          "workflow:step:before",
          "workflow:step:after"
        ];
        
        let found: Hook | undefined;
        for (const event of events) {
          const hooks = hookManager.getHooks(event);
          found = hooks.find(h => h.id === args.hookId);
          if (found) break;
        }

        if (!found) {
          throw new Error(`Hook not found: ${args.hookId}`);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              hook: {
                id: found.id,
                event: found.event,
                priority: found.priority,
                type: found.type
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get hook:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Create standard hook
   */
  server.tool(
    "create_standard_hook",
    "Create a pre-built standard hook (logging, metrics, or validation) with common configurations.",
    createStandardHookSchema.shape,
    async (args: z.infer<typeof createStandardHookSchema>) => {
      try {
        const { LoggingHook, MetricsHook, ValidationHook } = await import('../hooks/standard-hooks.js');
        
        let hook: Hook;

        switch (args.type) {
          case "logging":
            if (args.event === "tool:before") {
              hook = LoggingHook.createBeforeHook(
                args.id,
                (event, toolName, input) => {
                  logger.info(`[Hook:${event}] Tool: ${toolName}`, { input });
                }
              );
            } else if (args.event === "tool:after") {
              hook = LoggingHook.createAfterHook(
                args.id,
                (event, toolName, output, metadata) => {
                  logger.info(`[Hook:${event}] Tool: ${toolName}`, { output, metadata });
                }
              );
            } else {
              throw new Error("Logging hooks only support tool:before and tool:after events");
            }
            break;

          case "metrics":
            if (args.event === "tool:before") {
              hook = MetricsHook.createBeforeHook(
                args.id,
                (metric) => {
                  logger.debug("Metric collected", metric);
                }
              );
            } else if (args.event === "tool:after") {
              hook = MetricsHook.createAfterHook(
                args.id,
                (metric) => {
                  logger.debug("Metric collected", metric);
                }
              );
            } else {
              throw new Error("Metrics hooks only support tool:before and tool:after events");
            }
            break;

          case "validation":
            if (args.event !== "tool:before") {
              throw new Error("Validation hooks only support tool:before event");
            }
            
            const schema = args.config?.schema || { type: "object" };
            hook = ValidationHook.createHook(
              args.id,
              schema
            );
            break;

          default:
            throw new Error(`Unknown standard hook type: ${args.type}`);
        }

        hookManager.registerHook(hook);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              hookId: args.id,
              type: args.type,
              event: args.event,
              message: `Standard ${args.type} hook created successfully`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create standard hook:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info("Registered 5 hook management tools");
}

/**
 * Widget Tools
 * 
 * MCP tools for agents to interact with widgets
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { WidgetService } from "../services/widget-service.js";

/**
 * Register widget from template
 */
const createWidgetFromTemplateSchema = z.object({
  templateId: z.string().describe("Template ID to use"),
  customConfig: z.record(z.any()).optional().describe("Custom configuration overrides"),
  props: z.record(z.any()).optional().describe("Widget props"),
  workflowId: z.string().optional().describe("Associated workflow ID")
});

/**
 * Send message to widget
 */
const sendWidgetMessageSchema = z.object({
  instanceId: z.string().describe("Widget instance ID"),
  type: z.enum(['event', 'request', 'response', 'data', 'command']).describe("Message type"),
  data: z.any().describe("Message data"),
  metadata: z.record(z.any()).optional().describe("Additional metadata")
});

/**
 * Update widget data
 */
const updateWidgetDataSchema = z.object({
  instanceId: z.string().describe("Widget instance ID"),
  data: z.record(z.any()).describe("Data to update"),
  merge: z.boolean().optional().default(true).describe("Merge with existing data or replace")
});

/**
 * Get widget instance
 */
const getWidgetSchema = z.object({
  instanceId: z.string().describe("Widget instance ID")
});

/**
 * Destroy widget instance
 */
const destroyWidgetSchema = z.object({
  instanceId: z.string().describe("Widget instance ID")
});

/**
 * List widget templates
 */
const listWidgetTemplatesSchema = z.object({
  category: z.string().optional().describe("Filter by category")
});

/**
 * Get widget statistics
 */
const getWidgetStatsSchema = z.object({});

export function registerWidgetTools(
  server: McpServer,
  widgetService: WidgetService,
  logger: Logger
) {
  /**
   * Create widget from template
   */
  server.tool(
    "create_widget",
    "Create a widget instance from a template. Widgets provide interactive UI components that can communicate with agents and workflows.",
    createWidgetFromTemplateSchema.shape,
    async (args: z.infer<typeof createWidgetFromTemplateSchema>) => {
      try {
        const instance = widgetService.createFromTemplate(
          args.templateId,
          args.customConfig,
          args.props,
          args.workflowId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              instance: {
                id: instance.id,
                configId: instance.configId,
                state: instance.state,
                createdAt: instance.createdAt,
                workflowId: instance.workflowId
              },
              message: `Widget created from template: ${args.templateId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create widget:", error);
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
   * Send message to widget
   */
  server.tool(
    "send_widget_message",
    "Send a message to a widget instance. Messages enable bidirectional communication between agents/workflows and widgets.",
    sendWidgetMessageSchema.shape,
    async (args: z.infer<typeof sendWidgetMessageSchema>) => {
      try {
        await widgetService.sendMessage(args.instanceId, {
          widgetId: args.instanceId,
          type: args.type,
          payload: args.data,
          source: 'agent'
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Message sent to widget ${args.instanceId}`,
              messageType: args.type
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to send widget message:", error);
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
   * Update widget data
   */
  server.tool(
    "update_widget_data",
    "Update the data stored in a widget instance. Can merge with existing data or replace entirely.",
    updateWidgetDataSchema.shape,
    async (args: z.infer<typeof updateWidgetDataSchema>) => {
      try {
        widgetService.updateData(args.instanceId, args.data, args.merge);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Widget data updated for ${args.instanceId}`,
              merged: args.merge
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to update widget data:", error);
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
   * Get widget instance
   */
  server.tool(
    "get_widget",
    "Get details about a widget instance including its state, data, and metrics.",
    getWidgetSchema.shape,
    async (args: z.infer<typeof getWidgetSchema>) => {
      try {
        const instance = widgetService.getInstance(args.instanceId);
        
        if (!instance) {
          throw new Error(`Widget instance not found: ${args.instanceId}`);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              instance: {
                id: instance.id,
                configId: instance.configId,
                state: instance.state,
                data: instance.data,
                props: instance.props,
                createdAt: instance.createdAt,
                updatedAt: instance.updatedAt,
                lastActivityAt: instance.lastActivityAt,
                workflowId: instance.workflowId,
                agentIds: instance.agentIds,
                metrics: instance.metrics,
                errorCount: instance.errors.length
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get widget:", error);
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
   * Destroy widget instance
   */
  server.tool(
    "destroy_widget",
    "Destroy a widget instance and clean up its resources. Runs the onDestroy lifecycle hook if defined.",
    destroyWidgetSchema.shape,
    async (args: z.infer<typeof destroyWidgetSchema>) => {
      try {
        widgetService.destroyInstance(args.instanceId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Widget instance destroyed: ${args.instanceId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to destroy widget:", error);
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
   * List widget templates
   */
  server.tool(
    "list_widget_templates",
    "List available widget templates. Templates provide pre-configured widget types like forms, charts, tables, etc.",
    listWidgetTemplatesSchema.shape,
    async (args: z.infer<typeof listWidgetTemplatesSchema>) => {
      try {
        const templates = widgetService.getTemplates(args.category);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              templates: templates.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                exampleUsage: t.exampleUsage
              })),
              total: templates.length
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list widget templates:", error);
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
   * Get widget statistics
   */
  server.tool(
    "get_widget_stats",
    "Get aggregate statistics about all widgets including instance counts, message counts, and error rates.",
    getWidgetStatsSchema.shape,
    async () => {
      try {
        const stats = widgetService.getStats();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              stats
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get widget stats:", error);
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

  logger.info("Registered 7 widget tools");
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { EventBus } from '../core/event-bus.js';
import { ProjectStateManager } from '../core/project-state.js';

const eventBus = EventBus.getInstance();

export function registerOrchestrationTools(server: McpServer, projectState: ProjectStateManager) {

  // ============================================================================
  // EVENT BUS TOOLS
  // ============================================================================

  server.tool(
    "emit_event",
    "Emit a system event that other agents or hooks can listen for",
    {
      name: z.string().describe("Event name (e.g., 'research:complete', 'deployment:failed')"),
      type: z.enum(['LIFECYCLE', 'EXTERNAL', 'DATA', 'PROJECT', 'TASK']).default('EXTERNAL'),
      payload: z.record(z.any()).describe("Data associated with the event"),
    },
    async ({ name, type, payload }) => {
      const id = eventBus.emitEvent(name, type as any, payload, 'agent');
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, eventId: id })
        }]
      };
    }
  );

  server.tool(
    "get_recent_events",
    "Get a log of recent system events",
    {
      limit: z.number().default(10),
      type: z.enum(['LIFECYCLE', 'EXTERNAL', 'DATA', 'PROJECT', 'TASK']).optional(),
    },
    async ({ limit, type }) => {
      const events = eventBus.getRecentEvents(limit, type as any);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(events, null, 2)
        }]
      };
    }
  );

  // ============================================================================
  // PROJECT ORCHESTRATION TOOLS
  // ============================================================================

  server.tool(
    "project_create_active",
    "Initialize a new Active Project with runtime state",
    {
      name: z.string(),
      managerAgentId: z.string().describe("The ID of the agent managing this project"),
    },
    async ({ name, managerAgentId }) => {
      const project = projectState.createProject(name, managerAgentId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(project, null, 2)
        }]
      };
    }
  );

  server.tool(
    "project_update_status",
    "Transition a project to a new phase",
    {
      projectId: z.string(),
      status: z.enum(['PLANNING', 'STRATEGY', 'EXECUTION', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
    },
    async ({ projectId, status }) => {
      const project = projectState.updateStatus(projectId, status as any, 'agent');
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, newStatus: project.status })
        }]
      };
    }
  );

  server.tool(
    "project_assign_agent",
    "Assign a worker agent to the project swarm",
    {
      projectId: z.string(),
      agentId: z.string(),
      role: z.string().describe("Role description (e.g., 'Researcher', 'QA')"),
    },
    async ({ projectId, agentId, role }) => {
      projectState.assignAgent(projectId, agentId, role, 'agent');
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: `Assigned ${agentId} as ${role}` })
        }]
      };
    }
  );

  server.tool(
    "project_update_context",
    "Inject strategic data into the project context (e.g., research findings)",
    {
      projectId: z.string(),
      key: z.string().describe("Data key (e.g., 'competitor_analysis')"),
      data: z.record(z.any()).describe("The data object"),
    },
    async ({ projectId, key, data }) => {
      projectState.updateStrategicContext(projectId, key, data, 'agent');
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: `Updated context key: ${key}` })
        }]
      };
    }
  );

  server.tool(
    "project_register_hook",
    "Register an automated action to trigger on an event",
    {
      projectId: z.string(),
      triggerEvent: z.string().describe("Event name to listen for"),
      action: z.enum(['notify_agent', 'update_state', 'run_script']),
      target: z.string().describe("Agent ID or Script Path"),
      config: z.record(z.any()).optional(),
    },
    async ({ projectId, triggerEvent, action, target, config }) => {
      const hookId = projectState.registerHook(projectId, triggerEvent, action as any, target, config);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, hookId })
        }]
      };
    }
  );
}

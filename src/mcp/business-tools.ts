import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BusinessStructureManager } from '../core/business-structure.js';

export function registerBusinessTools(server: McpServer, businessManager: BusinessStructureManager) {

  // ============================================================================
  // DEPARTMENT TOOLS
  // ============================================================================

  server.tool(
    "biz_create_department",
    "Create a new organizational department",
    {
      name: z.string().describe("Department name (e.g., 'Marketing', 'Engineering')"),
      mission: z.string().describe("The mission statement of this department"),
      headAgentId: z.string().describe("The ID of the agent leading this department"),
    },
    async ({ name, mission, headAgentId }) => {
      const dept = await businessManager.createDepartment(name, mission, headAgentId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(dept, null, 2)
        }]
      };
    }
  );

  server.tool(
    "biz_list_departments",
    "List all active departments",
    {},
    async () => {
      const depts = businessManager.listDepartments();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(depts, null, 2)
        }]
      };
    }
  );

  server.tool(
    "biz_assign_to_department",
    "Assign an agent to a department",
    {
      departmentId: z.string(),
      agentId: z.string(),
    },
    async ({ departmentId, agentId }) => {
      await businessManager.assignAgentToDepartment(departmentId, agentId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true })
        }]
      };
    }
  );

  // ============================================================================
  // SOP (Standard Operating Procedure) TOOLS
  // ============================================================================

  server.tool(
    "biz_define_sop",
    "Define a reusable Standard Operating Procedure (SOP)",
    {
      name: z.string(),
      description: z.string(),
      departmentId: z.string(),
      phases: z.array(z.object({
        name: z.string(),
        description: z.string(),
        requiredRoles: z.array(z.string()),
        deliverables: z.array(z.string())
      })),
      managerInstructions: z.string().describe("The master prompt for the manager agent when running this SOP"),
      triggerEvent: z.string().optional().describe("Event that auto-triggers this SOP"),
    },
    async ({ name, description, departmentId, phases, managerInstructions, triggerEvent }) => {
      const sop = await businessManager.defineSOP(name, description, departmentId, phases, managerInstructions, triggerEvent);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(sop, null, 2)
        }]
      };
    }
  );

  server.tool(
    "biz_list_sops",
    "List available SOPs, optionally filtered by department",
    {
      departmentId: z.string().optional(),
    },
    async ({ departmentId }) => {
      const sops = businessManager.listSOPs(departmentId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(sops, null, 2)
        }]
      };
    }
  );

  server.tool(
    "biz_instantiate_sop",
    "Start a new project based on an SOP",
    {
      sopId: z.string(),
      projectName: z.string(),
      managerAgentId: z.string(),
    },
    async ({ sopId, projectName, managerAgentId }) => {
      const projectId = businessManager.instantiateSOP(sopId, projectName, managerAgentId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            success: true, 
            projectId, 
            message: "Project created and context hydrated from SOP." 
          }, null, 2)
        }]
      };
    }
  );
}

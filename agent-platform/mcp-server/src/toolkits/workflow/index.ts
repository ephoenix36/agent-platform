/**
 * Workflow Toolkit
 * 
 * Workflow orchestration and execution tools.
 * Includes execute_workflow, execute_workflow_async, create_workflow, get_workflow_templates.
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerWorkflowTools } from '../../tools/workflow-tools.js';

export const workflowToolkit: Toolkit = {
  id: "workflow",
  name: "Workflow Orchestration",
  description: "Multi-step workflow execution with agents, API calls, conditions, and transformations. Build complex automation pipelines with async execution support.",
  version: "1.0.0",
  category: "workflow",
  enabled: true,  // RE-ENABLED with passthrough fix
  toolCount: 4,   // execute_workflow, execute_workflow_async, create_workflow, get_workflow_templates
  
  register: registerWorkflowTools,
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["workflow", "orchestration", "automation", "pipeline"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write", "execute"],
  },
};

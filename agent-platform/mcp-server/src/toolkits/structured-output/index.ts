/**
 * Structured Output Toolkit
 * 
 * Tools for requesting and validating structured JSON output from LLMs using MCP sampling.
 * Essential for control flow, data extraction, and programmatic processing.
 * 
 * PRIMARY USE CASE: Workflows and internal processing
 * These tools are designed to make workflow output piping reliable and straightforward.
 * They should NOT typically be exposed to agents (via includeContext) as they are meant
 * to structure workflow outputs rather than agent outputs.
 */

import { Toolkit } from "../../types/toolkit.js";
import { registerStructuredOutputTools } from "../../tools/structured-output-tools.js";

export const structuredOutputToolkit: Toolkit = {
  id: "structured-output",
  name: "Structured Output",
  description: "Request structured JSON output from LLMs with schema validation. Perfect for control flow, data extraction, and programmatic processing of AI responses.",
  
  category: "core",
  version: "1.0.0",
  enabled: true,
  toolCount: 3,
  
  register: async (server, logger) => {
    await registerStructuredOutputTools(server, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    tags: [
      "structured-output",
      "json",
      "schema",
      "validation",
      "parsing",
      "control-flow"
    ],
    homepage: "https://github.com/agent-platform/mcp-server",
    repository: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      defaultModel: "gpt-4o",
      strictValidation: true,
      enableCaching: false,
    },
  },
};

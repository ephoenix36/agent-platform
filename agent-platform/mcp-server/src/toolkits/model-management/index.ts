/**
 * Model Management Toolkit
 * 
 * AI model selection, optimization, and configuration tools.
 * Includes select_model, optimize_parameters, list_models.
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerModelTools } from '../../tools/model-tools.js';

export const modelManagementToolkit: Toolkit = {
  id: "model-management",
  name: "Model Management",
  description: "Intelligent AI model selection and parameter optimization. Supports GPT-5, GPT-5-Mini, Claude 4.5 Sonnet, Gemini 2.5 Pro, and Grok Code Fast with automatic selection based on task complexity and requirements.",
  version: "1.0.0",
  category: "model-management",
  enabled: true,  // Load by default - core functionality
  toolCount: 3,   // select_model, optimize_parameters, list_models
  
  register: registerModelTools,
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["model", "AI", "optimization", "selection"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read"],
  },
};

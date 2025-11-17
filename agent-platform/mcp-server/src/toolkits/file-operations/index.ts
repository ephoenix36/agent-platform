/**
 * File Operations Toolkit
 * 
 * Comprehensive file and directory operations for agents.
 * Enables agents to read, write, search, and manipulate files safely.
 */

import { Toolkit } from '../../types/toolkit.js';

export const fileOperationsToolkit: Toolkit = {
  id: "file-operations",
  name: "File Operations",
  description: "Read, write, search, and manipulate files and directories. Provides safe file system access for agents with permission controls.",
  version: "1.0.0",
  category: "core",
  enabled: false,  // Opt-in due to file system access
  toolCount: 12,
  
  register: async (server, logger) => {
    const { registerFileOperationTools } = await import('../../tools/file-operation-tools.js');
    await registerFileOperationTools(server, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-10",
    updated: "2025-11-10",
    tags: ["files", "filesystem", "read", "write", "search", "directories"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: false,
    permissions: ["read", "write"],
    settings: {
      allowedExtensions: ['.md', '.txt', '.json', '.yaml', '.yml', '.js', '.ts', '.tsx', '.jsx', '.py', '.sh'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedDirectories: [], // Empty = allow all
      deniedDirectories: ['node_modules', '.git', 'dist', 'build'],
      requireConfirmation: true,
    },
  },
};

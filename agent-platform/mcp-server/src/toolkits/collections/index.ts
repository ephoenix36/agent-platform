/**
 * Collections Toolkit
 * 
 * Comprehensive collection management with search, templates, and advanced queries
 */

import { Toolkit } from "../../types/toolkit.js";
import { registerCollectionTools } from "../../tools/collection-tools.js";

export const collectionsToolkit: Toolkit = {
  id: "collections",
  name: "Collections Management",
  description: "Comprehensive collection management with CRUD operations, advanced search, templates, import/export, versioning, and transactions. Build portable data stores with schema validation and querying.",
  
  category: "core",
  version: "1.0.0",
  enabled: true,
  toolCount: 20,  // Enhanced with search, templates, and advanced features
  
  register: async (server, logger) => {
    // Get collection service from registry
    const { getCollectionService } = await import('../../services/service-registry.js');
    const collectionService = getCollectionService();
    await registerCollectionTools(server, collectionService, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    tags: [
      "collections",
      "data",
      "storage",
      "query",
      "search",
      "versioning",
      "transactions",
      "templates"
    ],
    homepage: "https://github.com/agent-platform/mcp-server",
    repository: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      storageDir: "local-storage/collections",
      enableVersioning: true,
      enableSearch: true,
      maxItemsPerCollection: 100000,
    },
  },
};

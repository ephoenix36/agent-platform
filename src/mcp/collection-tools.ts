import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CollectionManager } from '../core/collection-manager.js';
import path from 'path';
import os from 'os';

// We need to inject the managers. 
// In a real app, we'd have a dependency injection container.
// For now, we'll assume they are passed in or we can access the singletons if we exported them.
// Since we didn't export singletons from the other files (we created new instances), 
// we need to unify this in server.ts.
// I will export a setup function that takes the CollectionManager instance.

export function registerCollectionTools(server: McpServer, collectionManager: CollectionManager) {

  server.tool(
    "collection_export",
    "Export a business unit (Department + dependencies) into a portable folder",
    {
      name: z.string().describe("Name of the collection (e.g., 'Marketing-Pack')"),
      description: z.string(),
      author: z.string(),
      departmentIds: z.array(z.string()).describe("IDs of departments to include"),
      targetPath: z.string().optional().describe("Where to save the collection (default: desktop)"),
    },
    async ({ name, description, author, departmentIds, targetPath }) => {
      const finalPath = targetPath || path.join(os.homedir(), 'Desktop');
      const location = await collectionManager.exportCollection(name, description, author, finalPath, departmentIds);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, location })
        }]
      };
    }
  );

  server.tool(
    "collection_import",
    "Import a collection from a folder",
    {
      sourcePath: z.string().describe("Path to the collection folder"),
    },
    async ({ sourcePath }) => {
      const manifest = await collectionManager.importCollection(sourcePath);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, manifest })
        }]
      };
    }
  );
}

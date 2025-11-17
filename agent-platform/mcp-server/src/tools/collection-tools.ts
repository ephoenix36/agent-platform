/**
 * Collection Tools
 * 
 * MCP tools for agents to manage collections
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { CollectionService } from "../services/collection-service.js";

/**
 * Create collection
 */
const createCollectionSchema = z.object({
  id: z.string().describe("Collection ID"),
  name: z.string().describe("Collection name"),
  description: z.string().optional().describe("Collection description"),
  schema: z.record(z.any()).describe("JSON Schema for validation"),
  versioning: z.boolean().optional().default(false).describe("Enable versioning"),
  maxVersions: z.number().optional().describe("Maximum versions to keep per item"),
  permissions: z.record(z.object({
    read: z.boolean(),
    write: z.boolean(),
    delete: z.boolean()
  })).optional().describe("User permissions")
});

/**
 * Create collection item
 */
const createItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  data: z.any().describe("Item data"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Update collection item
 */
const updateItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID"),
  data: z.any().describe("Updated data"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Delete collection item
 */
const deleteItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Query collection
 */
const queryCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  filter: z.record(z.any()).optional().describe("MongoDB-style filter"),
  sort: z.record(z.union([z.literal(1), z.literal(-1)])).optional().describe("Sort order (1=asc, -1=desc)"),
  limit: z.number().optional().default(100).describe("Maximum items to return"),
  skip: z.number().optional().default(0).describe("Number of items to skip"),
  populate: z.array(z.string()).optional().describe("Relations to populate"),
  aggregations: z.array(
    z.record(z.any())
  ).optional().describe("Aggregation operations to run on the results"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Get collection item
 */
const getItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Begin transaction
 */
const beginTransactionSchema = z.object({
  collectionId: z.string().describe("Collection ID")
});

/**
 * Commit transaction
 */
const commitTransactionSchema = z.object({
  transactionId: z.string().describe("Transaction ID"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Rollback transaction
 */
const rollbackTransactionSchema = z.object({
  transactionId: z.string().describe("Transaction ID")
});

/**
 * Export collection
 */
const exportCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  format: z.enum(['json', 'csv', 'ndjson']).describe("Export format"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Import collection data
 */
const importCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  data: z.string().describe("Data to import"),
  format: z.enum(['json', 'csv', 'ndjson']).describe("Import format"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Get item versions
 */
const getItemVersionsSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Get collection statistics
 */
const getCollectionStatsSchema = z.object({
  collectionId: z.string().describe("Collection ID")
});

/**
 * Search collection (full-text search)
 */
const searchCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  query: z.string().describe("Search query string"),
  fields: z.array(z.string()).optional().describe("Fields to search in (default: all)"),
  fuzzy: z.boolean().optional().default(false).describe("Enable fuzzy matching"),
  limit: z.number().optional().default(10).describe("Maximum results"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * List collections
 */
const listCollectionsSchema = z.object({
  filter: z.string().optional().describe("Filter by name or description"),
  category: z.string().optional().describe("Filter by category"),
  limit: z.number().optional().default(50).describe("Maximum collections to return")
});

/**
 * Delete collection
 */
const deleteCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  userId: z.string().optional().describe("User ID for permission check")
});

/**
 * Get collection
 */
const getCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID")
});

/**
 * Create collection template
 */
const createTemplateSchema = z.object({
  templateId: z.string().describe("Template ID (e.g., 'users', 'documents')"),
  collectionId: z.string().describe("Collection ID to create"),
  name: z.string().describe("Collection name"),
  description: z.string().optional().describe("Collection description")
});

/**
 * List available templates
 */
const listTemplatesSchema = z.object({});

/**
 * Aggregate collection data
 */
const aggregateCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  pipeline: z.array(
    z.record(z.any())
  ).describe("Aggregation pipeline stages (MongoDB-style). Each stage is an object with operation name as key (e.g., {$match: {...}}, {$group: {...}})"),
  userId: z.string().optional().describe("User ID for permission check")
});

export function registerCollectionTools(
  server: McpServer,
  collectionService: CollectionService,
  logger: Logger
) {
  /**
   * Create collection
   */
  server.tool(
    "create_collection",
    "Create a new collection with schema, versioning, and permission configuration.",
    createCollectionSchema.shape,
    async (args: z.infer<typeof createCollectionSchema>) => {
      try {
        const collection = collectionService.createCollection({
          id: args.id,
          name: args.name,
          description: args.description,
          schema: args.schema,
          versioning: args.versioning ? {
            enabled: args.versioning,
            maxVersions: args.maxVersions
          } : undefined,
          permissions: args.permissions
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              collection: {
                id: collection.id,
                name: collection.name,
                description: collection.description,
                createdAt: collection.createdAt,
                itemCount: collection.itemCount
              },
              message: `Collection created: ${args.name}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create collection:", error);
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
   * Create collection item
   */
  server.tool(
    "create_collection_item", "Create a new item in a collection. Item will be validated against the collection schema.", createItemSchema.shape,
    async (args: z.infer<typeof createItemSchema>) => {
      try {
        const item = await collectionService.createItem(
          args.collectionId,
          args.data,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              item: {
                id: item.id,
                data: item.data,
                metadata: item.metadata
              },
              message: `Item created in collection ${args.collectionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create collection item:", error);
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
   * Update collection item
   */
  server.tool(
    "update_collection_item", "Update an existing collection item. Changes will be validated and versioned if enabled.", updateItemSchema.shape,
    async (args: z.infer<typeof updateItemSchema>) => {
      try {
        const item = await collectionService.updateItem(
          args.collectionId,
          args.itemId,
          args.data,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              item: {
                id: item.id,
                data: item.data,
                metadata: item.metadata
              },
              message: `Item updated in collection ${args.collectionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to update collection item:", error);
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
   * Delete collection item
   */
  server.tool(
    "delete_collection_item", "Delete an item from a collection. Item will be soft-deleted if versioning is enabled.", deleteItemSchema.shape,
    async (args: z.infer<typeof deleteItemSchema>) => {
      try {
        await collectionService.deleteItem(
          args.collectionId,
          args.itemId,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Item deleted from collection ${args.collectionId}`,
              itemId: args.itemId
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to delete collection item:", error);
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
   * Query collection
   */
  server.tool(
    "query_collection", "Query items in a collection with filtering, sorting, and pagination.", queryCollectionSchema.shape,
    async (args: z.infer<typeof queryCollectionSchema>) => {
      try {
        const result = await collectionService.query(
          args.collectionId,
          {
            filter: args.filter,
            sort: args.sort,
            limit: args.limit,
            skip: args.skip,
            populate: args.populate,
            aggregations: args.aggregations
          },
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              result: {
                items: result.items,
                total: result.total,
                hasMore: result.hasMore,
                skip: result.skip,
                limit: result.limit,
                aggregations: result.aggregations,
                executionTime: result.executionTime,
                fromCache: result.fromCache
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to query collection:", error);
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
   * Get collection item
   */
  server.tool(
    "get_collection_item", "Get a specific item from a collection by ID.", getItemSchema.shape,
    async (args: z.infer<typeof getItemSchema>) => {
      try {
        const item = collectionService.getItem(
          args.collectionId,
          args.itemId,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              item: {
                id: item.id,
                data: item.data,
                metadata: item.metadata,
                relations: item.relations
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get collection item:", error);
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
   * Begin transaction
   */
  server.tool(
    "begin_collection_transaction",
    "Start a transaction for atomic multi-operation updates. Must be committed or rolled back.",
    beginTransactionSchema.shape,
    async (args: z.infer<typeof beginTransactionSchema>) => {
      try {
        const transaction = collectionService.beginTransaction(args.collectionId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              transaction: {
                id: transaction.id,
                collectionId: transaction.collectionId,
                status: transaction.status,
                createdAt: transaction.createdAt
              },
              message: `Transaction started for collection ${args.collectionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to begin transaction:", error);
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
   * Commit transaction
   */
  server.tool(
    "commit_collection_transaction",
    "Commit a transaction, applying all operations atomically.",
    commitTransactionSchema.shape,
    async (args: z.infer<typeof commitTransactionSchema>) => {
      try {
        await collectionService.commitTransaction(args.transactionId, args.userId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Transaction committed: ${args.transactionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to commit transaction:", error);
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
   * Rollback transaction
   */
  server.tool(
    "rollback_collection_transaction",
    "Rollback a transaction, discarding all operations.",
    rollbackTransactionSchema.shape,
    async (args: z.infer<typeof rollbackTransactionSchema>) => {
      try {
        collectionService.rollbackTransaction(args.transactionId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Transaction rolled back: ${args.transactionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to rollback transaction:", error);
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
   * Export collection
   */
  server.tool(
    "export_collection", "Export collection data in various formats (JSON, CSV, NDJSON).", exportCollectionSchema.shape,
    async (args: z.infer<typeof exportCollectionSchema>) => {
      try {
        const data = await collectionService.export(
          args.collectionId,
          args.format,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data,
              format: args.format,
              message: `Collection exported in ${args.format} format`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to export collection:", error);
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
   * Import collection data
   */
  server.tool(
    "import_collection", "Import data into a collection from various formats.", importCollectionSchema.shape,
    async (args: z.infer<typeof importCollectionSchema>) => {
      try {
        const imported = await collectionService.import(
          args.collectionId,
          args.data,
          args.format,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              imported,
              message: `Imported ${imported} items into collection ${args.collectionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to import collection:", error);
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
   * Get item versions
   */
  server.tool(
    "get_collection_item_versions",
    "Get all versions of a collection item (requires versioning to be enabled).",
    getItemVersionsSchema.shape,
    async (args: z.infer<typeof getItemVersionsSchema>) => {
      try {
        const versions = collectionService.getItemVersions(
          args.collectionId,
          args.itemId,
          args.userId
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              versions,
              total: versions.length
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get item versions:", error);
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
   * Get collection statistics
   */
  server.tool(
    "get_collection_stats",
    "Get statistics and metadata about a collection.",
    getCollectionStatsSchema.shape,
    async (args: z.infer<typeof getCollectionStatsSchema>) => {
      try {
        const stats = collectionService.getCollectionStats(args.collectionId);

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
        logger.error("Failed to get collection stats:", error);
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
   * Search collection (full-text search)
   */
  server.tool(
    "search_collection",
    "Perform full-text search across collection items. Supports fuzzy matching and field-specific search.",
    searchCollectionSchema.shape,
    async (args: z.infer<typeof searchCollectionSchema>) => {
      try {
        const collection = collectionService.getCollection(args.collectionId);
        
        // Check read permission
        collectionService.checkPermission(collection, 'read', args.userId);
        
        // Perform search (simple implementation - can be enhanced with proper search library)
        const results = Array.from(collection.items.values()).filter(item => {
          const searchFields = args.fields || Object.keys(item.data);
          const searchQuery = args.query.toLowerCase();
          
          return searchFields.some(field => {
            const value = String(item.data[field] || '').toLowerCase();
            if (args.fuzzy) {
              // Simple fuzzy match: check if query words appear in value
              return searchQuery.split(' ').some(word => value.includes(word));
            } else {
              return value.includes(searchQuery);
            }
          });
        }).slice(0, args.limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              query: args.query,
              totalResults: results.length,
              results: results.map(item => ({
                id: item.id,
                data: item.data,
                metadata: item.metadata
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Search failed:", error);
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
   * List collections
   */
  server.tool(
    "list_collections",
    "List all collections with optional filtering by name, description, or category.",
    listCollectionsSchema.shape,
    async (args: z.infer<typeof listCollectionsSchema>) => {
      try {
        const collections = collectionService.listCollections();
        
        // Apply filters
        let filtered = collections;
        if (args.filter) {
          const filterLower = args.filter.toLowerCase();
          filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(filterLower) ||
            c.description?.toLowerCase().includes(filterLower)
          );
        }
        
        if (args.category) {
          filtered = filtered.filter(c => c.metadata?.category === args.category);
        }
        
        filtered = filtered.slice(0, args.limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: filtered.length,
              collections: filtered.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description,
                itemCount: c.itemCount,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list collections:", error);
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
   * Get collection
   */
  server.tool(
    "get_collection",
    "Get detailed information about a specific collection including schema, configuration, and statistics.",
    getCollectionSchema.shape,
    async (args: z.infer<typeof getCollectionSchema>) => {
      try {
        const collection = collectionService.getCollection(args.collectionId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              collection: {
                id: collection.id,
                name: collection.name,
                description: collection.description,
                schema: collection.schema,
                itemCount: collection.itemCount,
                versioning: collection.versioning,
                indexes: collection.indexes,
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
                stats: collection.stats
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get collection:", error);
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
   * Delete collection
   */
  server.tool(
    "delete_collection",
    "Delete a collection and all its items permanently. This action cannot be undone.",
    deleteCollectionSchema.shape,
    async (args: z.infer<typeof deleteCollectionSchema>) => {
      try {
        const collection = collectionService.getCollection(args.collectionId);
        
        // Check delete permission
        collectionService.checkPermission(collection, 'delete', args.userId);
        
        collectionService.deleteCollection(args.collectionId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Collection deleted: ${args.collectionId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to delete collection:", error);
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
   * Create collection from template
   */
  server.tool(
    "create_collection_template",
    "Create a new collection from a pre-defined template (e.g., users, documents, tasks, logs).",
    createTemplateSchema.shape,
    async (args: z.infer<typeof createTemplateSchema>) => {
      try {
        // Define common templates
        const templates: Record<string, any> = {
          users: {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                name: { type: "string" },
                role: { type: "string", enum: ["user", "admin", "moderator"] },
                createdAt: { type: "string", format: "date-time" }
              },
              required: ["email", "name"]
            },
            versioning: { enabled: true, maxVersions: 5 }
          },
          documents: {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                author: { type: "string" },
                tags: { type: "array", items: { type: "string" } }
              },
              required: ["title", "content"]
            },
            versioning: { enabled: true, maxVersions: 10 }
          },
          tasks: {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                status: { type: "string", enum: ["todo", "in-progress", "done"] },
                priority: { type: "string", enum: ["low", "medium", "high"] },
                assignee: { type: "string" },
                dueDate: { type: "string", format: "date" }
              },
              required: ["title", "status"]
            },
            versioning: { enabled: false }
          },
          logs: {
            schema: {
              type: "object",
              properties: {
                level: { type: "string", enum: ["debug", "info", "warn", "error"] },
                message: { type: "string" },
                timestamp: { type: "string", format: "date-time" },
                source: { type: "string" },
                metadata: { type: "object" }
              },
              required: ["level", "message", "timestamp"]
            },
            versioning: { enabled: false }
          }
        };

        const template = templates[args.templateId];
        if (!template) {
          throw new Error(`Unknown template: ${args.templateId}. Available: ${Object.keys(templates).join(', ')}`);
        }

        const collection = collectionService.createCollection({
          id: args.collectionId,
          name: args.name,
          description: args.description || `${args.name} (from ${args.templateId} template)`,
          schema: template.schema,
          versioning: template.versioning
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              collection: {
                id: collection.id,
                name: collection.name,
                template: args.templateId
              },
              message: `Collection created from ${args.templateId} template`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create collection from template:", error);
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
   * List available templates
   */
  server.tool(
    "list_collection_templates",
    "List all available collection templates with their schemas and descriptions.",
    listTemplatesSchema.shape,
    async () => {
      try {
        const templates = [
          {
            id: "users",
            name: "Users",
            description: "User accounts with email, name, and role",
            versioning: true
          },
          {
            id: "documents",
            name: "Documents",
            description: "Documents with title, content, author, and tags",
            versioning: true
          },
          {
            id: "tasks",
            name: "Tasks",
            description: "Task management with status, priority, and assignment",
            versioning: false
          },
          {
            id: "logs",
            name: "Logs",
            description: "System logs with level, message, and timestamp",
            versioning: false
          }
        ];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: templates.length,
              templates
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list templates:", error);
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
   * Aggregate collection data
   */
  server.tool(
    "aggregate_collection",
    "Run aggregation pipeline on collection data for analytics (MongoDB-style aggregations).",
    aggregateCollectionSchema.shape,
    async (args: z.infer<typeof aggregateCollectionSchema>) => {
      try {
        const collection = collectionService.getCollection(args.collectionId);
        
        // Check read permission
        collectionService.checkPermission(collection, 'read', args.userId);
        
        // Simple aggregation implementation (can be enhanced)
        let data = Array.from(collection.items.values());
        
        for (const stage of args.pipeline) {
          const operation = Object.keys(stage)[0];
          const params = stage[operation];
          
          switch (operation) {
            case '$match':
              // Filter data
              data = data.filter(item => {
                return Object.entries(params).every(([key, value]) => {
                  return item.data[key] === value;
                });
              });
              break;
            
            case '$group':
              // Group by field (simple implementation)
              const grouped = new Map<string, any[]>();
              data.forEach(item => {
                const groupKey = String(item.data[params._id] || 'null');
                if (!grouped.has(groupKey)) grouped.set(groupKey, []);
                grouped.get(groupKey)!.push(item);
              });
              data = Array.from(grouped.entries()).map(([key, items]) => ({
                _id: key,
                count: items.length,
                items
              }) as any);
              break;
            
            case '$limit':
              data = data.slice(0, params);
              break;
            
            case '$skip':
              data = data.slice(params);
              break;
          }
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              resultCount: data.length,
              results: data
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Aggregation failed:", error);
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

  logger.info("Registered 20 collection tools");
}


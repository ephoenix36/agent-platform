/**
 * Skill Management Tools
 * 
 * MCP tools for managing skills lifecycle and composition
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { SkillsService } from "../services/skills-service.js";
import { withHooks } from "../utils/hooked-registry.js";

// Skill rule schema
const skillRuleSchema = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.number().optional(),
  enabled: z.boolean().optional().default(true),
  condition: z.string().optional()
});

// Skill instructions schema
const skillInstructionsSchema = z.object({
  overview: z.string(),
  usage: z.string(),
  examples: z.array(z.string()).optional(),
  bestPractices: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional()
});

// Skill config schema
const skillConfigSchema = z.object({
  toolkits: z.array(z.string()).describe("Toolkit IDs to include"),
  tools: z.array(z.string()).optional().describe("Specific tool names"),
  instructions: skillInstructionsSchema,
  rules: z.array(skillRuleSchema),
  systemPrompt: z.string().optional(),
  autoLoad: z.boolean().optional(),
  exclusive: z.boolean().optional(),
  requiredSkills: z.array(z.string()).optional(),
  conflictingSkills: z.array(z.string()).optional(),
  validators: z.array(z.object({
    type: z.enum(['pre-execution', 'post-execution', 'parameter']),
    code: z.string(),
    message: z.string()
  })).optional()
});

// Create skill schema
const createSkillSchema = z.object({
  id: z.string().describe("Unique skill identifier"),
  name: z.string().describe("Skill name"),
  description: z.string().describe("Skill description"),
  config: skillConfigSchema,
  metadata: z.object({
    author: z.string().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    homepage: z.string().optional(),
    repository: z.string().optional(),
    documentation: z.string().optional(),
    license: z.string().optional()
  }).optional()
});

// Update skill schema
const updateSkillSchema = z.object({
  id: z.string().describe("Skill ID"),
  updates: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    config: skillConfigSchema.optional(),
    enabled: z.boolean().optional(),
    metadata: z.object({
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      homepage: z.string().optional(),
      repository: z.string().optional()
    }).optional()
  })
});

// Get skill schema
const getSkillSchema = z.object({
  id: z.string().describe("Skill ID")
});

// List skills schema
const listSkillsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  enabled: z.boolean().optional(),
  loaded: z.boolean().optional(),
  hasToolkit: z.string().optional(),
  sortBy: z.enum(['name', 'created', 'updated', 'usage', 'rating']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
});

// Load skill schema
const loadSkillSchema = z.object({
  id: z.string().describe("Skill ID")
});

// Unload skill schema
const unloadSkillSchema = z.object({
  id: z.string().describe("Skill ID")
});

// Delete skill schema
const deleteSkillSchema = z.object({
  id: z.string().describe("Skill ID")
});

// Attach skill schema
const attachSkillSchema = z.object({
  skillId: z.string().describe("Skill ID"),
  entityType: z.enum(['agent', 'workflow', 'team', 'collection']),
  entityId: z.string().describe("Entity ID"),
  attachedBy: z.string().optional(),
  overrides: z.object({
    rules: z.record(z.boolean()).optional(),
    tools: z.array(z.string()).optional(),
    systemPrompt: z.string().optional()
  }).optional()
});

// Detach skill schema
const detachSkillSchema = z.object({
  skillId: z.string().describe("Skill ID"),
  entityType: z.enum(['agent', 'workflow', 'team', 'collection']),
  entityId: z.string().describe("Entity ID")
});

// Get attached skills schema
const getAttachedSkillsSchema = z.object({
  entityType: z.enum(['agent', 'workflow', 'team', 'collection']),
  entityId: z.string().describe("Entity ID")
});

// Compose skills schema
const composeSkillsSchema = z.object({
  skillIds: z.array(z.string()).describe("Skill IDs to compose")
});

// Export skill schema
const exportSkillSchema = z.object({
  skillId: z.string().describe("Skill ID"),
  includeDependencies: z.boolean().optional().default(false),
  includeStats: z.boolean().optional().default(false)
});

// Import skill schema
const importSkillSchema = z.object({
  exportData: z.string().describe("JSON string of exported skill data")
});

// Get usage stats schema
const getUsageStatsSchema = z.object({
  skillId: z.string().describe("Skill ID")
});

/**
 * Register all skill management tools
 */
export async function registerSkillTools(
  server: McpServer,
  logger: Logger,
  skillsService: SkillsService
) {
  logger.info("Registering skill management tools...");
  
  // ===== CREATE SKILL =====
  server.tool(
    "create_skill",
    "Create a new skill with toolkits, instructions, and rules",
    createSkillSchema.shape,
    withHooks("create_skill", async (input) => {
      try {
        const skill = await skillsService.createSkill(
          input.id,
          input.name,
          input.description,
          input.config,
          input.metadata
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              skill: {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                enabled: skill.enabled,
                toolkits: skill.config.toolkits,
                ruleCount: skill.config.rules.length
              },
              message: `Skill created: ${skill.name}`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== UPDATE SKILL =====
  server.tool(
    "update_skill",
    "Update an existing skill",
    updateSkillSchema.shape,
    withHooks("update_skill", async (input) => {
      try {
        const skill = await skillsService.updateSkill(input.id, input.updates);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              skill: {
                id: skill.id,
                name: skill.name,
                description: skill.description,
                updated: skill.metadata.updated
              },
              message: `Skill updated: ${skill.name}`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== GET SKILL =====
  server.tool(
    "get_skill",
    "Get a skill by ID",
    getSkillSchema.shape,
    withHooks("get_skill", async (input) => {
      try {
        const skill = skillsService.getSkill(input.id);
        
        if (!skill) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Skill not found: ${input.id}`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              skill
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== LIST SKILLS =====
  server.tool(
    "list_skills",
    "List all skills with optional filtering and sorting",
    listSkillsSchema.shape,
    withHooks("list_skills", async (input) => {
      try {
        const skills = skillsService.listSkills(input);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: skills.length,
              skills: skills.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                enabled: s.enabled,
                loaded: s.loaded,
                toolkits: s.config.toolkits,
                ruleCount: s.config.rules.length,
                category: s.metadata.category,
                tags: s.metadata.tags,
                version: s.metadata.version
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== LOAD SKILL =====
  server.tool(
    "load_skill",
    "Load a skill (activate its toolkits and tools)",
    loadSkillSchema.shape,
    withHooks("load_skill", async (input) => {
      try {
        await skillsService.loadSkill(input.id);
        const skill = skillsService.getSkill(input.id);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Skill loaded: ${input.id}`,
              loadedToolkits: skill?.loadedToolkits || [],
              loadedTools: skill?.loadedTools || []
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== UNLOAD SKILL =====
  server.tool(
    "unload_skill",
    "Unload a skill (deactivate its toolkits and tools)",
    unloadSkillSchema.shape,
    withHooks("unload_skill", async (input) => {
      try {
        await skillsService.unloadSkill(input.id);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Skill unloaded: ${input.id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== DELETE SKILL =====
  server.tool(
    "delete_skill",
    "Delete a skill",
    deleteSkillSchema.shape,
    withHooks("delete_skill", async (input) => {
      try {
        await skillsService.deleteSkill(input.id);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Skill deleted: ${input.id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== ATTACH SKILL =====
  server.tool(
    "attach_skill",
    "Attach a skill to an agent, workflow, team, or collection",
    attachSkillSchema.shape,
    withHooks("attach_skill", async (input) => {
      try {
        const attachment = await skillsService.attachSkill(
          input.skillId,
          input.entityType,
          input.entityId,
          input.attachedBy,
          input.overrides
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              attachment: {
                skillId: attachment.skillId,
                attachedTo: attachment.attachedTo,
                attachedAt: attachment.attachedAt,
                active: attachment.active
              },
              message: `Skill attached: ${input.skillId} to ${input.entityType} ${input.entityId}`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== DETACH SKILL =====
  server.tool(
    "detach_skill",
    "Detach a skill from an entity",
    detachSkillSchema.shape,
    withHooks("detach_skill", async (input) => {
      try {
        await skillsService.detachSkill(
          input.skillId,
          input.entityType,
          input.entityId
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Skill detached: ${input.skillId} from ${input.entityType} ${input.entityId}`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== GET ATTACHED SKILLS =====
  server.tool(
    "get_attached_skills",
    "Get all skills attached to an entity",
    getAttachedSkillsSchema.shape,
    withHooks("get_attached_skills", async (input) => {
      try {
        const attachments = skillsService.getAttachedSkills(
          input.entityType,
          input.entityId
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: attachments.length,
              attachments: attachments.map(a => ({
                skillId: a.skillId,
                attachedAt: a.attachedAt,
                attachedBy: a.attachedBy,
                active: a.active,
                overrides: a.overrides
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== COMPOSE SKILLS =====
  server.tool(
    "compose_skills",
    "Compose multiple skills into a single effective configuration",
    composeSkillsSchema.shape,
    withHooks("compose_skills", async (input) => {
      try {
        const composition = await skillsService.composeSkills(input.skillIds);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              composition: {
                composedId: composition.composedId,
                sourceSkills: composition.sourceSkills,
                toolkitCount: composition.toolkits.length,
                toolCount: composition.tools.length,
                ruleCount: composition.rules.length,
                conflicts: composition.conflicts
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== EXPORT SKILL =====
  server.tool(
    "export_skill",
    "Export a skill to a portable format",
    exportSkillSchema.shape,
    withHooks("export_skill", async (input) => {
      try {
        const exportData = await skillsService.exportSkill(input.skillId, {
          includeDependencies: input.includeDependencies,
          includeStats: input.includeStats
        });
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              exportData
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== IMPORT SKILL =====
  server.tool(
    "import_skill",
    "Import a skill from exported data",
    importSkillSchema.shape,
    withHooks("import_skill", async (input) => {
      try {
        const exportData = JSON.parse(input.exportData);
        const result = await skillsService.importSkill(exportData);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  // ===== GET USAGE STATS =====
  server.tool(
    "get_skill_usage_stats",
    "Get usage statistics for a skill",
    getUsageStatsSchema.shape,
    withHooks("get_skill_usage_stats", async (input) => {
      try {
        const stats = skillsService.getUsageStats(input.skillId);
        
        if (!stats) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `No usage stats found for skill: ${input.skillId}`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              stats
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    })
  );
  
  logger.info(`✓ Registered ${15} skill management tools`);
}

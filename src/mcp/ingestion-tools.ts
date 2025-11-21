/**
 * Agent Ingestion MCP Tools
 * 
 * Tools for importing, converting, and exporting agents across formats
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  detectAgentFormat,
  parseAgent,
  exportAgent,
  completeAgent,
  mapTools,
  AgentFormat,
  UnifiedAgent,
} from '../utils/format-converter.js';
import { AgentManager } from '../core/agent-manager.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Register all agent ingestion tools with the MCP server
 */
export function registerIngestionTools(server: McpServer, agentManager: AgentManager) {
  
  // ============================================================================
  // DETECT AGENT FORMAT
  // ============================================================================
  
  const detectFormatSchema = z.object({
    content: z.string().describe('Agent configuration content'),
    filename: z.string().optional().describe('Optional filename for format hint'),
  });
  
  server.tool(
    'detect_agent_format',
    'Detect the format of an agent configuration (VSCode, CrewAI, LangChain, JSON, YAML, etc.)',
    detectFormatSchema.shape,
    async ({ content, filename }) => {
      try {
        const result = detectAgentFormat(content, filename);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              format: result.format,
              confidence: result.confidence,
              indicators: result.indicators,
              supported: result.format !== 'unknown',
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error detecting format: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
  
  // ============================================================================
  // IMPORT AGENT
  // ============================================================================
  
  const importAgentSchema = z.object({
    content: z.string().describe('Agent configuration content to import'),
    filename: z.string().optional().describe('Optional filename for format detection'),
    enhance: z.boolean().optional().default(true).describe('Enhance with platform patterns'),
    collectionOverride: z.string().optional().describe('Override automatic collection assignment'),
    subsectionOverride: z.string().optional().describe('Override automatic subsection assignment'),
  });
  
  server.tool(
    'import_agent',
    'Import an agent from any supported format (VSCode, CrewAI, LangChain, JSON, YAML). Returns complete agent configuration.',
    importAgentSchema.shape,
    async ({ content, filename, enhance, collectionOverride, subsectionOverride }) => {
      try {
        // Detect format
        const { format, confidence } = detectAgentFormat(content, filename);
        
        if (format === 'unknown') {
          return {
            content: [{
              type: 'text',
              text: 'Error: Unable to detect agent format. Please specify format explicitly or check content structure.'
            }],
            isError: true
          };
        }
        
        // Parse agent
        const partial = parseAgent(content, filename);
        
        // Map tools
        const toolMapping = mapTools(
          [...(partial.requiredTools || []), ...(partial.optionalTools || [])],
          format
        );
        
        // Update tools with mapped versions
        partial.requiredTools = toolMapping.mapped.slice(0, partial.requiredTools?.length || 0);
        partial.optionalTools = toolMapping.mapped.slice(partial.requiredTools?.length || 0);
        
        // Override collection if specified
        if (collectionOverride) partial.collection = collectionOverride;
        if (subsectionOverride) partial.subsection = subsectionOverride;
        
        // Complete agent with defaults
        const agent = completeAgent(partial);
        
        // Add migration notes
        const migrationNotes = [
          `Imported from: ${format}`,
          confidence < 0.8 ? `⚠️ Low confidence detection (${confidence})` : null,
          toolMapping.unmapped.length > 0 ? `Unmapped tools: ${toolMapping.unmapped.join(', ')}` : null,
          toolMapping.mappings.length > 0 ? `Tool mappings:\n${toolMapping.mappings.map(m => `  - ${m.source} → ${m.target}${m.notes ? ` (${m.notes})` : ''}`).join('\n')}` : null,
        ].filter(Boolean).join('\n');
        
        agent.migrationNotes = migrationNotes;
        
        // Enhance if requested
        if (enhance) {
          // Search for similar agents
          const similar = await agentManager.searchAgents({
            query: agent.description,
            limit: 3,
          });
          
          // Add enhancements based on similar agents
          if (similar.length > 0) {
            const highScoring = similar.filter(a => a.currentScore && a.currentScore > 0.8);
            if (highScoring.length > 0) {
              const enhancementNotes = [
                agent.migrationNotes,
                '\nEnhancements from similar agents:',
                ...highScoring.map(s => `  - Similar to: ${s.name} (score: ${s.currentScore?.toFixed(2)})`),
              ].join('\n');
              agent.migrationNotes = enhancementNotes;
            }
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              format,
              confidence,
              agent,
              toolMapping: {
                mapped: toolMapping.mapped,
                unmapped: toolMapping.unmapped,
                mappings: toolMapping.mappings,
              },
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error importing agent: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
  
  // ============================================================================
  // EXPORT AGENT
  // ============================================================================
  
  const exportAgentSchema = z.object({
    collection: z.string().describe('Collection name'),
    subsection: z.string().describe('Subsection name'),
    agentName: z.string().describe('Agent identifier'),
    targetFormat: z.enum([
      'vscode-agent-md',
      'vscode-instructions-md',
      'yaml-crewai',
      'yaml-langchain',
      'json-unified',
    ]).describe('Target export format'),
  });
  
  server.tool(
    'export_agent',
    'Export an existing platform agent to another format (VSCode, CrewAI, LangChain, JSON)',
    exportAgentSchema.shape,
    async ({ collection, subsection, agentName, targetFormat }) => {
      try {
        // Load agent
        const agent = await agentManager.getAgent(collection, subsection, agentName);
        
        if (!agent) {
          return {
            content: [{
              type: 'text',
              text: `Error: Agent not found: ${collection}/${subsection}/${agentName}`
            }],
            isError: true
          };
        }
        
        // Export to target format
        const exported = exportAgent(agent as UnifiedAgent, targetFormat as AgentFormat);
        
        // Generate migration guide
        const migrationGuide = generateMigrationGuide(agent as UnifiedAgent, targetFormat as AgentFormat);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              format: targetFormat,
              exported,
              migrationGuide,
              filename: getSuggestedFilename(agent.name, targetFormat as AgentFormat),
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error exporting agent: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
  
  // ============================================================================
  // BATCH IMPORT
  // ============================================================================
  
  const batchImportSchema = z.object({
    directory: z.string().describe('Directory path to scan for agent files'),
    pattern: z.string().optional().default('**/*.{json,yaml,yml,md}').describe('File pattern to match'),
    enhance: z.boolean().optional().default(true).describe('Enhance with platform patterns'),
  });
  
  server.tool(
    'batch_import_agents',
    'Import multiple agents from a directory. Scans for all supported formats.',
    batchImportSchema.shape,
    async ({ directory, pattern, enhance }) => {
      try {
        const results = {
          total: 0,
          successful: 0,
          failed: 0,
          agents: [] as any[],
          errors: [] as any[],
        };
        
        // Scan directory for files
        const files = await scanDirectory(directory, pattern);
        results.total = files.length;
        
        // Process each file
        for (const file of files) {
          try {
            const content = await fs.readFile(file, 'utf-8');
            const filename = path.basename(file);
            
            // Try to import
            const { format } = detectAgentFormat(content, filename);
            
            if (format === 'unknown') {
              results.failed++;
              results.errors.push({
                file,
                error: 'Unknown format',
              });
              continue;
            }
            
            const partial = parseAgent(content, filename);
            const agent = completeAgent(partial);
            
            results.successful++;
            results.agents.push({
              file,
              format,
              agent: {
                id: agent.id,
                name: agent.name,
                collection: agent.collection,
                subsection: agent.subsection,
              },
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              file,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error in batch import: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
  
  // ============================================================================
  // VALIDATE AGENT
  // ============================================================================
  
  const validateAgentSchema = z.object({
    content: z.string().describe('Agent configuration to validate'),
    format: z.string().optional().describe('Expected format (auto-detect if not provided)'),
  });
  
  server.tool(
    'validate_agent_config',
    'Validate an agent configuration against schema and check for issues',
    validateAgentSchema.shape,
    async ({ content, format }) => {
      try {
        const detected = format || detectAgentFormat(content).format;
        
        // Parse agent
        const partial = parseAgent(content);
        const agent = completeAgent(partial);
        
        // Validation checks
        const issues = [];
        const warnings = [];
        
        // Required fields
        if (!agent.name || agent.name === 'Unnamed Agent') {
          issues.push('Missing or default agent name');
        }
        if (!agent.description) {
          warnings.push('Missing agent description');
        }
        if (!agent.systemPrompt || agent.systemPrompt.length < 100) {
          issues.push('System prompt is too short or missing');
        }
        
        // Tools
        if (agent.requiredTools.length === 0 && agent.optionalTools.length === 0) {
          warnings.push('No tools specified');
        }
        
        // Optimization
        if (!agent.evaluator) {
          warnings.push('No evaluator specified (basic evaluator will be generated)');
        }
        if (!agent.mutator) {
          warnings.push('No mutator specified (basic mutator will be generated)');
        }
        
        // Examples
        if (agent.examples.length === 0) {
          warnings.push('No examples provided');
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              valid: issues.length === 0,
              format: detected,
              issues,
              warnings,
              agent: {
                id: agent.id,
                name: agent.name,
                collection: agent.collection,
                subsection: agent.subsection,
              },
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              valid: false,
              error: error instanceof Error ? error.message : String(error),
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate migration guide for export
 */
function generateMigrationGuide(agent: UnifiedAgent, targetFormat: AgentFormat): string {
  const unsupportedFeatures = [];
  const recommendations = [];
  
  // Check for platform-specific features
  if (agent.evaluator) {
    unsupportedFeatures.push('Evaluator configuration (platform-specific optimization)');
    recommendations.push('Implement manual quality review process');
  }
  
  if (agent.mutator) {
    unsupportedFeatures.push('Mutator configuration (platform-specific optimization)');
    recommendations.push('Iterate manually on agent instructions');
  }
  
  if (agent.optimizationThreshold) {
    unsupportedFeatures.push('Optimization threshold and history');
  }
  
  // Format-specific notes
  let formatNotes = '';
  switch (targetFormat) {
    case 'yaml-crewai':
      formatNotes = 'CrewAI uses a role/goal/backstory structure. Complex system prompts may need manual adjustment.';
      break;
    case 'yaml-langchain':
      formatNotes = 'LangChain requires tool objects, not just names. Additional configuration may be needed.';
      break;
    case 'vscode-agent-md':
      formatNotes = 'VSCode agents use markdown format. Optimization features are not supported but can be documented separately.';
      break;
  }
  
  return `# Migration Guide: ${agent.name} → ${targetFormat}

## Unsupported Features

${unsupportedFeatures.map(f => `- ${f}`).join('\n')}

## Recommendations

${recommendations.map(r => `- ${r}`).join('\n')}

## Format Notes

${formatNotes}

## Tool Mapping

The following tools are used by this agent:
${[...agent.requiredTools, ...agent.optionalTools].map(t => `- ${t}`).join('\n')}

Ensure these tools are available in your target platform or map them to equivalent tools.

## Next Steps

1. Save the exported configuration to your target platform
2. Install required tools and dependencies
3. Test the agent with example inputs
4. Adjust configuration as needed for your platform
`;
}

/**
 * Get suggested filename for export
 */
function getSuggestedFilename(agentName: string, format: AgentFormat): string {
  const baseName = agentName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  switch (format) {
    case 'vscode-agent-md':
      return `${baseName}.agent.md`;
    case 'vscode-instructions-md':
      return `${baseName}.instructions.md`;
    case 'yaml-crewai':
      return `${baseName}-crewai.yaml`;
    case 'yaml-langchain':
      return `${baseName}-langchain.yaml`;
    case 'json-unified':
      return `${baseName}.json`;
    default:
      return `${baseName}.txt`;
  }
}

/**
 * Scan directory for files matching pattern
 */
async function scanDirectory(directory: string, pattern: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        // Simple pattern matching
        const ext = path.extname(entry.name);
        if (['.json', '.yaml', '.yml', '.md'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await scan(directory);
  return files;
}

/**
 * Multi-Format Agent Converter
 * 
 * Utilities for converting between various agent configuration formats:
 * - VSCode (.agent.md, .instructions.md, .prompt.md)
 * - Standard (JSON, YAML, XML, TOML)
 * - Framework-specific (CrewAI, LangChain, AutoGPT, etc.)
 */

import { z } from 'zod';
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// ============================================================================
// UNIFIED SCHEMA
// ============================================================================

export const UnifiedAgentSchema = z.object({
  // Identity
  id: z.string(),
  name: z.string(),
  description: z.string(),
  collection: z.string(),
  subsection: z.string(),
  version: z.string(),
  tags: z.array(z.string()).default([]),
  
  // Definition
  systemPrompt: z.string(),
  userPromptTemplate: z.string().optional(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional()
  })).default([]),
  
  // Model Configuration
  model: z.string().default('claude-4.5-sonnet'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4000),
  topP: z.number().min(0).max(1).default(0.95),
  
  // Tools
  requiredTools: z.array(z.string()).default([]),
  optionalTools: z.array(z.string()).default([]),
  toolkits: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  
  // Optimization
  evaluator: z.any().optional(),
  mutator: z.any().optional(),
  optimizationThreshold: z.number().default(0.75),
  
  // Metadata
  author: z.string().default('imported'),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceFormat: z.string().optional(),
  sourcePath: z.string().optional(),
  migrationNotes: z.string().optional(),
});

export type UnifiedAgent = z.infer<typeof UnifiedAgentSchema>;

// ============================================================================
// FORMAT DETECTION
// ============================================================================

export type AgentFormat = 
  | 'vscode-agent-md'
  | 'vscode-instructions-md'
  | 'vscode-prompt-md'
  | 'vscode-chatmode-md'
  | 'json-unified'
  | 'json-marketplace'
  | 'json-collection'
  | 'yaml-crewai'
  | 'yaml-langchain'
  | 'yaml-generic'
  | 'xml-generic'
  | 'toml-generic'
  | 'unknown';

export interface FormatDetectionResult {
  format: AgentFormat;
  confidence: number;
  indicators: string[];
}

export function detectAgentFormat(
  content: string,
  filename?: string
): FormatDetectionResult {
  const indicators: string[] = [];
  let format: AgentFormat = 'unknown';
  let confidence = 0;
  
  // Check file extension first
  if (filename) {
    if (filename.endsWith('.agent.md')) {
      format = 'vscode-agent-md';
      confidence = 0.9;
      indicators.push('File extension: .agent.md');
    } else if (filename.endsWith('.instructions.md')) {
      format = 'vscode-instructions-md';
      confidence = 0.9;
      indicators.push('File extension: .instructions.md');
    } else if (filename.endsWith('.prompt.md')) {
      format = 'vscode-prompt-md';
      confidence = 0.9;
      indicators.push('File extension: .prompt.md');
    } else if (filename.endsWith('.chatmode.md')) {
      format = 'vscode-chatmode-md';
      confidence = 0.9;
      indicators.push('File extension: .chatmode.md (deprecated)');
    }
  }
  
  const trimmed = content.trim();
  
  // Check for markdown with frontmatter
  if (trimmed.startsWith('---')) {
    const hasFrontmatter = /^---\n[\s\S]+?\n---/.test(trimmed);
    if (hasFrontmatter) {
      indicators.push('YAML frontmatter detected');
      
      // Check for VSCode-specific fields
      if (/systemInstructions:|appliesTo:/.test(content)) {
        if (!format || format === 'unknown') {
          format = 'vscode-instructions-md';
          confidence = 0.8;
        }
        indicators.push('VSCode instructions fields detected');
      } else if (!format || format === 'unknown') {
        format = 'vscode-agent-md';
        confidence = 0.7;
      }
    }
  }
  
  // Check for JSON
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      indicators.push('Valid JSON structure');
      
      // Check for unified schema
      if (parsed.systemPrompt && parsed.evaluator && parsed.mutator) {
        format = 'json-unified';
        confidence = 0.95;
        indicators.push('Unified platform schema detected');
      }
      // Check for marketplace schema
      else if (parsed.success_rate && parsed.total_earnings && parsed.generation) {
        format = 'json-marketplace';
        confidence = 0.95;
        indicators.push('Marketplace schema detected');
      }
      // Check for collection schema
      else if (parsed.collection && parsed.subsection && parsed.systemPrompt) {
        format = 'json-collection';
        confidence = 0.9;
        indicators.push('Collection schema detected');
      }
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // Check for YAML
  if (trimmed.startsWith('---') || /^\w+:/.test(trimmed)) {
    try {
      const parsed = yaml.load(content) as any;
      indicators.push('Valid YAML structure');
      
      // Check for CrewAI format
      if (parsed && typeof parsed === 'object') {
        const firstKey = Object.keys(parsed)[0];
        const agent = parsed[firstKey];
        
        if (agent?.role && agent?.goal && agent?.backstory) {
          format = 'yaml-crewai';
          confidence = 0.95;
          indicators.push('CrewAI schema detected (role/goal/backstory)');
        }
        // Check for LangChain format
        else if (agent?.agent_type || parsed.agent_type) {
          format = 'yaml-langchain';
          confidence = 0.9;
          indicators.push('LangChain schema detected');
        }
        else if (!format || format === 'unknown') {
          format = 'yaml-generic';
          confidence = 0.6;
        }
      }
    } catch (e) {
      // Not valid YAML
    }
  }
  
  // Check for XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<agent')) {
    format = 'xml-generic';
    confidence = 0.8;
    indicators.push('XML structure detected');
  }
  
  // Check for TOML
  if (/^\[[\w.]+\]/.test(trimmed)) {
    format = 'toml-generic';
    confidence = 0.7;
    indicators.push('TOML structure detected');
  }
  
  return { format, confidence, indicators };
}

// ============================================================================
// PARSERS
// ============================================================================

/**
 * Parse VSCode .agent.md format
 */
export function parseVSCodeAgentMd(content: string): Partial<UnifiedAgent> {
  const parts = content.split(/^---$/m);
  
  if (parts.length < 3) {
    throw new Error('Invalid .agent.md format: missing frontmatter');
  }
  
  const frontmatterYaml = parts[1].trim();
  const body = parts.slice(2).join('---').trim();
  
  const frontmatter = yaml.load(frontmatterYaml) as any;
  
  return {
    name: frontmatter.name || 'Unnamed Agent',
    description: frontmatter.description || '',
    model: frontmatter.model || 'claude-4.5-sonnet',
    temperature: frontmatter.temperature,
    maxTokens: frontmatter.maxTokens,
    topP: frontmatter.topP,
    systemPrompt: body,
    requiredTools: Array.isArray(frontmatter.tools) ? frontmatter.tools : [],
    toolkits: frontmatter.toolkits || [],
    skills: frontmatter.skills || [],
    tags: frontmatter.tags || [],
    version: frontmatter.version || '1.0.0',
    author: frontmatter.author || 'imported',
    sourceFormat: 'vscode-agent-md',
  };
}

/**
 * Parse VSCode .instructions.md format
 */
export function parseVSCodeInstructionsMd(content: string): Partial<UnifiedAgent> {
  const parts = content.split(/^---$/m);
  
  if (parts.length < 3) {
    // No frontmatter, treat entire content as instructions
    return {
      systemPrompt: content.trim(),
      sourceFormat: 'vscode-instructions-md',
    };
  }
  
  const frontmatterYaml = parts[1].trim();
  const body = parts.slice(2).join('---').trim();
  
  const frontmatter = yaml.load(frontmatterYaml) as any;
  
  // Extract title from body if present
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Imported Instructions';
  
  return {
    name: title,
    description: frontmatter.description || '',
    systemPrompt: body,
    tags: [],
    sourceFormat: 'vscode-instructions-md',
  };
}

/**
 * Parse VSCode .prompt.md format
 */
export function parseVSCodePromptMd(content: string): Partial<UnifiedAgent> {
  const parts = content.split(/^---$/m);
  
  if (parts.length < 3) {
    throw new Error('Invalid .prompt.md format: missing frontmatter');
  }
  
  const frontmatterYaml = parts[1].trim();
  const body = parts.slice(2).join('---').trim();
  
  const frontmatter = yaml.load(frontmatterYaml) as any;
  
  return {
    name: frontmatter.name || 'Unnamed Prompt',
    description: frontmatter.description || '',
    userPromptTemplate: body,
    systemPrompt: frontmatter.systemInstructions || body,
    requiredTools: frontmatter.tools || [],
    tags: frontmatter.tags || [],
    sourceFormat: 'vscode-prompt-md',
  };
}

/**
 * Parse CrewAI YAML format
 */
export function parseCrewAI(content: string): Partial<UnifiedAgent> {
  const parsed = yaml.load(content) as any;
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid CrewAI format: not a valid YAML object');
  }
  
  // CrewAI format: { agent_id: { role, goal, backstory, tools, llm } }
  const agentId = Object.keys(parsed)[0];
  const agent = parsed[agentId];
  
  if (!agent) {
    throw new Error('Invalid CrewAI format: no agent definition found');
  }
  
  // Synthesize system prompt from CrewAI fields
  const systemPrompt = `# Role\n\n${agent.role || 'AI Agent'}\n\n# Goal\n\n${agent.goal || 'Assist with tasks'}\n\n# Backstory\n\n${agent.backstory || 'An experienced AI assistant'}`;
  
  return {
    id: agentId,
    name: agent.role || agentId,
    description: agent.goal || '',
    systemPrompt,
    model: agent.llm || 'gpt-4',
    requiredTools: agent.tools || [],
    tags: ['crewai', 'imported'],
    sourceFormat: 'yaml-crewai',
  };
}

/**
 * Parse LangChain YAML format
 */
export function parseLangChain(content: string): Partial<UnifiedAgent> {
  const parsed = yaml.load(content) as any;
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid LangChain format: not a valid YAML object');
  }
  
  return {
    name: parsed.agent_name || parsed.name || 'Unnamed Agent',
    description: parsed.description || '',
    systemPrompt: parsed.system_message || parsed.instructions || '',
    model: parsed.llm?.model_name || parsed.model || 'gpt-4',
    temperature: parsed.llm?.temperature || parsed.temperature,
    maxTokens: parsed.llm?.max_tokens || parsed.max_tokens,
    requiredTools: parsed.tools || [],
    tags: ['langchain', 'imported'],
    sourceFormat: 'yaml-langchain',
  };
}

/**
 * Parse platform JSON formats (unified, marketplace, collection)
 */
export function parsePlatformJSON(content: string): Partial<UnifiedAgent> {
  const parsed = JSON.parse(content);
  
  // Already in platform format, validate and return
  return {
    ...parsed,
    sourceFormat: parsed.sourceFormat || 'json-unified',
  };
}

/**
 * Main parser dispatcher
 */
export function parseAgent(content: string, filename?: string): Partial<UnifiedAgent> {
  const { format } = detectAgentFormat(content, filename);
  
  switch (format) {
    case 'vscode-agent-md':
      return parseVSCodeAgentMd(content);
    case 'vscode-instructions-md':
      return parseVSCodeInstructionsMd(content);
    case 'vscode-prompt-md':
      return parseVSCodePromptMd(content);
    case 'yaml-crewai':
      return parseCrewAI(content);
    case 'yaml-langchain':
      return parseLangChain(content);
    case 'json-unified':
    case 'json-marketplace':
    case 'json-collection':
      return parsePlatformJSON(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// ============================================================================
// EXPORTERS
// ============================================================================

/**
 * Export to VSCode .agent.md format
 */
export function exportToVSCodeAgentMd(agent: UnifiedAgent): string {
  const frontmatter = {
    name: agent.name,
    description: agent.description,
    model: agent.model,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    topP: agent.topP,
    tools: [...agent.requiredTools, ...agent.optionalTools],
    toolkits: agent.toolkits,
    skills: agent.skills,
    version: agent.version,
    author: agent.author,
    tags: agent.tags,
  };
  
  const frontmatterYaml = yaml.dump(frontmatter, { lineWidth: -1 });
  
  return `---\n${frontmatterYaml}---\n\n${agent.systemPrompt}`;
}

/**
 * Export to VSCode .instructions.md format
 */
export function exportToVSCodeInstructionsMd(agent: UnifiedAgent): string {
  const frontmatter = {
    description: agent.description,
  };
  
  const frontmatterYaml = yaml.dump(frontmatter);
  
  return `---\n${frontmatterYaml}---\n\n# ${agent.name}\n\n${agent.systemPrompt}`;
}

/**
 * Export to CrewAI YAML format
 */
export function exportToCrewAI(agent: UnifiedAgent): string {
  // Extract role/goal/backstory from system prompt if structured
  const lines = agent.systemPrompt.split('\n');
  let role = agent.name;
  let goal = agent.description;
  let backstory = agent.systemPrompt;
  
  // Try to parse structured prompt
  const roleMatch = agent.systemPrompt.match(/(?:^|\n)#\s*Role\s*\n+(.*?)(?=\n#|$)/is);
  const goalMatch = agent.systemPrompt.match(/(?:^|\n)#\s*Goal\s*\n+(.*?)(?=\n#|$)/is);
  const backstoryMatch = agent.systemPrompt.match(/(?:^|\n)#\s*Backstory\s*\n+(.*?)(?=\n#|$)/is);
  
  if (roleMatch) role = roleMatch[1].trim();
  if (goalMatch) goal = goalMatch[1].trim();
  if (backstoryMatch) backstory = backstoryMatch[1].trim();
  
  const crewAgent = {
    [agent.id]: {
      role,
      goal,
      backstory,
      tools: agent.requiredTools,
      llm: agent.model,
      max_iter: Math.floor(agent.maxTokens / 100),
      verbose: true,
      allow_delegation: false,
    },
  };
  
  return yaml.dump(crewAgent, { lineWidth: -1 });
}

/**
 * Export to LangChain YAML format
 */
export function exportToLangChain(agent: UnifiedAgent): string {
  const langchainAgent = {
    agent_name: agent.name,
    agent_type: 'zero-shot-react-description',
    llm: {
      model_name: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    },
    tools: [...agent.requiredTools, ...agent.optionalTools],
    system_message: agent.systemPrompt,
    memory: {
      type: 'conversation_buffer',
    },
    verbose: true,
  };
  
  return yaml.dump(langchainAgent, { lineWidth: -1 });
}

/**
 * Export to platform JSON format
 */
export function exportToPlatformJSON(agent: UnifiedAgent, pretty = true): string {
  return JSON.stringify(agent, null, pretty ? 2 : 0);
}

/**
 * Main export dispatcher
 */
export function exportAgent(agent: UnifiedAgent, targetFormat: AgentFormat): string {
  switch (targetFormat) {
    case 'vscode-agent-md':
      return exportToVSCodeAgentMd(agent);
    case 'vscode-instructions-md':
      return exportToVSCodeInstructionsMd(agent);
    case 'yaml-crewai':
      return exportToCrewAI(agent);
    case 'yaml-langchain':
      return exportToLangChain(agent);
    case 'json-unified':
    case 'json-collection':
      return exportToPlatformJSON(agent);
    default:
      throw new Error(`Export to ${targetFormat} not yet implemented`);
  }
}

// ============================================================================
// TRANSFORMATION HELPERS
// ============================================================================

/**
 * Generate ID from name
 */
export function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Infer collection from agent content
 */
export function inferCollection(agent: Partial<UnifiedAgent>): { collection: string; subsection: string } {
  const text = `${agent.name} ${agent.description} ${agent.systemPrompt}`.toLowerCase();
  
  // Business domains
  if (/marketing|campaign|email|ad|content|seo/.test(text)) {
    return { collection: 'business-agents', subsection: 'marketing' };
  }
  if (/sales|outbound|proposal|deal|crm/.test(text)) {
    return { collection: 'business-agents', subsection: 'sales' };
  }
  if (/customer|support|success|onboarding|churn/.test(text)) {
    return { collection: 'business-agents', subsection: 'customer-success' };
  }
  if (/product|feature|roadmap|prd|user story/.test(text)) {
    return { collection: 'business-agents', subsection: 'product' };
  }
  
  // Technical domains
  if (/code|programming|developer|api|backend|frontend/.test(text)) {
    return { collection: 'web-development', subsection: 'full-stack' };
  }
  if (/research|analysis|data|report|study/.test(text)) {
    return { collection: 'research', subsection: 'analysis' };
  }
  if (/creative|design|content|writing/.test(text)) {
    return { collection: 'creative-tools', subsection: 'content' };
  }
  if (/agent|meta|workflow|orchestration/.test(text)) {
    return { collection: 'meta-agents', subsection: 'core' };
  }
  
  // Default
  return { collection: 'imported-agents', subsection: 'general' };
}

/**
 * Generate basic evaluator if missing
 */
export function generateBasicEvaluator(agent: Partial<UnifiedAgent>): any {
  return {
    type: 'llm-judge',
    implementation: `evaluators/${agent.collection}/${agent.subsection}/${agent.id}-eval.py`,
    successCriteria: [
      {
        name: 'output_quality',
        description: 'Output meets quality standards',
        weight: 0.4,
        required: true,
      },
      {
        name: 'instruction_following',
        description: 'Agent follows instructions accurately',
        weight: 0.3,
        required: true,
      },
      {
        name: 'completeness',
        description: 'Output is complete and thorough',
        weight: 0.3,
        required: false,
      },
    ],
    weightedMetrics: [
      { name: 'quality', weight: 0.5, aggregation: 'mean' },
      { name: 'accuracy', weight: 0.5, aggregation: 'mean' },
    ],
  };
}

/**
 * Generate basic mutator if missing
 */
export function generateBasicMutator(agent: Partial<UnifiedAgent>): any {
  return {
    strategies: ['instruction-refinement', 'clarity-enhancement', 'example-improvement'],
    constraints: [
      {
        name: 'preserve_functionality',
        type: 'content',
        value: true,
      },
    ],
    implementation: `mutators/${agent.collection}/${agent.subsection}/${agent.id}-mutator.py`,
    mutationRate: 0.2,
  };
}

/**
 * Complete partial agent with defaults and inferred values
 */
export function completeAgent(partial: Partial<UnifiedAgent>): UnifiedAgent {
  const now = new Date().toISOString();
  
  // Generate ID if missing
  const id = partial.id || generateId(partial.name || 'unnamed-agent');
  
  // Infer collection if missing
  const { collection, subsection } = partial.collection && partial.subsection
    ? { collection: partial.collection, subsection: partial.subsection }
    : inferCollection(partial);
  
  // Complete with defaults
  const complete: UnifiedAgent = {
    id,
    name: partial.name || 'Unnamed Agent',
    description: partial.description || '',
    collection,
    subsection,
    version: partial.version || '1.0.0',
    tags: partial.tags || [],
    systemPrompt: partial.systemPrompt || '',
    userPromptTemplate: partial.userPromptTemplate,
    examples: partial.examples || [],
    model: partial.model || 'claude-4.5-sonnet',
    temperature: partial.temperature ?? 0.7,
    maxTokens: partial.maxTokens || 4000,
    topP: partial.topP ?? 0.95,
    requiredTools: partial.requiredTools || [],
    optionalTools: partial.optionalTools || [],
    toolkits: partial.toolkits || [],
    skills: partial.skills || [],
    evaluator: partial.evaluator || generateBasicEvaluator({ ...partial, id, collection, subsection }),
    mutator: partial.mutator || generateBasicMutator({ ...partial, id, collection, subsection }),
    optimizationThreshold: partial.optimizationThreshold ?? 0.75,
    author: partial.author || 'imported',
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    sourceFormat: partial.sourceFormat,
    sourcePath: partial.sourcePath,
    migrationNotes: partial.migrationNotes,
  };
  
  return complete;
}

// ============================================================================
// TOOL MAPPING
// ============================================================================

interface ToolMapping {
  source: string;
  target: string;
  notes?: string;
}

const TOOL_MAPPINGS: Record<string, ToolMapping[]> = {
  'crewai': [
    { source: 'web_search', target: 'web-search' },
    { source: 'file_read', target: 'read_file' },
    { source: 'file_write', target: 'create_file' },
    { source: 'python_repl', target: 'run_in_terminal', notes: 'Use PowerShell/Python terminal' },
    { source: 'calculator', target: 'calculator' },
  ],
  'langchain': [
    { source: 'serpapi', target: 'web-search', notes: 'Use platform web search' },
    { source: 'wikipedia', target: 'web-search', notes: 'Search Wikipedia via web-search' },
    { source: 'requests', target: 'fetch_webpage' },
    { source: 'python', target: 'run_in_terminal' },
  ],
};

/**
 * Map tools from source format to platform tools
 */
export function mapTools(tools: string[], sourceFormat: string): {
  mapped: string[];
  unmapped: string[];
  mappings: ToolMapping[];
} {
  const format = sourceFormat.split('-')[0]; // 'yaml-crewai' -> 'crewai'
  const mappings = TOOL_MAPPINGS[format] || [];
  
  const mapped: string[] = [];
  const unmapped: string[] = [];
  const usedMappings: ToolMapping[] = [];
  
  for (const tool of tools) {
    const mapping = mappings.find(m => m.source === tool);
    if (mapping) {
      mapped.push(mapping.target);
      usedMappings.push(mapping);
    } else {
      // Try direct mapping (tool might already be in platform format)
      if (/^[a-z_-]+$/.test(tool)) {
        mapped.push(tool);
      } else {
        unmapped.push(tool);
      }
    }
  }
  
  return { mapped, unmapped, mappings: usedMappings };
}

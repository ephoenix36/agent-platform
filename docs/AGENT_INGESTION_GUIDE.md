# Agent Ingestion System Documentation

## Overview

The Agent Ingestion System enables seamless import, export, and conversion of AI agent configurations across all major formats and platforms. This system acts as a universal translator for agent definitions, making it easy to migrate agents between platforms or integrate agents from various sources.

## Quick Start

### Import an Agent

```typescript
// Using MCP tools
const result = await import_agent({
  content: agentFileContent,
  filename: 'my-agent.agent.md',
  enhance: true
});
```

### Export an Agent

```typescript
// Using MCP tools
const result = await export_agent({
  collection: 'business-agents',
  subsection: 'marketing',
  agentName: 'email-campaign-architect',
  targetFormat: 'yaml-crewai'
});
```

## Supported Formats

### Input Formats

#### VSCode/GitHub Copilot Formats

1. **`.agent.md`** - Custom agent definitions with YAML frontmatter
   - Full agent configuration with metadata
   - Markdown body for instructions
   - Tool and model specifications

2. **`.instructions.md`** - File-specific instruction files
   - Pattern-based activation (`appliesTo`)
   - Simpler frontmatter structure
   - Used for context-specific guidance

3. **`.prompt.md`** - Reusable prompt templates
   - Parameterized prompts with `{variables}`
   - Can include tool specifications
   - Designed for task automation

4. **`.chatmode.md`** - Chat mode configurations (deprecated)
   - Legacy format, migrates to `.agent.md`

#### Standard Configuration Formats

5. **JSON** - Multiple schema variants
   - Unified platform schema (full featured)
   - Marketplace schema (performance metrics)
   - Collection schema (organizational)

6. **YAML** - Various formats
   - CrewAI format
   - LangChain format
   - Generic configuration

7. **XML** - Enterprise legacy formats

8. **TOML** - Python-based configurations

#### Framework-Specific Formats

9. **CrewAI** - `agents.yaml` format
   - Role/goal/backstory structure
   - Tool lists
   - LLM configuration

10. **LangChain** - Agent configuration objects
    - Agent type specification
    - Tool objects
    - Memory configuration

11. **AutoGPT** - Auto-GPT agent definitions
    - Goals list
    - Commands/tools
    - Constraints

12. **OpenAI Assistants API** - Assistant configuration
    - Instructions
    - File attachments
    - Tool specifications

13. **Semantic Kernel** - SK agent configs

14. **Agent Protocol** - Standard agent protocol format

15. **Anthropic Claude** - Claude-specific configs

### Output Formats

All input formats PLUS:
- **Unified Platform Schema** - Internal collection format
- **Marketplace Schema** - Public marketplace format
- **Documentation** - Auto-generated agent docs
- **Migration Reports** - Detailed conversion logs

## Architecture

### Components

1. **Agent Ingestion Architect** (`collections/meta-agents/core/agent-ingestion-architect.json`)
   - Elite meta-agent for orchestrating imports/exports
   - Handles format detection, transformation, and validation
   - Generates migration reports and documentation

2. **Format Converter** (`src/utils/format-converter.ts`)
   - TypeScript utilities for format detection
   - Parsers for each supported format
   - Exporters for each output format
   - Tool mapping tables

3. **MCP Tools** (`src/mcp/ingestion-tools.ts`)
   - `detect_agent_format` - Auto-detect format
   - `import_agent` - Import from any format
   - `export_agent` - Export to target format
   - `batch_import_agents` - Import multiple agents
   - `validate_agent_config` - Validate configuration

4. **Skills** (`collections/skills/format-parsing/`)
   - `vscode-format-specialist` - VSCode formats expertise
   - `framework-format-specialist` - Framework formats expertise

### Data Flow

```
Source Agent File
    ↓
Format Detection (auto or hint)
    ↓
Format-Specific Parser
    ↓
Partial Agent Object
    ↓
Schema Transformation
    ↓
Tool Mapping
    ↓
Enhancement (optional)
    ↓
Validation
    ↓
Complete Agent Object
    ↓
Storage & Registration
    ↓
Migration Report
```

## Usage Examples

### Example 1: Import VSCode Agent

**Input File: `code-reviewer.agent.md`**
```markdown
---
name: Code Reviewer
description: Expert code review assistant
model: claude-4.5-sonnet
temperature: 0.3
maxTokens: 4000
tools: [read_file, list_dir, grep_search]
tags: [code-review, quality-assurance]
---

# Code Reviewer

You are an expert code reviewer specializing in best practices, security, and performance.

## Review Process

1. Analyze code structure and organization
2. Check for security vulnerabilities
3. Identify performance bottlenecks
4. Verify best practices adherence
5. Provide actionable recommendations

## Quality Standards

- Security: No critical vulnerabilities
- Performance: No obvious bottlenecks
- Maintainability: Clear, documented code
- Testing: Adequate test coverage
```

**Import Command:**
```typescript
await import_agent({
  content: readFileSync('code-reviewer.agent.md', 'utf-8'),
  filename: 'code-reviewer.agent.md',
  enhance: true
});
```

**Result:**
- Agent saved to `collections/web-development/code-review/code-reviewer.json`
- Enhanced with platform patterns
- Generated evaluator for code quality
- Added examples from similar agents
- Created migration report

### Example 2: Import CrewAI Agent

**Input File: `researcher.yaml`**
```yaml
senior_researcher:
  role: Senior Data Researcher
  goal: Uncover cutting-edge developments in AI and machine learning
  backstory: >
    You're a seasoned researcher with a Ph.D. in Computer Science
    and extensive experience in AI research. You have published
    numerous papers and stay current with the latest developments.
  tools:
    - web_search
    - document_analyzer
    - python_repl
  llm: gpt-4-turbo
  max_iter: 20
  verbose: true
  allow_delegation: false
```

**Import Command:**
```typescript
await import_agent({
  content: readFileSync('researcher.yaml', 'utf-8'),
  filename: 'researcher.yaml',
  enhance: true
});
```

**Result:**
- Format detected: `yaml-crewai`
- System prompt synthesized from role/goal/backstory
- Tools mapped: `web_search` → `web-search`, `python_repl` → `run_in_terminal`
- Agent saved to `collections/research/data-analysis/senior-researcher.json`
- Migration notes document tool mappings and transformations

### Example 3: Export to LangChain

**Export Command:**
```typescript
await export_agent({
  collection: 'business-agents',
  subsection: 'marketing',
  agentName: 'email-campaign-architect',
  targetFormat: 'yaml-langchain'
});
```

**Output: `email-campaign-architect-langchain.yaml`**
```yaml
agent_name: Email Campaign Architect
agent_type: zero-shot-react-description
llm:
  model_name: claude-4.5-sonnet
  temperature: 0.7
  max_tokens: 4000
tools:
  - web-search
  - calculator
  - read_file
system_message: |
  You are an Email Marketing Strategist...
  [full system prompt]
memory:
  type: conversation_buffer
verbose: true
```

**Plus Migration Guide:**
```markdown
# Migration Guide: Email Campaign Architect → LangChain

## Unsupported Features
- Evaluator configuration (platform-specific optimization)
- Mutator configuration (platform-specific optimization)
- Optimization history
- Platform-specific tool permissions

## Recommendations
- Implement manual quality review process
- Iterate manually on agent configuration
- Test with LangChain's evaluation framework

## Tool Mapping
All tools successfully mapped to LangChain equivalents

## Next Steps
1. Install LangChain and dependencies
2. Configure tools in your environment
3. Test agent with example inputs
4. Adjust system_message for your use case
```

### Example 4: Batch Import

**Import Command:**
```typescript
await batch_import_agents({
  directory: '/path/to/agents',
  pattern: '**/*.{json,yaml,md}',
  enhance: true
});
```

**Result:**
```json
{
  "total": 15,
  "successful": 13,
  "failed": 2,
  "agents": [
    {
      "file": "/path/to/agents/agent1.agent.md",
      "format": "vscode-agent-md",
      "agent": {
        "id": "agent1",
        "name": "Agent 1",
        "collection": "business-agents",
        "subsection": "sales"
      }
    },
    // ... more agents
  ],
  "errors": [
    {
      "file": "/path/to/agents/broken.yaml",
      "error": "Invalid YAML: unexpected token"
    },
    {
      "file": "/path/to/agents/incomplete.json",
      "error": "Missing required field: name"
    }
  ]
}
```

## Format Specifications

### VSCode .agent.md Format

**Structure:**
```markdown
---
# Required fields
name: string
description: string
model: string

# Optional fields
temperature: number (0-2)
maxTokens: number
topP: number (0-1)
tools: string[]
toolkits: string[]
skills: string[]
version: string
author: string
tags: string[]
---

# Agent Name

[Markdown instructions content]

## Sections

[Additional sections as needed]
```

**Parsing Rules:**
1. Split on `---` delimiters
2. Parse YAML between first two delimiters as frontmatter
3. Remaining content is system prompt
4. Tools array must be valid JSON array in YAML

**Example:**
```markdown
---
name: Sales Assistant
description: Helps with sales processes
model: claude-4.5-sonnet
temperature: 0.7
tools: [read_file, web-search]
---

# Sales Assistant

You are an expert sales assistant...
```

### CrewAI Format

**Structure:**
```yaml
agent_id:
  role: string (required)
  goal: string (required)
  backstory: string (required)
  tools: string[] (optional)
  llm: string (optional, default: gpt-4)
  max_iter: number (optional, default: 15)
  verbose: boolean (optional, default: true)
  allow_delegation: boolean (optional, default: false)
```

**System Prompt Synthesis:**
```
# Role

{role}

# Goal

{goal}

# Backstory

{backstory}
```

**Tool Mapping:**
- `web_search` → `web-search`
- `file_read` → `read_file`
- `file_write` → `create_file`
- `python_repl` → `run_in_terminal`

### LangChain Format

**Structure:**
```yaml
agent_name: string (required)
agent_type: string (optional, default: zero-shot-react-description)
llm:
  model_name: string (required)
  temperature: number (optional)
  max_tokens: number (optional)
tools: string[] (optional)
system_message: string (optional)
memory:
  type: string (optional)
verbose: boolean (optional)
```

**Tool Mapping:**
- `serpapi` → `web-search`
- `wikipedia` → `web-search`
- `requests` → `fetch_webpage`
- `python` → `run_in_terminal`

## Configuration

### Enhancement Options

When importing agents, you can enable various enhancements:

```typescript
await import_agent({
  content: agentContent,
  enhance: true,           // Enable all enhancements
  collectionOverride: 'custom-agents',  // Override collection
  subsectionOverride: 'specialized',    // Override subsection
});
```

**Enhancements include:**
- Search for similar agents
- Add common tools from similar agents
- Generate examples based on agent purpose
- Add defensive guardrails to system prompt
- Enrich metadata with relevant tags
- Set appropriate difficulty level

### Tool Mapping

Custom tool mappings can be added to `src/utils/format-converter.ts`:

```typescript
const TOOL_MAPPINGS: Record<string, ToolMapping[]> = {
  'custom-framework': [
    { source: 'custom_tool', target: 'platform-tool', notes: 'Optional notes' },
  ],
};
```

## Migration Reports

Every import generates a detailed migration report:

```markdown
# Agent Import Report

## Source Information
- **Format:** vscode-agent-md
- **Original Location:** /path/to/agent.agent.md
- **Import Date:** 2025-11-19T12:00:00Z

## Agent Details
- **ID:** code-reviewer
- **Name:** Code Reviewer
- **Collection:** web-development/code-review
- **Version:** 1.0.0

## Transformation Summary
- **Fields Mapped:** 12/12
- **Tools Converted:** 3 (all mapped successfully)
- **Enhancements Applied:**
  - Added defensive guardrails
  - Generated basic evaluator
  - Added 2 examples from similar agents
- **Issues Resolved:** 0

## Quality Metrics
- **Schema Compliance:** ✅
- **Tool Availability:** 3/3
- **Optimization Ready:** ✅
- **Examples Present:** 2

## Migration Notes
Imported from: vscode-agent-md
Tool mappings:
  - All tools directly available in platform

Enhancements from similar agents:
  - Similar to: api-code-reviewer (score: 0.85)
  - Added common code review frameworks
  - Enhanced with security check patterns

## Next Steps
- Review and test agent with sample code
- Customize security rules if needed
- Add domain-specific examples
- Consider adding to code-review workflow

## Related Agents
- api-code-reviewer (0.85)
- security-scanner (0.78)
- performance-analyzer (0.72)
```

## Best Practices

### Importing Agents

1. **Always review migration reports** - Check for tool mapping issues and unsupported features
2. **Test imported agents** - Verify they work as expected in the platform
3. **Enhance selectively** - Use `enhance: true` for new agents, `false` to preserve originals
4. **Document customizations** - Add notes to agent metadata about any manual adjustments
5. **Use batch imports** - Efficient for migrating entire agent libraries

### Exporting Agents

1. **Include migration guides** - Always generate migration documentation
2. **Test exports** - Validate exported configurations work in target platform
3. **Document tool mappings** - Clearly communicate any tool substitutions
4. **Preserve intent** - Ensure core functionality is maintained in export

### Tool Mapping

1. **Map conservatively** - Only map tools when functionality is equivalent
2. **Document unmapped tools** - List tools that couldn't be mapped
3. **Suggest alternatives** - Provide recommendations for unavailable tools
4. **Test mappings** - Verify mapped tools provide expected functionality

## Troubleshooting

### Import Failures

**Problem:** "Unknown format" error

**Solution:**
- Check file extension matches content format
- Provide explicit `filename` parameter with correct extension
- Verify content structure matches expected format
- Use `detect_agent_format` to diagnose

**Problem:** "Missing required field" error

**Solution:**
- Check format specification for required fields
- Provide defaults in import options
- Use enhancement mode to generate missing fields

### Export Failures

**Problem:** "Agent not found" error

**Solution:**
- Verify collection, subsection, and agentName are correct
- Use `search_agents` to find correct location
- Check agent hasn't been moved or renamed

**Problem:** "Unsupported feature" warning

**Solution:**
- Review migration guide for unsupported features
- Implement alternatives in target platform
- Document workarounds for missing functionality

### Tool Mapping Issues

**Problem:** Tools not mapping correctly

**Solution:**
- Check tool mapping tables in format converter
- Add custom mappings for framework-specific tools
- Document unmapped tools in migration notes
- Consider marking as optional tools

## API Reference

### MCP Tools

#### `detect_agent_format`

Detect the format of an agent configuration.

**Parameters:**
- `content` (string): Agent configuration content
- `filename` (string, optional): Filename for format hint

**Returns:**
```typescript
{
  format: AgentFormat;
  confidence: number;
  indicators: string[];
  supported: boolean;
}
```

#### `import_agent`

Import an agent from any supported format.

**Parameters:**
- `content` (string): Agent configuration content
- `filename` (string, optional): Filename for format detection
- `enhance` (boolean, optional): Enhance with platform patterns (default: true)
- `collectionOverride` (string, optional): Override collection assignment
- `subsectionOverride` (string, optional): Override subsection assignment

**Returns:**
```typescript
{
  success: boolean;
  format: AgentFormat;
  confidence: number;
  agent: UnifiedAgent;
  toolMapping: ToolMappingResult;
}
```

#### `export_agent`

Export an existing agent to another format.

**Parameters:**
- `collection` (string): Collection name
- `subsection` (string): Subsection name
- `agentName` (string): Agent identifier
- `targetFormat` (AgentFormat): Target export format

**Returns:**
```typescript
{
  success: boolean;
  format: AgentFormat;
  exported: string;
  migrationGuide: string;
  filename: string;
}
```

#### `batch_import_agents`

Import multiple agents from a directory.

**Parameters:**
- `directory` (string): Directory path to scan
- `pattern` (string, optional): File pattern to match (default: `**/*.{json,yaml,yml,md}`)
- `enhance` (boolean, optional): Enhance with platform patterns (default: true)

**Returns:**
```typescript
{
  total: number;
  successful: number;
  failed: number;
  agents: ImportedAgent[];
  errors: ImportError[];
}
```

#### `validate_agent_config`

Validate an agent configuration against schema.

**Parameters:**
- `content` (string): Agent configuration to validate
- `format` (string, optional): Expected format (auto-detect if not provided)

**Returns:**
```typescript
{
  valid: boolean;
  format: AgentFormat;
  issues: string[];
  warnings: string[];
  agent: AgentSummary;
}
```

## Contributing

### Adding New Format Support

1. **Add format detection** in `src/utils/format-converter.ts`:
   ```typescript
   if (content.match(/new-format-pattern/)) {
     format = 'new-format';
     confidence = 0.9;
   }
   ```

2. **Create parser function**:
   ```typescript
   export function parseNewFormat(content: string): Partial<UnifiedAgent> {
     // Parse logic
     return partialAgent;
   }
   ```

3. **Add to main parser**:
   ```typescript
   case 'new-format':
     return parseNewFormat(content);
   ```

4. **Create exporter function** (if applicable):
   ```typescript
   export function exportToNewFormat(agent: UnifiedAgent): string {
     // Export logic
     return formattedContent;
   }
   ```

5. **Add tool mappings**:
   ```typescript
   const TOOL_MAPPINGS: Record<string, ToolMapping[]> = {
     'new-format': [
       { source: 'format_tool', target: 'platform-tool' },
     ],
   };
   ```

6. **Update documentation** with format specifications and examples

7. **Add tests** for parser and exporter

## Support

For issues, questions, or contributions:
- Check troubleshooting section above
- Review migration reports for specific error details
- Consult format specifications
- Open an issue with minimal reproduction case

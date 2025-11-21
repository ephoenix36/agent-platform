# Agent Ingestion Quick Reference

## Common Commands

### Import Agent
```typescript
// Import with auto-detection
import_agent({
  content: fileContent,
  filename: 'agent.agent.md',
  enhance: true
})

// Import with overrides
import_agent({
  content: fileContent,
  collectionOverride: 'custom-agents',
  subsectionOverride: 'specialized',
  enhance: false  // Preserve original
})
```

### Export Agent
```typescript
// Export to VSCode format
export_agent({
  collection: 'business-agents',
  subsection: 'marketing',
  agentName: 'email-campaign-architect',
  targetFormat: 'vscode-agent-md'
})

// Export to CrewAI
export_agent({
  collection: 'research',
  subsection: 'analysis',
  agentName: 'data-analyzer',
  targetFormat: 'yaml-crewai'
})
```

### Batch Import
```typescript
batch_import_agents({
  directory: '/path/to/agents',
  enhance: true
})
```

### Detect Format
```typescript
detect_agent_format({
  content: fileContent,
  filename: 'agent.yaml'
})
```

### Validate Config
```typescript
validate_agent_config({
  content: configContent
})
```

## Supported Formats

| Format | Extension | Import | Export | Notes |
|--------|-----------|--------|--------|-------|
| VSCode Agent | `.agent.md` | ✅ | ✅ | Full featured |
| VSCode Instructions | `.instructions.md` | ✅ | ✅ | Pattern-based |
| VSCode Prompt | `.prompt.md` | ✅ | ❌ | Templates |
| CrewAI | `.yaml` | ✅ | ✅ | role/goal/backstory |
| LangChain | `.yaml` | ✅ | ✅ | Agent type |
| Platform JSON | `.json` | ✅ | ✅ | Native format |
| AutoGPT | `.json` | ✅ | ❌ | Goals/commands |
| OpenAI Assistants | `.json` | ✅ | ❌ | API format |

## Format Detection

### VSCode .agent.md
**Indicators:**
- Extension: `.agent.md`
- YAML frontmatter (`---`)
- Fields: `name`, `model`, `tools`

### CrewAI
**Indicators:**
- Extension: `.yaml`
- Root key is agent ID
- Fields: `role`, `goal`, `backstory`

### LangChain
**Indicators:**
- Extension: `.yaml`
- Field: `agent_type`
- LLM object structure

## Tool Mappings

### CrewAI → Platform
| CrewAI | Platform |
|--------|----------|
| `web_search` | `web-search` |
| `file_read` | `read_file` |
| `file_write` | `create_file` |
| `python_repl` | `run_in_terminal` |

### LangChain → Platform
| LangChain | Platform |
|-----------|----------|
| `serpapi` | `web-search` |
| `wikipedia` | `web-search` |
| `requests` | `fetch_webpage` |
| `python` | `run_in_terminal` |

## Schema Fields

### Unified Agent Schema
```typescript
{
  // Identity
  id: string
  name: string
  description: string
  collection: string
  subsection: string
  version: string
  tags: string[]
  
  // Definition
  systemPrompt: string
  userPromptTemplate?: string
  examples: Example[]
  
  // Model Config
  model: string
  temperature: number
  maxTokens: number
  topP: number
  
  // Tools
  requiredTools: string[]
  optionalTools: string[]
  toolkits: string[]
  skills: string[]
  
  // Optimization
  evaluator?: Evaluator
  mutator?: Mutator
  optimizationThreshold: number
  
  // Metadata
  author: string
  createdAt: string
  updatedAt: string
  sourceFormat?: string
  sourcePath?: string
  migrationNotes?: string
}
```

## Common Issues

### Import Errors

**"Unknown format"**
- Check file extension
- Verify content structure
- Use `detect_agent_format` first

**"Missing required field"**
- Check format specification
- Enable enhancements
- Provide overrides

**"Tool mapping failed"**
- Review tool mapping tables
- Check migration notes
- Add custom mappings

### Export Errors

**"Agent not found"**
- Verify collection/subsection/name
- Use `search_agents` to find
- Check for typos

**"Unsupported format"**
- Check supported formats table
- Request format support
- Use alternative format

## Enhancement Features

When `enhance: true`:
- ✅ Search for similar agents
- ✅ Add common tools
- ✅ Generate examples
- ✅ Add guardrails
- ✅ Enrich metadata
- ✅ Set difficulty level
- ✅ Generate optimization config

## File Locations

### Ingestion Agent
`collections/meta-agents/core/agent-ingestion-architect.json`

### Format Converter
`src/utils/format-converter.ts`

### MCP Tools
`src/mcp/ingestion-tools.ts`

### Skills
- `collections/skills/format-parsing/vscode-format-specialist.json`
- `collections/skills/format-parsing/framework-format-specialist.json`

### Documentation
- `docs/AGENT_INGESTION_GUIDE.md` - Full guide
- `docs/AGENT_INGESTION_QUICK_REFERENCE.md` - This file

## Example Workflows

### Workflow 1: VSCode → Platform
```typescript
// 1. Detect format
const { format } = await detect_agent_format({
  content: vsCodeAgent,
  filename: 'agent.agent.md'
});

// 2. Import with enhancements
const result = await import_agent({
  content: vsCodeAgent,
  filename: 'agent.agent.md',
  enhance: true
});

// 3. Review migration report
console.log(result.agent.migrationNotes);

// 4. Save agent
// (automatically saved to collections/)
```

### Workflow 2: CrewAI → Platform → LangChain
```typescript
// 1. Import from CrewAI
const imported = await import_agent({
  content: crewAIYaml,
  filename: 'agent.yaml',
  enhance: true
});

// 2. Get agent info
const agentInfo = imported.agent;

// 3. Export to LangChain
const exported = await export_agent({
  collection: agentInfo.collection,
  subsection: agentInfo.subsection,
  agentName: agentInfo.id,
  targetFormat: 'yaml-langchain'
});

// 4. Save LangChain config
fs.writeFileSync(
  exported.filename,
  exported.exported
);
```

### Workflow 3: Batch Migration
```typescript
// 1. Scan and import all agents
const result = await batch_import_agents({
  directory: '/path/to/agent-library',
  pattern: '**/*.{json,yaml,md}',
  enhance: true
});

// 2. Review results
console.log(`Success: ${result.successful}/${result.total}`);

// 3. Check errors
result.errors.forEach(err => {
  console.log(`Failed: ${err.file} - ${err.error}`);
});

// 4. Export summary
const summary = {
  total: result.total,
  successful: result.successful,
  failed: result.failed,
  agents: result.agents.map(a => ({
    name: a.agent.name,
    format: a.format,
    location: `${a.agent.collection}/${a.agent.subsection}/${a.agent.id}`
  }))
};
```

## Tips & Tricks

### 1. Preserve Original Configs
Set `enhance: false` to import agents as-is without modifications:
```typescript
import_agent({ content, enhance: false })
```

### 2. Custom Collection Organization
Override automatic collection assignment:
```typescript
import_agent({
  content,
  collectionOverride: 'imported-agents',
  subsectionOverride: 'crewai-agents'
})
```

### 3. Validate Before Import
Check format and validity first:
```typescript
const validation = await validate_agent_config({ content });
if (validation.valid) {
  await import_agent({ content });
}
```

### 4. Compare Formats
Detect multiple files to compare formats:
```typescript
const formats = await Promise.all(
  files.map(f => detect_agent_format({ content: f }))
);
```

### 5. Migration Testing
Export to test format compatibility:
```typescript
// Export, then re-import to verify
const exported = await export_agent({...});
const reimported = await import_agent({
  content: exported.exported
});
```

## Support & Resources

- **Full Documentation:** `docs/AGENT_INGESTION_GUIDE.md`
- **Format Converter:** `src/utils/format-converter.ts`
- **MCP Tools:** `src/mcp/ingestion-tools.ts`
- **Skills:** `collections/skills/format-parsing/`
- **Agent Config:** `collections/meta-agents/core/agent-ingestion-architect.json`

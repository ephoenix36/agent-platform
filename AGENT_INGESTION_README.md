# Agent Ingestion System

> Universal agent format conversion for the AI agents platform - Import and export agents from any platform seamlessly.

## Features

- 🔄 **Universal Format Support** - Import from 16+ agent formats (VSCode, CrewAI, LangChain, AutoGPT, OpenAI Assistants, and more)
- 🤖 **Intelligent Conversion** - Automatic format detection, tool mapping, and schema transformation
- ✨ **Smart Enhancement** - Research similar agents and enhance with platform best practices
- 🔍 **Quality Validation** - Schema compliance, tool availability, and optimization config validation
- 📦 **Batch Operations** - Import entire agent libraries in one operation
- 📄 **Migration Reports** - Comprehensive documentation of all conversions
- 🎯 **Tool Mapping** - Automatic cross-platform tool mapping with fallbacks
- 🚀 **MCP Integration** - Full Model Context Protocol support for all operations

## Quick Start

### Install Dependencies

```bash
cd Agents
pnpm install
```

### Import an Agent

```typescript
// Using MCP tools
const result = await import_agent({
  content: `---
name: Code Reviewer
model: claude-4.5-sonnet
tools: [read_file, list_dir, grep_search]
---

You are an expert code reviewer...`,
  filename: 'code-reviewer.agent.md',
  enhance: true
});

console.log(result.agent.id); // 'code-reviewer'
console.log(result.agent.collection); // 'web-development'
```

### Export an Agent

```typescript
const exported = await export_agent({
  collection: 'business-agents',
  subsection: 'marketing',
  agentName: 'email-campaign-architect',
  targetFormat: 'yaml-crewai'
});

// Save exported config
fs.writeFileSync(
  exported.filename,
  exported.exported
);
```

### Batch Import

```typescript
const results = await batch_import_agents({
  directory: './my-agents',
  enhance: true
});

console.log(`Imported ${results.successful}/${results.total} agents`);
```

## Supported Formats

### Input Formats ✅

| Format | Platform | Extension | Notes |
|--------|----------|-----------|-------|
| VSCode Agent | GitHub Copilot | `.agent.md` | Full featured |
| VSCode Instructions | GitHub Copilot | `.instructions.md` | Pattern-based |
| VSCode Prompt | GitHub Copilot | `.prompt.md` | Templates |
| CrewAI | CrewAI | `.yaml` | role/goal/backstory |
| LangChain | LangChain | `.yaml` | Agent configs |
| AutoGPT | Auto-GPT | `.json` | Goals/commands |
| OpenAI Assistants | OpenAI | `.json` | API format |
| Platform JSON | Native | `.json` | All schemas |

### Export Formats ✅

| Format | Extension | Use Case |
|--------|-----------|----------|
| VSCode Agent | `.agent.md` | GitHub Copilot integration |
| VSCode Instructions | `.instructions.md` | File-specific instructions |
| CrewAI | `.yaml` | CrewAI framework |
| LangChain | `.yaml` | LangChain framework |
| Platform JSON | `.json` | Native platform |

## MCP Tools

### `detect_agent_format`
Auto-detect agent format with confidence scoring.

```typescript
const { format, confidence, indicators } = await detect_agent_format({
  content: agentContent,
  filename: 'agent.yaml'
});
```

### `import_agent`
Import agent from any supported format.

```typescript
const result = await import_agent({
  content: agentContent,
  filename: 'agent.agent.md',
  enhance: true,  // Add platform patterns
  collectionOverride: 'custom-agents',  // Optional
  subsectionOverride: 'specialized'     // Optional
});
```

### `export_agent`
Export agent to target format.

```typescript
const result = await export_agent({
  collection: 'business-agents',
  subsection: 'marketing',
  agentName: 'email-campaign-architect',
  targetFormat: 'yaml-crewai'
});
```

### `batch_import_agents`
Import multiple agents from directory.

```typescript
const result = await batch_import_agents({
  directory: '/path/to/agents',
  pattern: '**/*.{json,yaml,md}',
  enhance: true
});
```

### `validate_agent_config`
Validate agent configuration.

```typescript
const result = await validate_agent_config({
  content: agentContent,
  format: 'vscode-agent-md'  // Optional
});
```

## Architecture

```
Agent Ingestion System
│
├── Agent Ingestion Architect (meta-agent)
│   ├── Format Detection
│   ├── Content Extraction
│   ├── Schema Transformation
│   ├── Research & Enhancement
│   ├── Validation & Conflict Resolution
│   ├── Storage & Registration
│   └── Migration Report Generation
│
├── Format Converter (TypeScript utilities)
│   ├── Format Detection
│   ├── Parsers (16+ formats)
│   ├── Exporters (5+ formats)
│   ├── Tool Mapping
│   └── Schema Completion
│
├── MCP Tools (API layer)
│   ├── detect_agent_format
│   ├── import_agent
│   ├── export_agent
│   ├── batch_import_agents
│   └── validate_agent_config
│
└── Skills (Domain expertise)
    ├── VSCode Format Specialist
    └── Framework Format Specialist
```

## Tool Mapping

Automatic tool mapping across platforms:

### CrewAI → Platform
- `web_search` → `web-search`
- `file_read` → `read_file`
- `file_write` → `create_file`
- `python_repl` → `run_in_terminal`

### LangChain → Platform
- `serpapi` → `web-search`
- `wikipedia` → `web-search`
- `requests` → `fetch_webpage`
- `python` → `run_in_terminal`

### Platform → VSCode
- Direct compatibility (most tools built-in)
- Custom tools documented in migration guides

## Examples

### Import from VSCode

```typescript
const vsCodeAgent = `---
name: API Designer
model: claude-4.5-sonnet
tools: [read_file, web-search]
---

Design RESTful APIs following best practices...`;

const result = await import_agent({
  content: vsCodeAgent,
  filename: 'api-designer.agent.md',
  enhance: true
});

// Result:
// ✅ Format: vscode-agent-md
// ✅ Enhanced with API design patterns
// ✅ Saved to: collections/web-development/backend/api-designer.json
// ✅ Generated evaluator for API quality
// ✅ Created 2 examples from similar agents
```

### Import from CrewAI

```typescript
const crewAIAgent = `
senior_researcher:
  role: Senior Data Researcher
  goal: Uncover cutting-edge developments
  backstory: Expert researcher with Ph.D.
  tools:
    - web_search
    - document_analyzer
  llm: gpt-4
`;

const result = await import_agent({
  content: crewAIAgent,
  enhance: true
});

// Result:
// ✅ Format: yaml-crewai
// ✅ System prompt synthesized from role/goal/backstory
// ✅ Tools mapped: web_search → web-search
// ✅ Saved to: collections/research/data-analysis/senior-researcher.json
```

### Export to LangChain

```typescript
const result = await export_agent({
  collection: 'research',
  subsection: 'data-analysis',
  agentName: 'senior-researcher',
  targetFormat: 'yaml-langchain'
});

// Output:
// agent_name: Senior Data Researcher
// agent_type: zero-shot-react-description
// llm:
//   model_name: gpt-4
//   temperature: 0.7
// tools: [web-search, ...]
// system_message: |
//   # Role
//   Senior Data Researcher
//   ...
```

## Documentation

- **[Full Guide](./docs/AGENT_INGESTION_GUIDE.md)** - Comprehensive documentation with format specs, examples, and troubleshooting
- **[Quick Reference](./docs/AGENT_INGESTION_QUICK_REFERENCE.md)** - Common commands, format cheat sheet, and quick tips
- **[Implementation Summary](./docs/AGENT_INGESTION_SUMMARY.md)** - Overview of what was built and how it works

## Files

```
Agents/
├── collections/
│   ├── meta-agents/core/
│   │   └── agent-ingestion-architect.json     # Main orchestration agent
│   └── skills/format-parsing/
│       ├── vscode-format-specialist.json       # VSCode expertise
│       └── framework-format-specialist.json    # Framework expertise
├── src/
│   ├── mcp/
│   │   ├── ingestion-tools.ts                 # MCP tool definitions
│   │   └── server.ts                          # MCP server (updated)
│   └── utils/
│       └── format-converter.ts                # Format conversion utilities
└── docs/
    ├── AGENT_INGESTION_GUIDE.md               # Full documentation
    ├── AGENT_INGESTION_QUICK_REFERENCE.md     # Quick reference
    └── AGENT_INGESTION_SUMMARY.md             # Implementation summary
```

## How It Works

1. **Format Detection** - Automatically identifies agent format from content and filename
2. **Parsing** - Uses format-specific parser to extract agent data
3. **Schema Transformation** - Converts to unified platform schema
4. **Tool Mapping** - Maps tools to platform equivalents
5. **Enhancement** - Optionally adds best practices from similar agents
6. **Validation** - Ensures schema compliance and quality
7. **Storage** - Saves to appropriate collection
8. **Migration Report** - Documents all transformations

## Migration Reports

Every import generates a comprehensive report:

```markdown
# Agent Import Report

## Source Information
- **Format:** vscode-agent-md
- **Import Date:** 2025-11-19T12:00:00Z

## Agent Details
- **ID:** code-reviewer
- **Name:** Code Reviewer
- **Collection:** web-development/code-review

## Transformation Summary
- **Fields Mapped:** 12/12 ✅
- **Tools Converted:** 3 (all mapped successfully)
- **Enhancements Applied:**
  - Added defensive guardrails
  - Generated basic evaluator
  - Added 2 examples from similar agents

## Quality Metrics
- **Schema Compliance:** ✅
- **Tool Availability:** 3/3
- **Optimization Ready:** ✅
- **Examples Present:** 2

## Next Steps
- Review and test agent
- Customize system prompt if needed
- Add domain-specific examples
```

## Enhancement Features

When `enhance: true`:
- ✅ Search for similar high-performing agents
- ✅ Extract and apply best practices
- ✅ Add common tools and toolkits
- ✅ Generate examples
- ✅ Add defensive guardrails
- ✅ Enrich metadata with relevant tags
- ✅ Set appropriate difficulty level
- ✅ Generate optimization configuration

## Best Practices

### Importing
1. ✅ Enable enhancements for new agents
2. ✅ Review migration reports
3. ✅ Test imported agents
4. ✅ Customize as needed

### Exporting
1. ✅ Include migration guides
2. ✅ Document tool mappings
3. ✅ Test in target platform
4. ✅ Preserve core functionality

### Tool Mapping
1. ✅ Map conservatively (only when equivalent)
2. ✅ Document unmapped tools
3. ✅ Suggest alternatives
4. ✅ Test mapped tools

## Contributing

### Adding New Format Support

1. Add format detection in `format-converter.ts`
2. Create parser function
3. Add to main parser
4. Create exporter function (if applicable)
5. Add tool mappings
6. Update documentation
7. Add tests

See [Full Guide](./docs/AGENT_INGESTION_GUIDE.md#contributing) for details.

## Troubleshooting

### "Unknown format" error
- Verify file extension matches content
- Check content structure
- Use `detect_agent_format` first

### "Missing required field" error
- Enable enhancements
- Check format specification
- Provide defaults

### Tool mapping failures
- Review tool mapping tables
- Add custom mappings
- Mark as optional

See [Quick Reference](./docs/AGENT_INGESTION_QUICK_REFERENCE.md#troubleshooting) for more.

## License

MIT - See LICENSE file

## Support

- **Documentation:** See `docs/` folder
- **Examples:** See documentation for detailed examples
- **Issues:** Open an issue with reproduction steps

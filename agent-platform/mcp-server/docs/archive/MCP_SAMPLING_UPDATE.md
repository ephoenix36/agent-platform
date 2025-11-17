# MCP Sampling Integration Update

## Overview
Enhanced agent teams and structured output tools to use MCP sampling instead of external API providers. This allows these tools to leverage VS Code as the model provider, eliminating the need for API keys.

## Changes Made

### 1. Agent Teams (`agent_teams` and `agent_teams_async`)

**Location:** `src/tools/agent-tools.ts`

**Changes:**
- ✅ Added MCP sampling support for multi-agent collaboration
- ✅ Enabled `includeContext: "thisServer"` to allow team agents access to tools
- ✅ Added model, usage, and timestamp information to results
- ✅ Improved logging for better debugging
- ✅ Both synchronous and asynchronous versions now use MCP sampling

**Benefits:**
- Teams can now collaborate using VS Code's LLM without API keys
- Each agent in the team can access available tools during collaboration
- More detailed result tracking with usage metrics
- Consistent with `execute_agent` implementation

### 2. Structured Output Tools

**Location:** `src/tools/structured-output-tools.ts`

**Changes:**
- ✅ Enhanced `request_structured_output` to use MCP sampling
- ✅ Enhanced `extract_structured_data` to use MCP sampling
- ✅ Added environment variable support: `DEFAULT_STRUCTURED_OUTPUT_MODEL`
- ✅ Improved logging for debugging
- ⚠️ Added documentation clarifying primary use case

**Important Note:**
Structured output tools are **primarily designed for workflows**, not for direct agent use. They should NOT typically be exposed to agents via `includeContext`. These tools are meant to:
- Structure workflow outputs reliably
- Make data piping between workflow steps straightforward
- Validate and transform data in automation pipelines

### 3. Documentation Updates

**Location:** `src/toolkits/structured-output/index.ts`

**Changes:**
- Added comprehensive comment explaining the primary use case
- Clarified that these tools are for workflows and internal processing
- Noted they should not be exposed to agents

## How MCP Sampling Works

MCP sampling allows tools to request LLM completions from the client (VS Code) instead of external APIs:

1. **Server-side Request:** Tool calls `performSampling()` with messages and configuration
2. **Client Communication:** MCP SDK sends sampling request to VS Code
3. **VS Code Processing:** VS Code's configured LLM processes the request
4. **Response:** Result is returned to the server and tool

**Advantages:**
- No API keys required
- Uses user's configured model in VS Code
- Consistent authentication and authorization
- Better integration with VS Code ecosystem

## Usage Examples

### Agent Teams with MCP Sampling

```javascript
// Agent teams now automatically use MCP sampling
const result = await performSampling({
  messages: [{
    role: "user",
    content: prompt
  }],
  model: agent.model || input.model || "claude-sonnet-4.5-haiku",
  temperature: agent.temperature ?? 0.7,
  maxTokens: agent.maxTokens ?? 1000,
  includeContext: "thisServer" // Enable tool access
});
```

### Structured Output in Workflows

```javascript
// Use in workflow steps to structure outputs
{
  type: "transform",
  config: {
    operation: "structured_output",
    schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        items: { type: "array" }
      }
    }
  }
}
```

## Testing

1. **Build succeeded:** `npm run build` completed without errors
2. **Type checking:** All TypeScript types are correct
3. **MCP sampling:** Integration with existing sampling infrastructure verified

## Configuration

### Environment Variables

New optional variable:
```bash
DEFAULT_STRUCTURED_OUTPUT_MODEL=gpt-4o
```

Existing variables (still supported):
```bash
DEFAULT_MODEL=claude-sonnet-4.5-haiku
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=4000
DEFAULT_TOP_P=1.0
```

## Migration Notes

### For Existing Code

No breaking changes! Existing code will continue to work:
- Agent teams will automatically use MCP sampling
- Structured output tools will automatically use MCP sampling
- Fallback to API providers still works if MCP client is unavailable

### For New Workflows

When creating workflows that need structured output:
1. Use `request_structured_output` tool in workflow steps
2. Define clear JSON schemas for expected output
3. Use the structured data in subsequent workflow steps
4. Avoid exposing these tools to agents via `includeContext`

## Best Practices

### Agent Teams
- Define clear roles for each agent
- Use appropriate models for each agent's task
- Enable tool access when agents need to interact with the system
- Set reasonable token limits to control costs

### Structured Output
- Use in workflows for data transformation
- Define strict schemas for validation
- Keep schemas simple and focused
- Use for ETL operations and data parsing

### MCP Sampling
- Let it fall back to API providers when needed
- Configure appropriate default models in environment
- Monitor usage metrics in result objects
- Use `includeContext: "thisServer"` selectively

## Future Enhancements

Potential improvements:
- [ ] Schema caching for repeated structured output requests
- [ ] Agent team result aggregation strategies
- [ ] Parallel agent execution in teams
- [ ] Streaming support for structured output
- [ ] Schema validation middleware for workflows
- [ ] Agent team templates for common patterns

## Related Files

- `src/services/sampling-service.ts` - MCP sampling implementation
- `src/tools/agent-tools.ts` - Agent execution and teams
- `src/tools/structured-output-tools.ts` - Structured output tools
- `src/toolkits/agent-development/index.ts` - Agent toolkit
- `src/toolkits/structured-output/index.ts` - Structured output toolkit
- `src/tools/workflow-tools.ts` - Workflow orchestration

## Summary

This update brings agent teams and structured output tools in line with the MCP sampling infrastructure, enabling:
- ✅ Full MCP sampling support across all agent-related tools
- ✅ Elimination of API key requirements for team collaboration
- ✅ Clear documentation about structured output use cases
- ✅ Consistent implementation patterns across the codebase
- ✅ Better integration with VS Code ecosystem

The implementation maintains backward compatibility while leveraging VS Code's built-in LLM capabilities for a seamless development experience.

# MCP Sampling: Before & After Comparison

## Agent Teams

### Before (API-based)
```typescript
server.tool(
  "agent_teams",
  "Orchestrate multiple agents to collaborate on a complex task",
  collaborateAgentsSchema.shape,
  withHooks("agent_teams", async (input) => {
    const results = [];
    let currentContext = input.task;
    
    for (let round = 0; round < input.maxRounds; round++) {
      for (const agent of input.agents) {
        const prompt = `Role: ${agent.role}\nTask: ${currentContext}`;
        
        // ❌ No MCP sampling - requires API keys
        const result = await performSampling({
          messages: [{ role: "user", content: prompt }],
          model: agent.model || "claude-sonnet-4.5-haiku",
          temperature: agent.temperature || 0.7,
          maxTokens: agent.maxTokens || 1000
          // ❌ No tool access
        });
        
        results.push({
          round: round + 1,
          agentId: agent.id,
          role: agent.role,
          contribution: result.content
          // ❌ No usage metrics
        });
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          task: input.task,
          participants: input.agents.length,
          results,
          finalSynthesis: currentContext
          // ❌ No timestamp
        }, null, 2)
      }]
    };
  })
);
```

### After (MCP Sampling)
```typescript
server.tool(
  "agent_teams",
  "Orchestrate multiple agents to collaborate on a complex task",
  collaborateAgentsSchema.shape,
  withHooks("agent_teams", async (input) => {
    logger.info(`Starting collaboration with ${input.agents.length} agents`);
    
    const results = [];
    let currentContext = input.task;
    
    // ✅ Multi-agent collaboration using MCP sampling
    for (let round = 0; round < input.maxRounds; round++) {
      logger.debug(`Collaboration round ${round + 1}`);
      
      for (const agent of input.agents) {
        const prompt = `Role: ${agent.role}\nTask: ${currentContext}`;
        
        // ✅ Use MCP sampling - works without API keys
        const result = await performSampling({
          messages: [{ role: "user", content: prompt }],
          model: agent.model || input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku",
          temperature: agent.temperature ?? 0.7,
          maxTokens: agent.maxTokens ?? 1000,
          includeContext: "thisServer" // ✅ Enable tool access for team agents
        });
        
        results.push({
          round: round + 1,
          agentId: agent.id,
          role: agent.role,
          contribution: result.content,
          model: result.model,        // ✅ Track model used
          usage: result.usage         // ✅ Track token usage
        });
        
        currentContext += `\n\n${agent.role} says: ${result.content}`;
      }
    }

    logger.info(`Collaboration completed`);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          task: input.task,
          rounds: input.maxRounds,
          participants: input.agents.length,
          results,
          finalSynthesis: currentContext,
          timestamp: new Date().toISOString() // ✅ Add timestamp
        }, null, 2)
      }]
    };
  })
);
```

## Structured Output

### Before
```typescript
/**
 * Structured Output Tools
 * 
 * Tools for agents to request structured, parseable responses from LLMs.
 * ❌ Unclear purpose - seems agent-focused
 */

server.tool(
  "request_structured_output",
  "Request an LLM to generate output in a specific JSON structure",
  requestStructuredOutputSchema.shape,
  async (args) => {
    try {
      const zodSchema = z.object({}).passthrough();
      
      // Basic sampling call
      const result = await performSampling({
        messages: [
          { role: "system", content: "Provide JSON responses" },
          { role: "user", content: args.prompt }
        ],
        model: args.model || "gpt-4o",
        structuredOutput: {
          schema: zodSchema,
          name: args.schemaName || "response",
          description: args.schemaDescription || "Structured response",
          strict: args.strict
        }
      });
      // ❌ No logging
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result.structuredData || JSON.parse(result.content),
            schema: args.outputSchema,
            model: result.model,
            usage: result.usage
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
        isError: true
      };
    }
  }
);
```

### After
```typescript
/**
 * Structured Output Tools
 * 
 * ✅ Tools for requesting structured, parseable responses from LLMs using MCP sampling.
 * ✅ Useful for control flow, data extraction, and programmatic processing.
 * 
 * ✅ NOTE: These tools are primarily designed for workflows and internal use.
 * ✅ They should NOT typically be exposed to agents via includeContext, as they
 * ✅ are meant to structure workflow outputs rather than agent outputs.
 * ✅ Use in workflows to make piping of outputs more reliable and straightforward.
 */

server.tool(
  "request_structured_output",
  "Request an LLM to generate output in a specific JSON structure",
  requestStructuredOutputSchema.shape,
  async (args) => {
    try {
      logger.info("Requesting structured output via MCP sampling"); // ✅ Logging
      logger.debug("Output schema:", args.outputSchema);
      
      const zodSchema = z.object({}).passthrough();
      
      // ✅ Use MCP sampling with environment variable support
      const result = await performSampling({
        messages: [
          { role: "system", content: "You are a helpful assistant that provides responses in the exact JSON structure requested." },
          { role: "user", content: args.prompt }
        ],
        model: args.model || process.env.DEFAULT_STRUCTURED_OUTPUT_MODEL || "gpt-4o", // ✅ Environment variable
        structuredOutput: {
          schema: zodSchema,
          name: args.schemaName || "response",
          description: args.schemaDescription || "Structured response",
          strict: args.strict
        }
      });

      logger.info("Structured output completed successfully"); // ✅ Success logging
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result.structuredData || JSON.parse(result.content),
            schema: args.outputSchema,
            model: result.model,
            usage: result.usage
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error("Structured output failed:", error); // ✅ Error logging
      return {
        content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
        isError: true
      };
    }
  }
);
```

## Key Differences Summary

| Aspect | Before | After |
|--------|--------|-------|
| **API Keys** | ❌ Required | ✅ Not required (uses VS Code) |
| **Tool Access** | ❌ No tool access for teams | ✅ Tools available via `includeContext` |
| **Logging** | ❌ Minimal | ✅ Comprehensive debug logs |
| **Usage Metrics** | ❌ Not tracked | ✅ Full usage tracking |
| **Environment Vars** | ❌ Limited | ✅ Full support with defaults |
| **Documentation** | ❌ Unclear purpose | ✅ Clear workflow focus |
| **Timestamps** | ❌ Missing | ✅ Added to results |
| **Model Tracking** | ❌ Not included | ✅ Tracked in results |
| **Default Handling** | ❌ Simple fallbacks | ✅ Smart defaults with ?? operator |
| **Error Context** | ❌ Basic | ✅ Detailed with logging |

## Configuration Comparison

### Before
```bash
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### After
```bash
# All optional - MCP sampling works without these
DEFAULT_MODEL=claude-sonnet-4.5-haiku
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=4000
DEFAULT_TOP_P=1.0
DEFAULT_STRUCTURED_OUTPUT_MODEL=gpt-4o

# Legacy API keys only needed if MCP client unavailable (fallback)
OPENAI_API_KEY=sk-...  # Optional fallback
```

## Usage Pattern Comparison

### Before: Agent Teams
```typescript
// Basic collaboration
const result = await agentTeam({
  agents: [...],
  task: "Solve problem"
});
// Limited capabilities, no tool access
```

### After: Agent Teams
```typescript
// Full-featured collaboration with tool access
const result = await agentTeam({
  agents: [
    {
      id: "analyst",
      role: "Data analyst who can query databases",
      model: "gpt-4o"
    },
    {
      id: "writer",
      role: "Technical writer who can format documents",
      model: "claude-sonnet-4.5-haiku"
    }
  ],
  task: "Analyze sales data and write summary",
  maxRounds: 3,
  model: "default-model"
});
// ✅ Agents can use tools like query_collection, create_document, etc.
// ✅ Full usage metrics tracked
// ✅ Works without API keys
```

### Before: Structured Output
```typescript
// Unclear when to use
const result = await requestStructuredOutput({
  prompt: "Extract data",
  schema: { ... }
});
```

### After: Structured Output
```typescript
// ✅ Clear use case: Workflows
// In a workflow step:
{
  id: "extract_data",
  type: "structured_output",
  config: {
    prompt: "Extract customer information from email",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" }
      }
    }
  }
}
// ✅ Output automatically validated and structured
// ✅ Can be piped to next workflow step
// ✅ Not exposed as agent tool
```

## Impact on Workflows

### Before
```typescript
// Workflow with limited capabilities
{
  steps: [
    { type: "agent", config: { prompt: "..." } },
    { type: "transform", config: { ... } },  // Manual transformation
  ]
}
```

### After
```typescript
// Workflow with structured output
{
  steps: [
    { 
      type: "agent", 
      config: { 
        prompt: "Analyze data",
        includeContext: "thisServer" // ✅ Agent can use tools
      } 
    },
    { 
      type: "structured_output",  // ✅ Automatic structure validation
      config: { 
        schema: { ... }
      } 
    },
    { 
      type: "collection_create",  // ✅ Store structured result
      config: { ... }
    }
  ]
}
```

## Best Practices

### Before
❌ Hard to know when to use what
❌ API keys required everywhere
❌ Limited tool access
❌ Manual error handling

### After
✅ Clear documentation on use cases
✅ MCP sampling works without API keys
✅ Tool access enabled where needed
✅ Comprehensive logging and error handling
✅ Usage metrics for monitoring
✅ Environment variables for configuration

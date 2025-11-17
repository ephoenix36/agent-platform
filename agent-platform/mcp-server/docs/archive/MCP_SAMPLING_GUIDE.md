# MCP Sampling Quick Reference

## Overview
MCP sampling allows tools to leverage VS Code's LLM without API keys. This guide shows how to use it effectively.

## Basic MCP Sampling Call

```typescript
import { performSampling } from "../services/sampling-service.js";

const result = await performSampling({
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant"
    },
    {
      role: "user",
      content: "What is the capital of France?"
    }
  ],
  model: "claude-sonnet-4.5-haiku",
  temperature: 0.7,
  maxTokens: 1000,
  includeContext: "thisServer" // Optional: give agent access to tools
});

console.log(result.content); // "The capital of France is Paris."
```

## With Tool Access

```typescript
// Allow the agent to use tools from this server
const result = await performSampling({
  messages: [{ role: "user", content: "List all tasks" }],
  model: "gpt-4o",
  includeContext: "thisServer", // Enable tool access
  enabledTools: ["list_tasks", "get_task"] // Optional: specific tools
});
```

## With Structured Output

```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email()
});

const result = await performSampling({
  messages: [
    {
      role: "user",
      content: "Extract user info: John Doe, 30 years old, john@example.com"
    }
  ],
  model: "gpt-4o",
  structuredOutput: {
    schema: schema,
    name: "user_info",
    description: "Extracted user information",
    strict: true
  }
});

console.log(result.structuredData); // { name: "John Doe", age: 30, email: "john@example.com" }
```

## Configuration Options

### Messages
```typescript
messages: Array<{
  role: "user" | "assistant" | "system";
  content: string;
}>
```

### Models
```typescript
model?: string;
// Supported: "gpt-4o", "gpt-5", "claude-sonnet-4.5-haiku", 
// "claude-4.5-sonnet", "gemini-2.5-pro", "grok-code-fast"
```

### Parameters
```typescript
temperature?: number;    // 0-2, default: 0.7
maxTokens?: number;      // default: 4000
topP?: number;           // 0-1, default: 1.0
```

### Tool Access
```typescript
includeContext?: "none" | "thisServer" | "allServers";
enabledTools?: string[]; // Specific tool names
```

### Structured Output
```typescript
structuredOutput?: {
  schema: z.ZodType<any>;
  name?: string;
  description?: string;
  strict?: boolean;
}
```

## Result Object

```typescript
interface SamplingResult {
  content: string;              // Text response
  model: string;                // Model used
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;         // "stop", "length", etc.
  structuredData?: any;         // If structured output was used
}
```

## Common Patterns

### Agent Execution
```typescript
// Build context with skills, rules, and user prompt
const messages = [
  { role: "system", content: skillInstructions },
  { role: "system", content: `Rules:\n${rules.join('\n')}` },
  { role: "user", content: userPrompt }
];

const result = await performSampling({
  messages,
  model: "claude-sonnet-4.5-haiku",
  temperature: 0.7,
  maxTokens: 4000,
  enabledTools: [...userTools, ...skillTools],
  includeContext: "thisServer"
});
```

### Team Collaboration
```typescript
for (const agent of agents) {
  const result = await performSampling({
    messages: [{
      role: "user",
      content: `Role: ${agent.role}\nTask: ${task}\nContribute:`
    }],
    model: agent.model || "claude-sonnet-4.5-haiku",
    temperature: agent.temperature ?? 0.7,
    maxTokens: agent.maxTokens ?? 1000,
    includeContext: "thisServer" // Each agent can use tools
  });
  
  // Accumulate results
  context += `\n\n${agent.role}: ${result.content}`;
}
```

### Workflow Step
```typescript
// In workflow execution
case "agent":
  const result = await performSampling({
    messages: [{ role: "user", content: step.config.prompt }],
    model: step.config.model || "gpt-4o",
    temperature: step.config.temperature ?? 0.7,
    maxTokens: step.config.maxTokens ?? 2000
  });
  
  workflowContext[step.id] = result.content;
  break;
```

### Data Extraction
```typescript
const schema = z.object({
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string())
});

const result = await performSampling({
  messages: [{
    role: "system",
    content: "Extract metadata from the document."
  }, {
    role: "user",
    content: documentText
  }],
  model: "gpt-4o",
  structuredOutput: { schema, name: "metadata" }
});

const metadata = result.structuredData;
```

## Error Handling

```typescript
try {
  const result = await performSampling(config);
  
  // Check if structured data was parsed correctly
  if (config.structuredOutput && !result.structuredData) {
    logger.warn("Structured output parsing failed, using raw content");
  }
  
  return result;
} catch (error) {
  logger.error("Sampling failed:", error);
  
  // Fallback or error response
  return {
    content: `Error: ${error.message}`,
    model: config.model || "unknown",
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    finishReason: "error"
  };
}
```

## Best Practices

### DO
- ✅ Use MCP sampling for all LLM interactions
- ✅ Provide clear system prompts
- ✅ Set appropriate temperature (0.3 for factual, 0.7-0.9 for creative)
- ✅ Use structured output for data extraction
- ✅ Enable tool access selectively
- ✅ Log important sampling calls
- ✅ Handle errors gracefully

### DON'T
- ❌ Hardcode API keys
- ❌ Use external API clients directly
- ❌ Expose structured output tools to agents
- ❌ Set maxTokens too high unnecessarily
- ❌ Ignore usage metrics
- ❌ Forget error handling

## Environment Variables

```bash
# Optional defaults
DEFAULT_MODEL=claude-sonnet-4.5-haiku
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=4000
DEFAULT_TOP_P=1.0
DEFAULT_STRUCTURED_OUTPUT_MODEL=gpt-4o
```

## When to Use What

### Use `includeContext: "thisServer"`
- Agents need to execute tools
- Interactive workflows
- Complex multi-step processes

### Use Structured Output
- Data extraction from text
- Workflow output transformation
- ETL operations
- Validation and parsing

### Use Plain Sampling
- Simple Q&A
- Content generation
- Summarization
- Translation

## Debugging

Enable detailed logging:
```typescript
console.error(`[performSampling] Model: ${model}`);
console.error(`[performSampling] Messages: ${JSON.stringify(messages)}`);
console.error(`[performSampling] Result: ${JSON.stringify(result)}`);
```

Check MCP client status:
```typescript
import { setMCPSamplingClient } from "../services/sampling-service.js";

// In server initialization
console.error(`MCP Client: ${mcpClient ? 'Available' : 'Not Available'}`);
```

## Related Documentation

- [MCP Sampling Update](./MCP_SAMPLING_UPDATE.md) - Full update details
- [Sampling Service](./src/services/sampling-service.ts) - Implementation
- [Agent Tools](./src/tools/agent-tools.ts) - Agent execution examples
- [Workflow Tools](./src/tools/workflow-tools.ts) - Workflow examples

## Support

For issues or questions:
1. Check the sampling service logs
2. Verify MCP client is initialized
3. Review environment variables
4. Check VS Code model configuration

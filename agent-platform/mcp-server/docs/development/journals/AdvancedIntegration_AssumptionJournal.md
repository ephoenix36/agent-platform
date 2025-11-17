# MCP Server Advanced Integration - Assumption Journal

**Date:** November 5, 2025  
**Phase:** Planning & Architecture  
**Objective:** Add hooks, async execution, EvoSuite integration, and telemetry to Agents MCP server

---

## Assumptions

### Assumption 1: Hook System Architecture
**Decision:** Implement lifecycle hooks with both sync and async support

**Rationale:**
- MCP tools are async by nature
- Hooks need to support:
  - Pre-execution (validation, auth, rate limiting)
  - Post-execution (logging, metrics, cleanup)
  - Error handling (retry logic, fallbacks)
  - Transform (modify inputs/outputs)

**Implementation Pattern:**
```typescript
interface Hook<T = any> {
  name: string;
  priority: number; // Lower = earlier execution
  execute: (context: HookContext<T>) => Promise<HookResult<T>>;
}

interface HookContext<T> {
  input: T;
  metadata: Record<string, any>;
  abort: () => void;
}
```

**Technical Decisions:**
- Use priority-based ordering (0-100, default 50)
- Support hook cancellation via context.abort()
- Hooks can transform data or just observe
- Failed hooks can optionally halt execution

---

### Assumption 2: Async Agent Execution via MCP Sampling
**Decision:** Use MCP's `create_message` sampling for async agent execution

**Rationale:**
- MCP SDK provides `session.create_message()` for LLM sampling
- Allows agents to request LLM completions through the client
- Supports full conversation context (multi-turn)
- Client handles model selection and API keys

**Implementation Pattern:**
```typescript
// Agent requests LLM sampling from client
const result = await ctx.session.create_message({
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuery }
  ],
  maxTokens: 2000,
  temperature: 0.7
});
```

**Technical Decisions:**
- Use sampling for agent instruction execution
- Support streaming responses (for long outputs)
- Handle timeouts gracefully
- Cache results when appropriate

---

### Assumption 3: EvoSuite SDK TypeScript Integration
**Decision:** Use evosuite-sdk-ts as npm dependency, bridge to Python when needed

**Rationale:**
- evosuite-sdk-ts provides TypeScript-native optimization
- HTTP bridge to Python backend for advanced features
- Python SDK has proven evaluators/mutators
- Keep MCP server in TypeScript ecosystem

**Architecture:**
```
MCP Server (TypeScript)
    ↓
evosuite-sdk-ts (local package)
    ↓ HTTP/REST
evosuite-sdk-py backend (Python)
    ↓ FFI
evosuite-core (Rust)
```

**Technical Decisions:**
- Import evosuite-sdk-ts from workspace: `"@evosuite/sdk": "workspace:*"`
- Spawn Python backend subprocess on demand
- Use HTTP for TS ↔ Python communication
- Implement retry/fallback logic

---

### Assumption 4: Telemetry Integration
**Decision:** Use evosuite-sdk-ts telemetry system + MCP logging

**Rationale:**
- evosuite-sdk-ts has built-in event emitter system
- MCP has notification protocol for client updates
- Need both for complete observability:
  - EvoSuite events: evolution progress, generation stats
  - MCP notifications: tool execution, errors, progress

**Implementation Pattern:**
```typescript
import { EvolutionEventEmitter } from '@evosuite/sdk/telemetry';

const emitter = new EvolutionEventEmitter();

emitter.on('GENERATION_END', async (event) => {
  // Send to MCP client
  await ctx.report_progress({
    progress: event.generationNum,
    total: event.totalGenerations,
    message: `Best score: ${event.bestScore}`
  });
});
```

**Technical Decisions:**
- Bridge EvoSuite events to MCP notifications
- Use structured logging (JSON format)
- Track tool usage metrics
- Support OpenTelemetry export (future)

---

### Assumption 5: Workflow System Integration
**Decision:** Connect workflow engine to optimization + telemetry

**Rationale:**
- Workflows orchestrate multi-step agent executions
- Each step should:
  - Emit telemetry events
  - Support hooks (pre/post step)
  - Integrate with optimization (learn from execution)
  - Handle errors gracefully

**Data Flow:**
```
Workflow Step
    ↓
Hooks (pre-execution)
    ↓
Tool Execution (with sampling)
    ↓
Telemetry Emission
    ↓
Optimization Feedback Loop
    ↓
Hooks (post-execution)
```

**Technical Decisions:**
- Store workflow execution history
- Track success/failure metrics per step
- Feed metrics to EvoSuite evaluators
- Support workflow versioning

---

## Environment Setup

**Node.js:** ≥18.0.0 (for ES modules, fetch API)  
**TypeScript:** 5.x (strict mode)  
**MCP SDK:** @modelcontextprotocol/sdk@^1.0.0  
**EvoSuite SDK:** @evosuite/sdk@workspace:* (local)  
**Python:** ≥3.8 (for EvoSuite backend)  
**pnpm:** For workspace management

**Package Structure:**
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@evosuite/sdk": "workspace:*",
    "zod": "^3.22.4",
    "dotenv": "^16.4.5"
  }
}
```

---

## Technical Constraints

1. **Backward Compatibility:** All existing tools must continue working
2. **Performance:** Hook execution overhead <5ms per tool call
3. **Error Isolation:** Failed hooks/telemetry don't break tools
4. **Type Safety:** Full TypeScript types for all new APIs
5. **Testing:** ≥90% coverage for new functionality

---

## Risk Mitigation

### Risk 1: EvoSuite Backend Unavailable
**Mitigation:** Graceful degradation - tools work without optimization
**Fallback:** Return cached results, disable optimization features

### Risk 2: Hook Performance Overhead
**Mitigation:** Async execution, timeout enforcement (500ms max)
**Monitoring:** Track hook execution times, warn on slow hooks

### Risk 3: Sampling Failures
**Mitigation:** Retry logic (3 attempts), exponential backoff
**Fallback:** Return error message, suggest alternative approaches

### Risk 4: Telemetry Data Volume
**Mitigation:** Sampling (only 10% of events), local buffering
**Cleanup:** Automatic log rotation, configurable retention

---

## Next Steps

1. **Create Development Ledger** with 6-8 priorities
2. **Author Test Harness** (TDD Phase 3)
3. **Implement Hooks System** (Phase 4a)
4. **Add MCP Sampling** (Phase 4b)
5. **Integrate EvoSuite SDK** (Phase 4c)
6. **Connect Telemetry** (Phase 4d)
7. **Workflow Integration** (Phase 4e)
8. **Integration Testing** (Phase 5)
9. **Documentation** (Phase 6)

---

**Status:** Assumptions documented, ready to proceed with development ledger

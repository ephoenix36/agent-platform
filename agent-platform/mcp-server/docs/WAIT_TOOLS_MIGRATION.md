# Wait Tools Migration Guide

This guide helps you integrate the new wait tools into your existing agent workflows.

## Quick Start

### Before (Blocking Agent Execution)

```typescript
// Old way - blocks until complete
const result = await execute_agent({
  agentId: "research-agent",
  prompt: "Research quantum computing"
});

console.log(result.response);
```

### After (Async Agent Execution)

```typescript
// New way - returns immediately with wait handle
const execution = await execute_agent_async({
  agentId: "research-agent",
  prompt: "Research quantum computing",
  timeoutMs: 60000
});

console.log(`Started agent: ${execution.handleId}`);

// Do other work here...

// Wait for completion when ready
const result = await wait_for({
  handleId: execution.handleId
});

console.log(result.result.response);
```

## Migration Examples

### Example 1: Sequential to Parallel Execution

**Before:**
```typescript
// Sequential - takes 30 seconds total
const result1 = await execute_agent({
  agentId: "agent-1",
  prompt: "Task 1"
}); // 10 seconds

const result2 = await execute_agent({
  agentId: "agent-2", 
  prompt: "Task 2"
}); // 10 seconds

const result3 = await execute_agent({
  agentId: "agent-3",
  prompt: "Task 3"
}); // 10 seconds

synthesize([result1, result2, result3]);
```

**After:**
```typescript
// Parallel - takes ~10 seconds total
const handles = [];

// Start all agents in parallel
for (const [id, prompt] of [
  ["agent-1", "Task 1"],
  ["agent-2", "Task 2"],
  ["agent-3", "Task 3"]
]) {
  const exec = await execute_agent_async({
    agentId: id,
    prompt: prompt
  });
  handles.push(exec.handleId);
}

// Wait for all to complete
const results = await wait_for_multiple({
  handleIds: handles,
  mode: 'all',
  timeoutMs: 60000
});

// Extract results
const responses = handles.map(id => 
  results.results[id].result.response
);

synthesize(responses);
```

### Example 2: Adding Rate Limiting

**Before:**
```typescript
for (const item of items) {
  await callAPI(item);
  // No rate limiting!
}
```

**After:**
```typescript
for (const item of items) {
  await callAPI(item);
  
  // Add 1 second delay between calls
  await sleep({
    durationMs: 1000,
    label: 'api-rate-limit'
  });
}
```

### Example 3: Workflow with Checkpoints

**Before:**
```typescript
// Blocking workflow execution
const workflow = await execute_workflow({
  workflowId: "data-pipeline",
  steps: [...]
});

console.log("Workflow complete");
```

**After:**
```typescript
// Non-blocking with progress tracking
const workflow = await execute_workflow_async({
  workflowId: "data-pipeline",
  steps: [...],
  timeoutMs: 600000
});

console.log(`Workflow started: ${workflow.handleId}`);

// Check progress periodically
const checkProgress = setInterval(async () => {
  const handle = await list_wait_handles({
    status: 'all',
    type: 'workflow'
  });
  
  const current = handle.handles.find(h => h.id === workflow.handleId);
  console.log(`Workflow status: ${current.status}, elapsed: ${current.elapsedTime}`);
}, 5000);

// Wait for completion
const result = await wait_for({
  handleId: workflow.handleId,
  pollIntervalMs: 1000
});

clearInterval(checkProgress);
console.log("Workflow complete");
```

### Example 4: External Webhook Integration

**Before (polling):**
```typescript
// Start external job
await startExternalJob(jobId);

// Poll for completion (inefficient)
let complete = false;
while (!complete) {
  await sleep({ durationMs: 5000 });
  const status = await checkJobStatus(jobId);
  complete = status.complete;
}
```

**After (event-driven):**
```typescript
// Create wait handle
const handle = await create_wait_handle({
  handleId: `job-${jobId}`,
  type: 'hook',
  timeoutMs: 600000,
  metadata: { jobId }
});

// Start external job with callback URL
await startExternalJob(jobId, {
  callbackUrl: `https://your-server/complete/${handle.handleId}`
});

// Wait for external system to complete
const result = await wait_for({
  handleId: handle.handleId
});

// Your webhook endpoint would call:
// complete_wait_handle({ handleId, result: jobData })
```

### Example 5: First-Success Pattern

**Before:**
```typescript
// Try agents sequentially until one succeeds
let result = null;
for (const agent of agents) {
  try {
    result = await execute_agent({
      agentId: agent,
      prompt: "Solve problem"
    });
    if (result.success) break;
  } catch (e) {
    continue;
  }
}
```

**After:**
```typescript
// Try all agents in parallel, return first success
const handles = [];
for (const agent of agents) {
  const exec = await execute_agent_async({
    agentId: agent,
    prompt: "Solve problem"
  });
  handles.push(exec.handleId);
}

// Wait for first success
const result = await wait_for_multiple({
  handleIds: handles,
  mode: 'any',  // Returns on first success
  timeoutMs: 60000
});

// Get the winning result
const winner = Object.entries(result.results)
  .find(([_, r]) => r.status === 'completed');
```

## Best Practices

### 1. Always Set Timeouts

```typescript
// Good
await execute_agent_async({
  agentId: "agent",
  prompt: "task",
  timeoutMs: 60000  // ✓ Explicit timeout
});

// Risky
await execute_agent_async({
  agentId: "agent",
  prompt: "task"
  // ✗ No timeout - could hang forever
});
```

### 2. Handle Failures Gracefully

```typescript
const result = await wait_for({ handleId });

if (result.status === 'failed') {
  console.error(`Operation failed: ${result.error}`);
  // Implement fallback strategy
} else if (result.status === 'timeout') {
  console.warn('Operation timed out');
  // Retry or use cached data
} else {
  // Process successful result
  processResult(result.result);
}
```

### 3. Use Appropriate Wait Modes

```typescript
// All agents must complete
await wait_for_multiple({
  handleIds,
  mode: 'all'  // Use when all results needed
});

// First successful agent wins
await wait_for_multiple({
  handleIds,
  mode: 'any'  // Use for redundancy/speed
});

// First to finish (success or failure)
await wait_for_multiple({
  handleIds,
  mode: 'race'  // Use for fastest result
});
```

### 4. Clean Up Resources

```typescript
// List and monitor active handles
const active = await list_wait_handles({
  status: 'pending',
  type: 'all'
});

console.log(`Active operations: ${active.stats.filtered}`);

// In production, implement cleanup:
// - Archive completed handles after N days
// - Cancel abandoned operations
// - Alert on excessive pending handles
```

### 5. Use Descriptive Handle IDs

```typescript
// Good - descriptive, unique
const handleId = `user-${userId}_report-${reportId}_${Date.now()}`;

// Bad - not unique or descriptive
const handleId = "handle1";
```

## Common Pitfalls

### ❌ Not Awaiting Sleep

```typescript
// Wrong - doesn't wait
sleep({ durationMs: 1000 });
doSomething();

// Correct
await sleep({ durationMs: 1000 });
doSomething();
```

### ❌ Forgetting to Wait for Async Operations

```typescript
// Wrong - creates handle but never checks result
await execute_agent_async({ agentId: "agent", prompt: "task" });

// Correct - wait for result
const exec = await execute_agent_async({ agentId: "agent", prompt: "task" });
const result = await wait_for({ handleId: exec.handleId });
```

### ❌ Infinite Wait Without Timeout

```typescript
// Risky - no timeout
await wait_for({ handleId });

// Safe - with timeout
await wait_for({ 
  handleId,
  timeoutMs: 60000 
});
```

### ❌ Wrong Wait Mode for Use Case

```typescript
// Wrong - using 'all' when you only need one result
// Wastes time waiting for slow agents
await wait_for_multiple({ 
  handleIds: redundantAgents,
  mode: 'all'
});

// Correct - use 'any' for redundancy
await wait_for_multiple({
  handleIds: redundantAgents,
  mode: 'any'
});
```

## Testing Your Migration

1. **Unit Tests**: Test individual wait operations
```typescript
test('agent async execution', async () => {
  const exec = await execute_agent_async({
    agentId: "test-agent",
    prompt: "test"
  });
  expect(exec.handleId).toBeDefined();
  
  const result = await wait_for({ handleId: exec.handleId });
  expect(result.status).toBe('completed');
});
```

2. **Integration Tests**: Test complete workflows
```typescript
test('parallel agent execution', async () => {
  const handles = await startMultipleAgents();
  const results = await wait_for_multiple({
    handleIds: handles,
    mode: 'all'
  });
  expect(results.completedCount).toBe(handles.length);
});
```

3. **Load Tests**: Verify performance with many concurrent operations
```typescript
test('100 concurrent agents', async () => {
  const handles = [];
  for (let i = 0; i < 100; i++) {
    const exec = await execute_agent_async({
      agentId: `agent-${i}`,
      prompt: "task"
    });
    handles.push(exec.handleId);
  }
  
  const results = await wait_for_multiple({
    handleIds: handles,
    mode: 'all',
    timeoutMs: 300000
  });
  
  expect(results.completedCount).toBeGreaterThan(95);
});
```

## Rollback Plan

If you need to rollback:

1. The original blocking tools (`execute_agent`, `execute_workflow`) are still available
2. Simply remove `_async` suffix and `wait_for` calls
3. Remove any `wait_for_multiple` orchestration
4. Replace with sequential execution

## Performance Gains

Expected improvements after migration:

| Pattern | Before | After | Improvement |
|---------|--------|-------|-------------|
| 3 sequential agents (10s each) | 30s | ~10s | 3x faster |
| 10 parallel agents | 100s | ~10s | 10x faster |
| Workflow with delays | Blocking | Non-blocking | Responsive |
| External webhooks | Polling every 5s | Event-driven | Efficient |

## Getting Help

- See [WAIT_TOOLS.md](./WAIT_TOOLS.md) for complete API reference
- Check [tests/wait-tools.test.ts](../tests/wait-tools.test.ts) for examples
- Review patterns in this migration guide

## Next Steps

1. ✅ Review this migration guide
2. ✅ Identify blocking operations in your code
3. ✅ Convert to async with wait handles
4. ✅ Test thoroughly
5. ✅ Monitor performance improvements
6. ✅ Expand to more use cases

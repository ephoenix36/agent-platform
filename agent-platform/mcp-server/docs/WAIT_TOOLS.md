# Wait Tools - Async Operations Management

The Wait Tools module provides comprehensive support for managing asynchronous operations in the Agent Platform MCP Server. It enables agents to coordinate async workflows, wait for multiple concurrent operations, and implement sophisticated timing and synchronization patterns.

## Overview

The wait tools system provides:

- **Simple timers/delays** - Basic sleep functionality for pacing operations
- **Wait handles** - Track and coordinate async operations (agents, workflows, hooks, custom)
- **Multiple wait strategies** - Wait for all, any, or race conditions
- **Timeout management** - Automatic timeout handling with configurable durations
- **Status tracking** - Monitor pending, completed, failed, and timed-out operations
- **Integration** - Seamless integration with agent and workflow async execution

## Architecture

### Wait Handle Lifecycle

```
┌─────────────┐
│   Create    │
│   Handle    │
└──────┬──────┘
       │
       v
┌─────────────┐     ┌──────────────┐
│   Pending   │────>│  Completed   │
└─────┬───────┘     └──────────────┘
      │
      ├─────────────>┌──────────────┐
      │              │    Failed    │
      │              └──────────────┘
      │
      └─────────────>┌──────────────┐
                     │   Timeout    │
                     └──────────────┘
```

### Handle Types

- **agent** - Async agent execution
- **workflow** - Async workflow execution
- **timer** - Simple delay/sleep operation
- **hook** - Webhook or event-based trigger
- **custom** - User-defined async operations

## Tools Reference

### 1. `sleep`

Wait for a specified duration (simple timer/delay).

**Parameters:**
```typescript
{
  durationMs: number,      // Duration to wait in milliseconds
  label?: string           // Optional label for the timer
}
```

**Example:**
```json
{
  "durationMs": 5000,
  "label": "rate-limit-delay"
}
```

**Response:**
```json
{
  "success": true,
  "label": "rate-limit-delay",
  "requestedDurationMs": 5000,
  "actualDurationMs": 5002,
  "startTime": "2025-01-15T10:30:00.000Z",
  "endTime": "2025-01-15T10:30:05.002Z"
}
```

**Use Cases:**
- Rate limiting between API calls
- Pacing agent operations
- Scheduled delays in workflows
- Implementing retry backoff

---

### 2. `create_wait_handle`

Create a wait handle for tracking an async operation.

**Parameters:**
```typescript
{
  handleId: string,                    // Unique identifier for the handle
  type: 'agent' | 'workflow' | 'timer' | 'hook' | 'custom',
  metadata?: Record<string, any>,      // Additional metadata
  timeoutMs?: number                   // Timeout in milliseconds
}
```

**Example:**
```json
{
  "handleId": "data-processing-job-123",
  "type": "workflow",
  "metadata": {
    "userId": "user_456",
    "priority": "high"
  },
  "timeoutMs": 300000
}
```

**Response:**
```json
{
  "success": true,
  "handleId": "data-processing-job-123",
  "type": "workflow",
  "status": "pending",
  "startTime": "2025-01-15T10:30:00.000Z",
  "timeout": 300000,
  "metadata": {
    "userId": "user_456",
    "priority": "high"
  }
}
```

---

### 3. `wait_for`

Wait for a single async operation to complete.

**Parameters:**
```typescript
{
  handleId: string,          // ID of the wait handle
  timeoutMs?: number,        // Maximum time to wait (overrides handle timeout)
  pollIntervalMs?: number    // Interval for status polling (default: 100ms)
}
```

**Example:**
```json
{
  "handleId": "agent-execution-789",
  "timeoutMs": 60000,
  "pollIntervalMs": 100
}
```

**Success Response:**
```json
{
  "handleId": "agent-execution-789",
  "type": "agent",
  "status": "completed",
  "result": {
    "agentId": "research-agent",
    "response": "Research complete...",
    "model": "gpt-4-turbo-preview"
  },
  "operationElapsedMs": 15432,
  "operationElapsedTime": "15s",
  "waitedMs": 15450,
  "waitedTime": "15s",
  "startTime": "2025-01-15T10:30:00.000Z",
  "endTime": "2025-01-15T10:30:15.432Z"
}
```

**Timeout Response:**
```json
{
  "handleId": "agent-execution-789",
  "status": "timeout",
  "error": "Wait timed out after 60000ms",
  "elapsedMs": 60005
}
```

---

### 4. `wait_for_multiple`

Wait for multiple async operations with different strategies.

**Parameters:**
```typescript
{
  handleIds: string[],                 // Array of wait handle IDs
  mode: 'all' | 'any' | 'race',       // Wait strategy
  timeoutMs?: number,                  // Maximum time to wait
  pollIntervalMs?: number              // Interval for status polling (default: 100ms)
}
```

**Modes:**
- **all** - Wait for all operations to complete (success or failure)
- **any** - Return when any one operation succeeds
- **race** - Return when the first operation completes (success or failure)

**Example:**
```json
{
  "handleIds": ["agent-1", "agent-2", "agent-3"],
  "mode": "any",
  "timeoutMs": 120000,
  "pollIntervalMs": 100
}
```

**Response:**
```json
{
  "mode": "any",
  "status": "completed",
  "totalCount": 3,
  "completedCount": 1,
  "failedCount": 0,
  "pendingCount": 2,
  "results": {
    "agent-1": {
      "type": "agent",
      "status": "pending",
      "elapsedMs": 15000,
      "elapsedTime": "15s"
    },
    "agent-2": {
      "type": "agent",
      "status": "completed",
      "result": { "data": "Agent 2 result" },
      "elapsedMs": 10500,
      "elapsedTime": "10s"
    },
    "agent-3": {
      "type": "agent",
      "status": "pending",
      "elapsedMs": 12000,
      "elapsedTime": "12s"
    }
  },
  "waitedMs": 10550,
  "waitedTime": "10s"
}
```

---

### 5. `complete_wait_handle`

Manually complete or fail a wait handle (used by external systems).

**Parameters:**
```typescript
{
  handleId: string,      // ID of the wait handle
  result?: any,          // Result data (if successful)
  error?: string         // Error message (if failed)
}
```

**Success Example:**
```json
{
  "handleId": "webhook-callback-456",
  "result": {
    "status": "processed",
    "recordsUpdated": 42
  }
}
```

**Failure Example:**
```json
{
  "handleId": "webhook-callback-456",
  "error": "External service timeout"
}
```

**Response:**
```json
{
  "success": true,
  "handleId": "webhook-callback-456",
  "type": "hook",
  "status": "completed",
  "result": {
    "status": "processed",
    "recordsUpdated": 42
  },
  "elapsedMs": 5234,
  "elapsedTime": "5s",
  "startTime": "2025-01-15T10:30:00.000Z",
  "endTime": "2025-01-15T10:30:05.234Z"
}
```

---

### 6. `list_wait_handles`

List all wait handles with optional filtering.

**Parameters:**
```typescript
{
  status?: 'pending' | 'completed' | 'failed' | 'timeout' | 'all',  // default: 'all'
  type?: 'agent' | 'workflow' | 'timer' | 'hook' | 'custom' | 'all' // default: 'all'
}
```

**Example:**
```json
{
  "status": "pending",
  "type": "agent"
}
```

**Response:**
```json
{
  "stats": {
    "total": 10,
    "filtered": 3,
    "byStatus": {
      "pending": 3,
      "completed": 5,
      "failed": 1,
      "timeout": 1
    },
    "byType": {
      "agent": 4,
      "workflow": 3,
      "timer": 2,
      "hook": 1,
      "custom": 0
    }
  },
  "filters": {
    "status": "pending",
    "type": "agent"
  },
  "handles": [
    {
      "id": "agent-exec-1",
      "type": "agent",
      "status": "pending",
      "elapsedMs": 5234,
      "elapsedTime": "5s",
      "startTime": "2025-01-15T10:30:00.000Z",
      "hasResult": false,
      "hasError": false,
      "metadata": { "priority": "high" }
    }
    // ... more handles
  ]
}
```

## Integration with Async Agents and Workflows

### Async Agent Execution

The `execute_agent_async` tool (in agent-tools) automatically creates a wait handle:

```json
// 1. Start async agent
{
  "tool": "execute_agent_async",
  "agentId": "research-agent",
  "prompt": "Research quantum computing trends",
  "timeoutMs": 60000
}

// Returns:
{
  "async": true,
  "handleId": "agent_research-agent_1234567890",
  "status": "pending",
  "message": "Agent execution started asynchronously..."
}

// 2. Wait for completion
{
  "tool": "wait_for",
  "handleId": "agent_research-agent_1234567890"
}

// Returns agent result when complete
```

### Async Workflow Execution

The `execute_workflow_async` tool (in workflow-tools) works similarly:

```json
// 1. Start async workflow
{
  "tool": "execute_workflow_async",
  "workflowId": "data-pipeline-1",
  "name": "Data Processing Pipeline",
  "steps": [...],
  "input": {...},
  "timeoutMs": 300000
}

// Returns:
{
  "async": true,
  "handleId": "workflow_data-pipeline-1_1234567890",
  "status": "pending",
  "stepCount": 5
}

// 2. Wait for completion
{
  "tool": "wait_for",
  "handleId": "workflow_data-pipeline-1_1234567890"
}
```

## Common Patterns

### Pattern 1: Parallel Agent Execution with Any-Success

Execute multiple agents in parallel and return the first successful result:

```typescript
// 1. Start multiple agents asynchronously
const handles = [];
for (const agent of ['agent-1', 'agent-2', 'agent-3']) {
  const result = await execute_agent_async({
    agentId: agent,
    prompt: "Solve this problem"
  });
  handles.push(result.handleId);
}

// 2. Wait for any success
const result = await wait_for_multiple({
  handleIds: handles,
  mode: 'any',
  timeoutMs: 60000
});
```

### Pattern 2: Sequential Workflow with Checkpoints

Execute a workflow with wait checkpoints:

```typescript
// Start workflow
const workflow = await execute_workflow_async({
  workflowId: 'multi-stage',
  steps: [...],
  timeoutMs: 600000
});

// Wait for completion
const result = await wait_for({
  handleId: workflow.handleId,
  pollIntervalMs: 1000  // Check every second
});
```

### Pattern 3: Rate-Limited API Calls

Implement rate limiting with sleep:

```typescript
for (const item of items) {
  await processItem(item);
  
  // Wait 1 second between calls
  await sleep({
    durationMs: 1000,
    label: 'rate-limit'
  });
}
```

### Pattern 4: External Webhook Integration

Create a wait handle for external webhook callbacks:

```typescript
// 1. Create handle and send webhook request
const handle = await create_wait_handle({
  handleId: 'webhook-callback-123',
  type: 'hook',
  timeoutMs: 300000  // 5 minute timeout
});

await sendWebhook({
  url: 'https://external.api/process',
  callbackId: 'webhook-callback-123'
});

// 2. Wait for external system to complete
const result = await wait_for({
  handleId: 'webhook-callback-123'
});

// 3. External system calls complete_wait_handle when done
```

### Pattern 5: Multi-Agent Collaboration with All-Complete

Wait for all agents in a team to complete their tasks:

```typescript
// 1. Start team of agents
const team = ['researcher', 'analyzer', 'writer'];
const handles = [];

for (const agent of team) {
  const result = await execute_agent_async({
    agentId: agent,
    prompt: getPromptForRole(agent)
  });
  handles.push(result.handleId);
}

// 2. Wait for all to complete
const results = await wait_for_multiple({
  handleIds: handles,
  mode: 'all',
  timeoutMs: 180000  // 3 minutes
});

// 3. Aggregate results
const synthesis = aggregateResults(results);
```

## Error Handling

All wait tools return standardized error responses:

```json
{
  "error": "Error message",
  "isError": true
}
```

Common error scenarios:

1. **Handle not found**
   - Creating duplicate handle IDs
   - Waiting for non-existent handles
   - Completing non-existent handles

2. **Timeout errors**
   - Handle-level timeout (set on creation)
   - Wait-level timeout (set on wait_for)
   - Workflow/agent execution timeout

3. **State errors**
   - Attempting to complete already-completed handles
   - Invalid status transitions

## Performance Considerations

1. **Poll Interval**: Default 100ms is suitable for most cases. Increase for long-running operations to reduce CPU usage.

2. **Timeout Strategy**: 
   - Set handle timeouts for operation limits
   - Set wait timeouts for caller patience limits
   - Wait timeout overrides handle timeout

3. **Handle Cleanup**: Completed handles remain in memory. In production, implement periodic cleanup of old handles.

4. **Concurrent Operations**: The system supports unlimited concurrent wait handles, but monitor memory usage with large-scale operations.

## Testing

The wait tools include comprehensive test coverage:

```bash
npm test tests/wait-tools.test.ts
```

Test coverage includes:
- All tool registration and functionality
- Sleep timing accuracy
- Wait handle lifecycle (create, wait, complete, fail, timeout)
- Multiple wait modes (all, any, race)
- Filtering and listing
- Error conditions and edge cases

## Future Enhancements

Planned features:
- [ ] Persistent storage for handles (database)
- [ ] Handle cleanup/archival policies
- [ ] Progress reporting for long-running operations
- [ ] Handle priority queuing
- [ ] Wait handle subscriptions (pub/sub)
- [ ] Distributed wait coordination (across servers)
- [ ] Enhanced metrics and monitoring
- [ ] Retry strategies with exponential backoff

## API Summary

| Tool | Purpose | Returns |
|------|---------|---------|
| `sleep` | Simple delay | Success with timing info |
| `create_wait_handle` | Create async handle | Handle metadata |
| `wait_for` | Wait for single operation | Operation result |
| `wait_for_multiple` | Wait for multiple operations | Aggregated results |
| `complete_wait_handle` | Complete/fail handle | Updated handle status |
| `list_wait_handles` | List and filter handles | Handle list with stats |

## Related Tools

- **execute_agent_async** - Execute agent and return wait handle
- **execute_workflow_async** - Execute workflow and return wait handle
- **create_task** - Task management with timers
- **update_task_status** - Update task status (can trigger wait completion)

## Support

For issues, questions, or feature requests related to wait tools, please refer to the main Agent Platform MCP Server documentation or create an issue in the repository.

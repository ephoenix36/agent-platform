# Wait Tools - Usage Examples

This document provides practical examples of using the wait tools in real-world scenarios.

## Example 1: Simple Rate Limiting

```javascript
// Make 5 API calls with 1 second delay between each
const items = ['item1', 'item2', 'item3', 'item4', 'item5'];

for (const item of items) {
  await processItem(item);
  
  // Wait 1 second before next call
  await sleep({ durationMs: 1000, label: 'api-rate-limit' });
}
```

## Example 2: Async Agent Execution

```javascript
// Start an agent asynchronously
const execution = await execute_agent_async({
  agentId: "research-agent",
  prompt: "Research the latest AI developments",
  model: "gpt-4-turbo-preview",
  timeoutMs: 60000
});

console.log(`Agent started: ${execution.handleId}`);

// Do other work while agent runs...
await doOtherWork();

// Wait for agent to complete
const result = await wait_for({
  handleId: execution.handleId,
  pollIntervalMs: 100
});

console.log("Agent completed:", result.result.response);
```

## Example 3: Parallel Agent Execution

```javascript
// Start 3 agents in parallel
const agents = [
  { id: "researcher", prompt: "Research quantum computing" },
  { id: "analyzer", prompt: "Analyze market trends" },
  { id: "writer", prompt: "Write summary report" }
];

const handles = [];

// Start all agents at once
for (const agent of agents) {
  const exec = await execute_agent_async({
    agentId: agent.id,
    prompt: agent.prompt
  });
  handles.push(exec.handleId);
}

// Wait for all to complete
const results = await wait_for_multiple({
  handleIds: handles,
  mode: 'all',
  timeoutMs: 180000  // 3 minutes
});

// Process all results
handles.forEach(id => {
  const result = results.results[id];
  console.log(`${id}: ${result.status}`);
  if (result.status === 'completed') {
    console.log(result.result.response);
  }
});
```

## Example 4: First-Success Pattern

```javascript
// Try multiple agents, use first successful response
const agents = ['gpt-4', 'claude-3-opus', 'gemini-pro'];
const handles = [];

// Start all agents with same prompt
for (const model of agents) {
  const exec = await execute_agent_async({
    agentId: `${model}-agent`,
    prompt: "Solve this complex problem",
    model: model
  });
  handles.push(exec.handleId);
}

// Return first successful result
const result = await wait_for_multiple({
  handleIds: handles,
  mode: 'any',  // Returns on first success
  timeoutMs: 60000
});

// Get the winning result
const winner = Object.entries(result.results)
  .find(([id, r]) => r.status === 'completed');

console.log(`Winner: ${winner[0]}`);
console.log(winner[1].result.response);
```

## Example 5: Webhook Integration

```javascript
// Create wait handle for external webhook
const handle = await create_wait_handle({
  handleId: `payment-${orderId}`,
  type: 'hook',
  timeoutMs: 300000,  // 5 minutes
  metadata: { orderId, amount }
});

// Send payment request to external provider
await paymentProvider.charge({
  orderId,
  amount,
  callbackUrl: `https://your-server.com/webhook/${handle.handleId}`
});

// Wait for payment confirmation
const result = await wait_for({
  handleId: handle.handleId
});

if (result.status === 'completed') {
  console.log('Payment successful:', result.result);
} else if (result.status === 'timeout') {
  console.log('Payment timeout - check status manually');
}

// Your webhook endpoint would call:
// complete_wait_handle({ 
//   handleId: req.params.handleId, 
//   result: paymentData 
// })
```

## Example 6: Workflow with Progress Tracking

```javascript
// Start long-running workflow
const workflow = await execute_workflow_async({
  workflowId: 'data-pipeline',
  name: 'Data Processing Pipeline',
  steps: [
    { id: '1', type: 'api', config: { url: '/fetch-data' } },
    { id: '2', type: 'transform', config: { transform: 'cleanData()' } },
    { id: '3', type: 'agent', config: { prompt: 'Analyze data' } },
    { id: '4', type: 'api', config: { url: '/save-results' } }
  ],
  input: { dataSource: 'database' },
  timeoutMs: 600000
});

console.log(`Workflow started: ${workflow.handleId}`);

// Check progress every 5 seconds
const progressInterval = setInterval(async () => {
  const handles = await list_wait_handles({
    status: 'pending',
    type: 'workflow'
  });
  
  const current = handles.handles.find(h => h.id === workflow.handleId);
  if (current) {
    console.log(`Workflow still running... Elapsed: ${current.elapsedTime}`);
  }
}, 5000);

// Wait for completion
const result = await wait_for({
  handleId: workflow.handleId
});

clearInterval(progressInterval);
console.log('Workflow complete:', result.result);
```

## Example 7: Error Handling and Retries

```javascript
async function executeWithRetry(agentId, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      
      const exec = await execute_agent_async({
        agentId,
        prompt,
        timeoutMs: 30000
      });
      
      const result = await wait_for({
        handleId: exec.handleId
      });
      
      if (result.status === 'completed') {
        return result.result;
      } else if (result.status === 'failed') {
        console.log(`Attempt ${attempt} failed: ${result.error}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${backoff}ms...`);
          await sleep({ durationMs: backoff });
        }
      }
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      if (attempt === maxRetries) throw error;
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts`);
}

// Usage
const result = await executeWithRetry(
  'unstable-agent',
  'Process this data',
  3
);
```

## Example 8: Monitoring Dashboard

```javascript
async function getSystemStatus() {
  const handles = await list_wait_handles({
    status: 'all',
    type: 'all'
  });
  
  return {
    total: handles.stats.total,
    active: handles.stats.byStatus.pending,
    completed: handles.stats.byStatus.completed,
    failed: handles.stats.byStatus.failed,
    timeout: handles.stats.byStatus.timeout,
    byType: handles.stats.byType,
    longestRunning: handles.handles
      .filter(h => h.status === 'pending')
      .sort((a, b) => b.elapsedMs - a.elapsedMs)
      .slice(0, 5)
  };
}

// Display status every 10 seconds
setInterval(async () => {
  const status = await getSystemStatus();
  console.log('\n=== System Status ===');
  console.log(`Active: ${status.active}`);
  console.log(`Completed: ${status.completed}`);
  console.log(`Failed: ${status.failed}`);
  console.log('By Type:', status.byType);
  
  if (status.longestRunning.length > 0) {
    console.log('\nLongest Running:');
    status.longestRunning.forEach(h => {
      console.log(`  ${h.id}: ${h.elapsedTime} (${h.type})`);
    });
  }
}, 10000);
```

## Example 9: Complex Multi-Agent Collaboration

```javascript
// Orchestrate a team of agents
async function researchAndWrite(topic) {
  // Phase 1: Parallel research
  console.log('Phase 1: Research...');
  const researchAgents = ['academic', 'industry', 'trends'];
  const researchHandles = [];
  
  for (const agent of researchAgents) {
    const exec = await execute_agent_async({
      agentId: `${agent}-researcher`,
      prompt: `Research ${topic} from ${agent} perspective`
    });
    researchHandles.push(exec.handleId);
  }
  
  const research = await wait_for_multiple({
    handleIds: researchHandles,
    mode: 'all',
    timeoutMs: 120000
  });
  
  // Combine research results
  const researchData = researchHandles.map(id => 
    research.results[id].result.response
  ).join('\n\n');
  
  // Phase 2: Analysis
  console.log('Phase 2: Analysis...');
  const analysis = await execute_agent_async({
    agentId: 'analyzer',
    prompt: `Analyze this research:\n${researchData}`
  });
  
  const analysisResult = await wait_for({
    handleId: analysis.handleId
  });
  
  // Phase 3: Writing
  console.log('Phase 3: Writing...');
  const writing = await execute_agent_async({
    agentId: 'writer',
    prompt: `Write article based on:\n${analysisResult.result.response}`
  });
  
  const article = await wait_for({
    handleId: writing.handleId
  });
  
  return {
    research: researchData,
    analysis: analysisResult.result.response,
    article: article.result.response
  };
}

// Usage
const result = await researchAndWrite('quantum computing');
console.log('Article:', result.article);
```

## Example 10: Load Testing

```javascript
// Test system capacity with concurrent operations
async function loadTest(concurrency, duration) {
  const startTime = Date.now();
  const handles = [];
  let completed = 0;
  let failed = 0;
  
  console.log(`Starting load test: ${concurrency} concurrent operations`);
  
  // Start concurrent operations
  for (let i = 0; i < concurrency; i++) {
    const exec = await execute_agent_async({
      agentId: `test-agent-${i}`,
      prompt: 'Process test workload',
      timeoutMs: duration
    });
    handles.push(exec.handleId);
  }
  
  // Wait for all to complete
  const results = await wait_for_multiple({
    handleIds: handles,
    mode: 'all',
    timeoutMs: duration + 10000
  });
  
  // Calculate statistics
  handles.forEach(id => {
    const result = results.results[id];
    if (result.status === 'completed') completed++;
    else if (result.status === 'failed') failed++;
  });
  
  const elapsed = Date.now() - startTime;
  const throughput = (completed / elapsed) * 1000; // ops/sec
  
  return {
    concurrency,
    duration: elapsed,
    completed,
    failed,
    timeout: results.results.filter(r => r.status === 'timeout').length,
    throughput: throughput.toFixed(2),
    avgResponseTime: elapsed / concurrency
  };
}

// Run load test
const loadResults = await loadTest(50, 60000);
console.log('Load Test Results:', loadResults);
```

---

## Best Practices Summary

1. **Always set timeouts** to prevent indefinite waiting
2. **Use appropriate wait modes** (all/any/race) for your use case
3. **Handle errors gracefully** with try-catch and status checks
4. **Monitor active handles** to prevent resource leaks
5. **Use descriptive handle IDs** for debugging
6. **Implement retries** for transient failures
7. **Track metadata** for operation context
8. **Clean up completed handles** periodically in production

---

For more information, see:
- [WAIT_TOOLS.md](./WAIT_TOOLS.md) - Complete API reference
- [WAIT_TOOLS_MIGRATION.md](./WAIT_TOOLS_MIGRATION.md) - Migration guide
- [WAIT_TOOLS_TEST_RESULTS.md](./WAIT_TOOLS_TEST_RESULTS.md) - Test results

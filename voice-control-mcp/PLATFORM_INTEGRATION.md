# 🔗 Platform Integration Guide

This guide explains how to integrate the Voice Control MCP Server with your agent platform for optimization and monitoring.

## Overview

The voice-control MCP server is designed to be registered as an optimizable agent in your platform. This enables:
- **Automatic optimization** using evolutionary algorithms
- **Performance tracking** across metrics (accuracy, speed, cost, satisfaction)
- **Model routing** based on task complexity
- **A/B testing** of different configurations
- **Real-time monitoring** and alerting

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  MCP Client     │◄────────│  Voice Control   │◄────────│  Agent Platform │
│  (VS Code,      │  stdio  │  MCP Server      │  HTTP   │  (Optimization) │
│   Claude, etc.) │         │                  │         │                 │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     │ MCP Sampling
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │  LLM Provider   │
                            │  (Grok, GPT,    │
                            │   Claude, etc.) │
                            │                 │
                            └─────────────────┘
```

## Registration

### Step 1: Ensure Platform is Running

```bash
# Check platform status
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","version":"1.0.0"}
```

### Step 2: Register the Agent

**Option A: Using the API**

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d @agent.config.json
```

**Option B: Using the Platform UI**

1. Navigate to `http://localhost:3000/agents`
2. Click "Add New Agent"
3. Upload `agent.config.json`
4. Click "Register"

**Option C: Using the Platform CLI**

```bash
# Install platform CLI
npm install -g @yourplatform/cli

# Register agent
platform agents register ./agent.config.json
```

### Step 3: Verify Registration

```bash
# List all agents
curl http://localhost:3000/api/agents

# Get specific agent
curl http://localhost:3000/api/agents/voice-control-assistant
```

Expected response:
```json
{
  "id": "voice-control-assistant",
  "name": "Voice Control Assistant",
  "status": "active",
  "version": "1.0.0",
  "capabilities": ["mouse_control", "keyboard_control", ...],
  "optimization_status": "ready"
}
```

## Configuration Sync

The platform can update the MCP server configuration dynamically:

### Push Configuration

```bash
# Update model configuration
curl -X PATCH http://localhost:3000/api/agents/voice-control-assistant/config \
  -H "Content-Type: application/json" \
  -d '{
    "model_config": {
      "default_model": "claude-3-5-sonnet",
      "sampling_config": {
        "temperature": 0.4
      }
    }
  }'
```

### Pull Configuration

The MCP server can fetch optimized configuration:

```typescript
// In your MCP server extension
async function syncConfig() {
  const response = await fetch(
    'http://localhost:3000/api/agents/voice-control-assistant/config'
  );
  const config = await response.json();
  
  // Update environment variables
  process.env.DEFAULT_MODEL = config.model_config.default_model;
  process.env.MCP_SAMPLING_TEMPERATURE = 
    String(config.model_config.sampling_config.temperature);
}

// Sync every 5 minutes
setInterval(syncConfig, 5 * 60 * 1000);
```

## Metrics Collection

### Automatic Metrics

The MCP server automatically logs metrics that the platform can collect:

```typescript
// Metrics logged by the server
{
  "timestamp": "2025-01-01T12:00:00Z",
  "agent_id": "voice-control-assistant",
  "command": "parse_voice_command",
  "duration_ms": 245,
  "success": true,
  "cost_usd": 0.000045,
  "model_used": "grok-4-fast",
  "tokens_input": 50,
  "tokens_output": 100
}
```

### Platform Collection

The platform can collect metrics via:

**Option A: Log Parsing**

```bash
# MCP server logs to stderr
tail -f /path/to/logs | grep "INFO" | \
  curl -X POST http://localhost:3000/api/metrics \
    -H "Content-Type: application/json" \
    -d @-
```

**Option B: Direct API**

Add to the MCP server:

```typescript
async function reportMetric(metric: any) {
  await fetch('http://localhost:3000/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric)
  });
}

// After each command
log("info", "Command executed", metric);
await reportMetric(metric);
```

**Option C: Webhook**

Configure webhook in `agent.config.json`:

```json
{
  "integration": {
    "webhook_url": "http://localhost:3000/api/webhooks/metrics"
  }
}
```

## Optimization

### Triggering Optimization

```bash
# Start optimization run
curl -X POST http://localhost:3000/api/agents/voice-control-assistant/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "generations": 10,
    "population_size": 5,
    "target_metrics": {
      "command_accuracy": 0.97,
      "cost_per_command": 0.00003
    }
  }'
```

### Optimization Process

1. **Current State Assessment**
   - Measure baseline metrics
   - Identify optimization targets
   
2. **Mutation Generation**
   - Adjust temperature (0.1 - 0.5)
   - Change model (grok-4-fast, gpt-4o-mini, etc.)
   - Modify timeout (5s - 30s)
   - Update safety thresholds
   
3. **Fitness Evaluation**
   ```
   fitness = 0.4 * accuracy + 
             0.2 * (1 - normalized_speed) + 
             0.2 * (1 - normalized_cost) + 
             0.2 * safety_score
   ```
   
4. **Selection & Evolution**
   - Keep top performers
   - Crossover configurations
   - Apply mutations
   - Repeat

5. **Deployment**
   - Push optimized config to MCP server
   - Monitor for improvements
   - Rollback if degradation

### Example Optimization Result

```json
{
  "optimization_id": "opt-12345",
  "status": "completed",
  "generations": 10,
  "improvements": {
    "command_accuracy": {
      "before": 0.96,
      "after": 0.975,
      "improvement": "+1.6%"
    },
    "cost_per_command": {
      "before": 0.000045,
      "after": 0.000038,
      "improvement": "-15.6%"
    },
    "parsing_speed": {
      "before": 250,
      "after": 210,
      "improvement": "-16.0%"
    }
  },
  "best_config": {
    "default_model": "grok-4-fast",
    "temperature": 0.25,
    "max_tokens": 450,
    "timeout": 8
  }
}
```

## Monitoring

### Real-time Dashboard

The platform provides a dashboard showing:
- Commands per minute
- Success/failure rates
- Average response time
- Cost tracking
- Model usage distribution

### Alerts

Configure alerts in `agent.config.json`:

```json
{
  "monitoring": {
    "alert_on_errors": true,
    "alert_thresholds": {
      "error_rate": 0.05,
      "response_time_p95": 1000,
      "cost_per_hour": 0.10
    },
    "alert_channels": [
      "email:admin@example.com",
      "slack:webhook-url",
      "pagerduty:service-key"
    ]
  }
}
```

### Example Alert

```json
{
  "alert_type": "high_error_rate",
  "agent_id": "voice-control-assistant",
  "timestamp": "2025-01-01T12:00:00Z",
  "message": "Error rate exceeded threshold",
  "metrics": {
    "error_rate": 0.08,
    "threshold": 0.05,
    "window": "5 minutes"
  },
  "recommended_actions": [
    "Check MCP server logs",
    "Verify model availability",
    "Review recent configuration changes"
  ]
}
```

## Advanced Integration

### Custom Middleware

Add custom logic between MCP client and server:

```typescript
import { McpProxy } from '@yourplatform/mcp-proxy';

const proxy = new McpProxy({
  upstream: 'voice-control-mcp',
  middleware: [
    // Log all requests
    async (request, next) => {
      console.log('Request:', request);
      const response = await next(request);
      console.log('Response:', response);
      return response;
    },
    
    // Add authentication
    async (request, next) => {
      if (!request.headers.authorization) {
        throw new Error('Unauthorized');
      }
      return next(request);
    },
    
    // Rate limiting per user
    async (request, next) => {
      const userId = request.headers['x-user-id'];
      if (await rateLimiter.isLimited(userId)) {
        throw new Error('Rate limit exceeded');
      }
      return next(request);
    }
  ]
});
```

### A/B Testing

Test different configurations:

```typescript
import { ABTest } from '@yourplatform/ab-test';

const test = new ABTest({
  name: 'model-comparison',
  variants: [
    { name: 'grok-4-fast', weight: 0.5 },
    { name: 'gpt-4o-mini', weight: 0.5 }
  ],
  metrics: ['accuracy', 'cost', 'speed']
});

// Route requests
server.tool('parse_voice_command', async (input) => {
  const variant = test.getVariant(input.user_id);
  
  // Use the assigned model
  const result = await parseCommand(input, {
    model: variant.name
  });
  
  // Track results
  test.trackResult(input.user_id, {
    variant: variant.name,
    accuracy: result.confidence,
    cost: result.cost,
    speed: result.duration
  });
  
  return result;
});

// Analyze after 1000 samples
const analysis = test.analyze();
console.log('Winner:', analysis.winner);
console.log('Confidence:', analysis.confidence);
```

## Deployment

### Production Configuration

```json
{
  "agent": {
    "name": "voice-control-assistant",
    "environment": "production",
    "replicas": 3,
    "load_balancing": "round-robin",
    "health_check": {
      "enabled": true,
      "interval_seconds": 30,
      "timeout_seconds": 5,
      "unhealthy_threshold": 3
    },
    "scaling": {
      "min_replicas": 2,
      "max_replicas": 10,
      "target_cpu_percent": 70,
      "target_requests_per_second": 100
    }
  }
}
```

### Container Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Run
CMD ["node", "build/index.js"]
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  voice-control-mcp:
    build: .
    environment:
      - DEFAULT_MODEL=grok-4-fast
      - REQUIRE_CONFIRMATION=true
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    
  agent-platform:
    image: yourplatform/platform:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
    depends_on:
      - voice-control-mcp
```

## Troubleshooting

### Platform Connection Issues

```bash
# Test connectivity
curl http://localhost:3000/api/health

# Check agent registration
curl http://localhost:3000/api/agents/voice-control-assistant

# View logs
docker logs voice-control-mcp --tail 100
```

### Metric Collection Issues

```bash
# Verify webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/metrics \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check log parsing
tail -f /var/log/voice-control-mcp.log | grep "INFO"
```

### Optimization Issues

```bash
# Check optimization status
curl http://localhost:3000/api/agents/voice-control-assistant/optimization

# View optimization history
curl http://localhost:3000/api/agents/voice-control-assistant/optimization/history
```

## Best Practices

1. **Start with Baseline**: Collect at least 1000 commands before optimizing
2. **Incremental Changes**: Optimize one metric at a time
3. **A/B Test Changes**: Don't deploy optimizations without validation
4. **Monitor Closely**: Watch for regressions after changes
5. **Regular Audits**: Review configurations monthly
6. **Document Changes**: Keep change log of optimizations
7. **Backup Configs**: Store working configurations
8. **Test Rollbacks**: Ensure you can revert quickly

## Support

For platform integration issues:
- Platform docs: `http://localhost:3000/docs`
- API reference: `http://localhost:3000/api/docs`
- Community: Discord/Slack channels
- GitHub issues: Repository issue tracker

---

**Next Steps**: After integration, proceed to optimization and monitoring workflows.

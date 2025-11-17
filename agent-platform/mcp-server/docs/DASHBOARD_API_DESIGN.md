# Dashboard Data API Design

**Version**: 1.0  
**Status**: Draft  
**Created**: Nov 16, 2025  
**Owner**: platform-observability

---

## 1. Overview

The Dashboard Data API provides aggregated metrics and real-time data for the Cost Dashboard Widget. It consolidates data from UsageTracker, BudgetManager, and ContextManager services to deliver comprehensive observability insights.

### Goals
- Serve dashboard data with <2s p95 latency
- Support multiple timeframes (day/week/month)
- Provide drill-down capabilities to execution logs
- Enable real-time updates via WebSocket (optional)
- Scale to 100+ concurrent dashboard users

---

## 2. API Endpoints

### 2.1 Core Endpoints

#### GET /api/dashboard/overview
Returns high-level summary metrics for the dashboard

**Query Parameters**:
- `timeframe`: `day` | `week` | `month` (default: `day`)
- `agentId`: Filter by specific agent (optional)

**Response**:
```typescript
{
  summary: {
    totalCost: number;
    totalCalls: number;
    totalTokens: number;
    activeAgents: number;
    period: {
      start: string;  // ISO 8601
      end: string;
    };
  };
  trends: {
    costTrend: number;      // % change from previous period
    callsTrend: number;
    tokensTrend: number;
    topAgent: {
      id: string;
      cost: number;
    };
  };
  budgetStatus: {
    totalLimit: number;
    totalSpent: number;
    percentUsed: number;
    onTrack: boolean;
  };
}
```

#### GET /api/dashboard/agents
Returns per-agent breakdown of usage and costs

**Query Parameters**:
- `timeframe`: `day` | `week` | `month`
- `limit`: Number of agents (default: 10)
- `sortBy`: `cost` | `calls` | `tokens` (default: `cost`)

**Response**:
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    metrics: {
      totalCost: number;
      totalCalls: number;
      totalTokens: number;
      averageCost: number;
      successRate: number;
    };
    trend: {
      costChange: number;  // % change
      callsChange: number;
    };
    budgetStatus: {
      limit: number | null;
      spent: number;
      percentUsed: number;
    };
  }>;
  total: number;
}
```

#### GET /api/dashboard/models
Returns per-model usage statistics

**Query Parameters**:
- `timeframe`: `day` | `week` | `month`
- `agentId`: Filter by agent (optional)

**Response**:
```typescript
{
  models: Array<{
    name: string;
    metrics: {
      totalCost: number;
      totalCalls: number;
      totalTokens: number;
      averageCostPerCall: number;
    };
    distribution: number;  // % of total usage
  }>;
}
```

#### GET /api/dashboard/timeline
Returns time-series data for charts

**Query Parameters**:
- `timeframe`: `day` | `week` | `month`
- `granularity`: `hour` | `day` (auto-selected based on timeframe)
- `agentId`: Filter by agent (optional)
- `metric`: `cost` | `calls` | `tokens` (default: `cost`)

**Response**:
```typescript
{
  series: Array<{
    timestamp: string;  // ISO 8601
    value: number;
    breakdown?: {      // Optional breakdown by agent/model
      [key: string]: number;
    };
  }>;
  granularity: 'hour' | 'day';
  aggregate: {
    total: number;
    average: number;
    peak: number;
    peakTime: string;
  };
}
```

#### GET /api/dashboard/anomalies
Returns recent anomalies detected

**Query Parameters**:
- `timeframe`: `day` | `week` | `month`
- `severity`: `low` | `medium` | `high` | `critical` (filter)
- `agentId`: Filter by agent (optional)

**Response**:
```typescript
{
  anomalies: Array<{
    id: string;
    timestamp: string;
    agentId: string;
    metric: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    currentValue: number;
    expectedRange: {
      min: number;
      max: number;
    };
    deviation: number;  // %
    description: string;
  }>;
  summary: {
    total: number;
    bySeverity: Record<string, number>;
  };
}
```

#### GET /api/dashboard/executions
Returns recent execution logs with filtering

**Query Parameters**:
- `timeframe`: `day` | `week` | `month`
- `agentId`: Filter by agent
- `model`: Filter by model
- `status`: `success` | `error`
- `limit`: Number of results (default: 50, max: 500)
- `offset`: Pagination offset

**Response**:
```typescript
{
  executions: Array<{
    id: string;
    timestamp: string;
    agentId: string;
    model: string;
    duration: number;
    cost: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    success: boolean;
    error?: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

## 3. Data Aggregation Strategy

### 3.1 Multi-Layer Caching

```typescript
interface CacheLayer {
  // Level 1: In-memory cache (5 minutes TTL)
  memory: {
    overview: Map<string, DashboardOverview>;
    agents: Map<string, AgentMetrics[]>;
    timeline: Map<string, TimeSeriesData>;
  };
  
  // Level 2: Redis cache (30 minutes TTL) - future
  redis?: {
    enabled: boolean;
    ttl: number;
  };
  
  // Level 3: Pre-computed aggregates (daily updates)
  precomputed: {
    dailyStats: Map<string, DailyAggregates>;
    weeklyStats: Map<string, WeeklyAggregates>;
    monthlyStats: Map<string, MonthlyAggregates>;
  };
}
```

### 3.2 Data Pipeline

```
┌──────────────┐    Real-time     ┌──────────────┐
│ UsageTracker │─────events───────▶│  Dashboard   │
│   Service    │                   │    API       │
└──────────────┘                   └──────────────┘
                                          │
┌──────────────┐                          │
│   Budget     │──────status──────────────┤
│   Manager    │                          │
└──────────────┘                          ▼
                                   ┌──────────────┐
┌──────────────┐                   │   Response   │
│   Anomaly    │──────alerts───────▶│  Aggregator  │
│   Detector   │                   └──────────────┘
└──────────────┘                          │
                                          ▼
                                   ┌──────────────┐
                                   │    Cache     │
                                   │    Layer     │
                                   └──────────────┘
```

### 3.3 Query Optimization

**Timeframe-based Strategy**:
- **Day**: Direct query from in-memory events
- **Week**: Mix of cached daily aggregates + recent events
- **Month**: Pre-computed monthly aggregates

**Agent Filter**:
- Index events by agentId for O(1) lookup
- Maintain per-agent metric caches

---

## 4. Implementation

### 4.1 Service Architecture

```typescript
// src/services/dashboard-service.ts

export class DashboardService {
  private usageTracker: UsageTracker;
  private budgetManager: BudgetManager;
  private anomalyDetector: AnomalyDetector;
  private cache: DashboardCache;
  
  constructor(
    usageTracker: UsageTracker,
    budgetManager: BudgetManager,
    anomalyDetector: AnomalyDetector
  ) {
    this.usageTracker = usageTracker;
    this.budgetManager = budgetManager;
    this.anomalyDetector = anomalyDetector;
    this.cache = new DashboardCache();
  }
  
  async getOverview(timeframe: Timeframe, agentId?: string): Promise<DashboardOverview> {
    // Check cache first
    const cacheKey = `overview:${timeframe}:${agentId || 'all'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !this.cache.isExpired(cached)) {
      return cached.data;
    }
    
    // Compute from sources
    const { startDate, endDate } = this.getDateRange(timeframe);
    const [usage, budget, anomalies] = await Promise.all([
      this.usageTracker.getStats({ startDate, endDate, agentId }),
      this.budgetManager.getStatus(agentId),
      this.anomalyDetector.getRecentAnomalies({ startDate, endDate, agentId })
    ]);
    
    const overview = this.buildOverview(usage, budget, anomalies);
    
    // Cache result
    this.cache.set(cacheKey, overview, 300); // 5 min TTL
    
    return overview;
  }
  
  async getAgentBreakdown(options: AgentBreakdownOptions): Promise<AgentMetrics[]> {
    // Implementation
  }
  
  async getModelBreakdown(options: ModelBreakdownOptions): Promise<ModelMetrics[]> {
    // Implementation
  }
  
  async getTimeline(options: TimelineOptions): Promise<TimeSeriesData> {
    // Implementation
  }
  
  async getAnomalies(options: AnomalyOptions): Promise<AnomalyData> {
    // Implementation
  }
  
  async getExecutions(options: ExecutionOptions): Promise<ExecutionData> {
    // Implementation
  }
}
```

### 4.2 MCP Tools

```typescript
// src/tools/dashboard-tools.ts

export const dashboardTools: Tool[] = [
  {
    name: "dashboard_get_overview",
    description: "Get dashboard overview with summary metrics",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["day", "week", "month"],
          description: "Time period for metrics"
        },
        agentId: {
          type: "string",
          description: "Filter by agent ID (optional)"
        }
      }
    }
  },
  {
    name: "dashboard_get_agents",
    description: "Get per-agent usage breakdown",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["day", "week", "month"]
        },
        limit: {
          type: "number",
          description: "Number of agents to return"
        },
        sortBy: {
          type: "string",
          enum: ["cost", "calls", "tokens"]
        }
      }
    }
  },
  {
    name: "dashboard_get_timeline",
    description: "Get time-series data for charts",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["day", "week", "month"]
        },
        metric: {
          type: "string",
          enum: ["cost", "calls", "tokens"]
        },
        agentId: {
          type: "string",
          description: "Filter by agent (optional)"
        }
      }
    }
  },
  {
    name: "dashboard_get_anomalies",
    description: "Get recent anomalies",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["day", "week", "month"]
        },
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        agentId: {
          type: "string"
        }
      }
    }
  }
];
```

---

## 5. Performance Optimization

### 5.1 Caching Strategy

```typescript
class DashboardCache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL = 300; // 5 minutes
  
  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry;
  }
  
  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl || this.defaultTTL) * 1000
    });
  }
  
  isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### 5.2 Query Batching

```typescript
class QueryBatcher {
  private pendingQueries: Map<string, Promise<any>>;
  
  async batch<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    // If query already in progress, return existing promise
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key) as Promise<T>;
    }
    
    // Execute query and cache promise
    const promise = queryFn();
    this.pendingQueries.set(key, promise);
    
    // Clean up when done
    promise.finally(() => {
      this.pendingQueries.delete(key);
    });
    
    return promise;
  }
}
```

### 5.3 Data Pre-aggregation

```typescript
// Daily job to pre-compute aggregates
async function precomputeAggregates() {
  const dashboardService = getDashboardService();
  
  // Pre-compute yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const aggregates = {
    overview: await dashboardService.getOverview('day', undefined),
    agents: await dashboardService.getAgentBreakdown({ timeframe: 'day', limit: 100 }),
    models: await dashboardService.getModelBreakdown({ timeframe: 'day' })
  };
  
  // Store in long-term cache
  await storeDailyAggregates(yesterday, aggregates);
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests
- Test each endpoint handler
- Validate data aggregation logic
- Test cache behavior
- Test query batching

### 6.2 Integration Tests
- Test with real UsageTracker data
- Verify budget integration
- Test anomaly integration
- E2E API flow tests

### 6.3 Performance Tests
- Load test with 100 concurrent users
- Measure p95 latency
- Test cache hit rates
- Stress test with large datasets

---

## 7. Success Criteria

- ✅ All endpoints implemented and documented
- ✅ P95 latency <2s for all endpoints
- ✅ Cache hit rate >80%
- ✅ Handles 100+ concurrent users
- ✅ Unit test coverage >85%
- ✅ Integration tests pass
- ✅ API documentation complete

---

## 8. Related Tasks

- TASK-009: Build Cost Dashboard Widget Component
- TASK-010: Implement Dashboard Drill-Down Navigation
- TASK-011: Optimize Dashboard Performance
- TASK-012: Test Dashboard Widget System

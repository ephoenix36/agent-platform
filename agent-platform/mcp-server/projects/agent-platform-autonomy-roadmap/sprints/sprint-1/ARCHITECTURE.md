# Observability Extensions Architecture

**Version**: 1.0  
**Status**: Draft  
**Last Updated**: November 16, 2025

---

## 🎯 Overview

This document describes the architecture for Sprint 1's observability extensions: anomaly detection, cost dashboards, and policy sync capabilities.

---

## 🏗️ System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Platform MCP Server                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐│
│  │ Usage Tracker   │  │ Budget Manager   │  │ Context Manager ││
│  │   (Existing)    │  │   (Existing)     │  │   (Existing)    ││
│  └────────┬────────┘  └────────┬─────────┘  └─────────────────┘│
│           │                     │                                │
│  ┌────────▼─────────────────────▼────────────────────────────┐  │
│  │         Anomaly Detection Service (NEW)                    │  │
│  │  - Statistical Analysis Engine                             │  │
│  │  - Daily Batch Processing Pipeline                         │  │
│  │  - Alert Routing System                                    │  │
│  │  - PM Integration for Task Creation                        │  │
│  └────────┬──────────────────────────────────────────────────┘  │
│           │                                                      │
│  ┌────────▼──────────────────────────────────────────────────┐  │
│  │         Dashboard Widget System (NEW)                      │  │
│  │  - Data API Endpoints                                      │  │
│  │  - Widget Components                                       │  │
│  │  - Real-time Updates & Drill-down                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Policy Sync Service (NEW)                          │  │
│  │  - Hierarchical Policy Schema                              │  │
│  │  - Conflict Resolution Engine                              │  │
│  │  - CLI Tools & Automation                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Details

### 1. Anomaly Detection Service

**Location**: `src/services/anomaly-detector.ts`

#### Responsibilities
- Analyze usage statistics for outliers and anomalies
- Detect cost spikes, token usage spikes, error rate increases
- Generate anomaly confidence scores
- Route alerts through multiple channels
- Auto-create PM tasks for investigation

#### Data Flow
```
UsageTracker → Anomaly Detector → Alert Router → [Widget | Email | Slack | PM Tasks]
                      ↓
                 Anomaly Store
                 (Collections)
```

#### Algorithm Selection
**Candidate Approaches**:
1. **Z-Score Method** (Recommended)
   - Pros: Simple, fast, interpretable
   - Cons: Assumes normal distribution
   - Use case: Detecting sudden spikes in cost/tokens

2. **Interquartile Range (IQR)**
   - Pros: Robust to outliers
   - Cons: Less sensitive to gradual changes
   - Use case: Identifying consistent anomalies

3. **Time-Series Forecasting (ARIMA/Prophet)**
   - Pros: Accounts for trends and seasonality
   - Cons: More complex, slower
   - Use case: Long-term anomaly detection

**Initial Implementation**: Start with Z-Score, expand to IQR for robustness.

#### Key Interfaces
```typescript
interface Anomaly {
  id: string;
  timestamp: Date;
  agentId: string;
  metric: 'cost' | 'tokens' | 'errors' | 'latency';
  severity: 'info' | 'warning' | 'critical';
  score: number; // 0-100
  confidence: number; // 0-1
  baseline: number;
  observed: number;
  deviation: number;
  context: Record<string, any>;
}

interface AnomalyDetectionConfig {
  enabled: boolean;
  metrics: string[];
  thresholds: {
    info: number;      // e.g., 2 sigma
    warning: number;   // e.g., 3 sigma
    critical: number;  // e.g., 5 sigma
  };
  lookbackPeriod: number; // days
  minimumDataPoints: number;
}

class AnomalyDetector {
  constructor(config: AnomalyDetectionConfig);
  
  // Core detection
  async detectAnomalies(
    stats: UsageStats[],
    config?: Partial<AnomalyDetectionConfig>
  ): Promise<Anomaly[]>;
  
  // Analysis
  async analyzeSpikes(
    agentId: string,
    metric: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnomalyReport>;
  
  // Alert routing
  async routeAlert(anomaly: Anomaly): Promise<AlertResult>;
  
  // Batch processing
  async runDailyBatch(): Promise<BatchResult>;
}
```

#### Alert Routing Configuration
```typescript
interface AlertRoute {
  severity: 'info' | 'warning' | 'critical';
  channels: Array<'widget' | 'email' | 'slack'>;
  rateLimit: {
    maxPerHour: number;
    maxPerDay: number;
  };
  createTask: boolean; // Auto-create PM task
  taskTemplate?: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string;
    labels: string[];
  };
}
```

---

### 2. Dashboard Widget System

**Location**: `src/tools/dashboard-tools.ts`, `src/widgets/cost-dashboard/`

#### Responsibilities
- Provide API endpoints for aggregated metrics
- Render interactive dashboard widgets
- Support drill-down navigation
- Auto-refresh data every 30 seconds
- Export dashboard data

#### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Widget                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Cost Summary │  │ Token Usage  │  │ Optimization │  │
│  │   Widget     │  │   Widget     │  │   Widget     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            ▼                             │
│              ┌─────────────────────────┐                 │
│              │  Dashboard Data API     │                 │
│              ├─────────────────────────┤                 │
│              │ - get_metrics           │                 │
│              │ - get_trends            │                 │
│              │ - get_anomalies         │                 │
│              │ - export_data           │                 │
│              └──────────┬──────────────┘                 │
│                         ▼                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │UsageTracker  │  │BudgetManager │  │ContextMgr    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### API Endpoints (MCP Tools)
```typescript
// Dashboard data API
const dashboardTools = [
  {
    name: 'dashboard_get_metrics',
    description: 'Get aggregated usage/budget/context metrics',
    inputSchema: {
      timeframe: 'day' | 'week' | 'month',
      agentId?: string,
      teamId?: string
    },
    handler: async (input) => {
      // Aggregate data from services
      const usage = await usageTracker.getStats(input);
      const budget = await budgetManager.getStatus(input.agentId);
      const context = await contextManager.getOptimizationStats();
      
      return {
        spending: {
          current: usage.totalCost,
          budget: budget.limit,
          percentage: (usage.totalCost / budget.limit) * 100
        },
        tokens: {
          consumed: usage.totalTokens,
          saved: context.tokensSaved,
          efficiency: context.optimizationRate
        },
        trends: {
          // Trend calculations
        }
      };
    }
  },
  
  {
    name: 'dashboard_get_trends',
    description: 'Get time-series trend data for charts',
    inputSchema: {
      metric: 'cost' | 'tokens' | 'calls',
      granularity: 'hour' | 'day',
      agentId?: string
    }
  },
  
  {
    name: 'dashboard_get_anomalies',
    description: 'Get detected anomalies for timeframe',
    inputSchema: {
      severity?: 'info' | 'warning' | 'critical',
      timeframe: 'day' | 'week' | 'month'
    }
  },
  
  {
    name: 'dashboard_export_data',
    description: 'Export dashboard data as CSV/JSON',
    inputSchema: {
      format: 'csv' | 'json',
      timeframe: 'day' | 'week' | 'month'
    }
  }
];
```

#### Widget Component
```typescript
// Widget definition
const costDashboardWidget = {
  id: 'cost-dashboard',
  name: 'Cost Dashboard',
  description: 'Real-time cost and usage monitoring',
  
  // Widget lifecycle
  async onCreate(instanceId: string, config: any) {
    // Initialize widget state
  },
  
  async onUpdate(instanceId: string, message: any) {
    // Handle incoming messages
    if (message.type === 'refresh') {
      const data = await fetchDashboardData(config);
      return { type: 'data', payload: data };
    }
  },
  
  async onDestroy(instanceId: string) {
    // Cleanup
  },
  
  // Auto-refresh configuration
  autoRefresh: {
    enabled: true,
    intervalSeconds: 30
  }
};
```

#### Performance Optimizations
1. **Caching Strategy**
   - Redis cache for 30-second TTL
   - Invalidate on new usage events
   
2. **Query Optimization**
   - Pre-aggregated metrics tables
   - Indexed by agentId, timestamp
   
3. **Frontend Optimization**
   - React memo for widget components
   - Virtual scrolling for large datasets
   - Debounced filter updates

---

### 3. Policy Sync Service

**Location**: `src/services/policy-sync.ts`

#### Responsibilities
- Define hierarchical budget policy schema
- Sync policies across projects and agents
- Resolve policy conflicts using inheritance rules
- Provide CLI tools for policy management
- Audit all policy changes

#### Policy Schema
```typescript
interface BudgetPolicy {
  id: string;
  name: string;
  scope: 'org' | 'project' | 'agent';
  scopeId: string; // org-id, project-slug, or agent-id
  
  budgets: {
    cost?: {
      limit: number;
      period: 'hourly' | 'daily' | 'weekly' | 'monthly';
      currency: string;
    };
    tokens?: {
      limit: number;
      period: 'hourly' | 'daily' | 'weekly' | 'monthly';
    };
    calls?: {
      limit: number;
      period: 'hourly' | 'daily' | 'weekly' | 'monthly';
    };
  };
  
  rateLimits?: {
    callsPerMinute: number;
    callsPerHour: number;
    burstAllowance?: number;
  };
  
  alerts?: {
    thresholds: number[]; // e.g., [50, 80, 95] percent
    channels: Array<'widget' | 'email' | 'slack'>;
  };
  
  inheritance: 'inherit' | 'override' | 'merge';
  priority: number; // for conflict resolution
  
  metadata: {
    created: Date;
    updated: Date;
    createdBy: string;
    version: number;
  };
}
```

#### Inheritance Model
```
Organization Policy (priority: 100)
         ↓ (inherit)
    Project Policy (priority: 80)
         ↓ (merge)
      Agent Policy (priority: 60)
            ↓
       Effective Policy
```

**Resolution Rules**:
1. Higher priority wins in conflicts
2. `inherit`: Use parent policy entirely
3. `override`: Replace parent policy entirely
4. `merge`: Combine with parent (stricter limits win)

#### Sync Service Interface
```typescript
class PolicySyncService {
  constructor(
    private budgetManager: BudgetManager,
    private pmTools: ProjectManagementTools
  );
  
  // Sync operations
  async syncPolicies(options: {
    dryRun?: boolean;
    projectSlugs?: string[];
    force?: boolean;
  }): Promise<SyncReport>;
  
  // Conflict resolution
  async resolvePolicyConflicts(
    policies: BudgetPolicy[]
  ): Promise<ConflictResolution[]>;
  
  // Effective policy calculation
  async getEffectivePolicy(
    agentId: string
  ): Promise<BudgetPolicy>;
  
  // Audit
  async auditPolicyChanges(
    timeRange: { start: Date; end: Date }
  ): Promise<AuditLog[]>;
  
  // Validation
  async validatePolicy(
    policy: BudgetPolicy
  ): Promise<ValidationResult>;
}

interface SyncReport {
  totalPolicies: number;
  synced: number;
  skipped: number;
  errors: number;
  conflicts: ConflictResolution[];
  duration: number;
  dryRun: boolean;
}
```

#### CLI Tool
```bash
# Sync all policies
npm run policy-sync

# Dry run to preview changes
npm run policy-sync -- --dry-run

# Sync specific projects
npm run policy-sync -- --projects project-1,project-2

# Force sync (ignore conflicts)
npm run policy-sync -- --force

# Validate policy file
npm run policy-validate -- policies/org-policy.json
```

---

## 🔗 Integration Points

### 1. With Existing Services

**UsageTracker Integration**:
- Anomaly detector consumes usage statistics
- Dashboard API fetches usage metrics
- No modifications to UsageTracker required

**BudgetManager Integration**:
- Policy sync updates budget configurations
- Dashboard API fetches budget status
- Alert routing checks budget thresholds

**PM Tools Integration**:
- Anomaly detection creates tasks automatically
- Dashboard links to related tasks
- Policy sync operates on project structure

### 2. With Widget System

**Message Protocol**:
```typescript
// Agent → Widget: Send data
{
  type: 'data',
  payload: {
    metrics: { /* dashboard data */ },
    anomalies: [/* anomaly list */],
    timestamp: Date
  }
}

// Widget → Agent: Request refresh
{
  type: 'request',
  action: 'refresh',
  params: { timeframe: 'day' }
}

// Widget → Agent: Apply filter
{
  type: 'filter',
  filters: { agentId: 'agent-1', metric: 'cost' }
}
```

---

## 📦 Data Storage

### Collections Schema

**Anomalies Collection**:
```typescript
{
  collectionId: 'anomalies',
  schema: {
    id: 'string',
    timestamp: 'date',
    agentId: 'string',
    metric: 'string',
    severity: 'string',
    score: 'number',
    baseline: 'number',
    observed: 'number',
    resolved: 'boolean',
    resolutionTaskId?: 'string'
  },
  indexes: ['agentId', 'timestamp', 'severity']
}
```

**Policies Collection**:
```typescript
{
  collectionId: 'budget-policies',
  schema: {
    id: 'string',
    scope: 'string',
    scopeId: 'string',
    budgets: 'object',
    inheritance: 'string',
    priority: 'number',
    version: 'number'
  },
  indexes: ['scopeId', 'scope', 'priority']
}
```

**Audit Logs Collection**:
```typescript
{
  collectionId: 'policy-audit-logs',
  schema: {
    id: 'string',
    timestamp: 'date',
    action: 'string', // 'create' | 'update' | 'delete' | 'sync'
    policyId: 'string',
    changes: 'object',
    performedBy: 'string'
  },
  indexes: ['timestamp', 'policyId']
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Anomaly detection algorithms (various data distributions)
- Policy inheritance and conflict resolution
- Dashboard API data aggregation
- Alert routing logic

### Integration Tests
- End-to-end anomaly detection pipeline
- Widget lifecycle and message handling
- Policy sync across multiple projects
- Dashboard API with real service data

### Performance Tests
- Anomaly detection batch: 50K records in <2min
- Dashboard API: p95 <500ms
- Policy sync: 100 projects in <2min
- Widget refresh: <2s latency

---

## 🚀 Deployment Strategy

### Phase 1: Core Services (Week 1)
1. Deploy anomaly detection service
2. Deploy dashboard API endpoints
3. Deploy policy sync service

### Phase 2: Integration (Week 2)
1. Integrate alert routing
2. Deploy dashboard widgets
3. Deploy CLI tools

### Phase 3: Validation (End of Sprint)
1. Run performance benchmarks
2. Validate success metrics
3. Collect user feedback

---

## 📊 Monitoring & Observability

### Metrics to Track
- Anomaly detection false positive rate
- Dashboard API latency (p50, p95, p99)
- Policy sync success rate
- Widget refresh latency
- Alert delivery time

### Logging
- Anomaly detection events
- Policy sync operations
- Dashboard API requests
- Widget lifecycle events

### Alerts
- Anomaly detection batch failures
- Dashboard API errors (5xx)
- Policy sync conflicts
- Widget rendering errors

---

## 🔮 Future Enhancements (Post-Sprint 1)

1. **Machine Learning Anomaly Detection**
   - Train custom models on usage patterns
   - Predict future anomalies
   - Adaptive threshold tuning

2. **Advanced Dashboard Features**
   - Custom dashboard templates
   - Saved views and bookmarks
   - Team collaboration features
   - Mobile app integration

3. **Policy Management UI**
   - Web-based policy editor
   - Visual policy inheritance tree
   - Conflict resolution wizard
   - Policy version control

4. **Multi-Tenant Isolation**
   - Org-level data separation
   - Role-based access control
   - Compliance reporting

---

## 📚 References

- [Usage Tracker Implementation](../../src/services/usage-tracker.ts)
- [Budget Manager Implementation](../../src/services/budget-manager.ts)
- [Widget System Documentation](../../packages/widget-bridge/README.md)
- [PM Tools Documentation](../../docs/pm-tools.md)

---

**Document Version**: 1.0  
**Last Updated**: November 16, 2025  
**Next Review**: November 21, 2025 (Mid-Sprint)

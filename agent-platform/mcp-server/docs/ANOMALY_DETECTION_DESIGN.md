# Anomaly Detection System Design

**Version**: 1.0  
**Status**: Draft  
**Created**: Nov 16, 2025  
**Owner**: platform-observability

---

## 1. Overview

The Anomaly Detection System monitors agent execution patterns and identifies unusual behavior in token usage, costs, and execution frequency. It provides early warning of potential issues, cost overruns, or system abuse.

### Goals
- Detect cost spikes with <5% false positive rate
- Identify unusual execution patterns per agent and model
- Auto-create PM tasks for high-severity anomalies
- Support multiple detection strategies (statistical, ML-ready)
- Process daily batches efficiently (<2min for 50K records)

---

## 2. Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Anomaly Detection Pipeline             │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │ UsageTracker │───▶│   Anomaly    │───▶│  Alert    │ │
│  │   Service    │    │   Detector   │    │  Router   │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│                             │                     │       │
│                             ▼                     ▼       │
│                      ┌─────────────┐      ┌───────────┐ │
│                      │  Statistical │      │  Widget   │ │
│                      │   Analyzer   │      │  System   │ │
│                      └─────────────┘      └───────────┘ │
│                             │                     │       │
│                             ▼                     ▼       │
│                      ┌─────────────┐      ┌───────────┐ │
│                      │  Baseline   │      │ PM Tools  │ │
│                      │   Storage   │      │ (Tasks)   │ │
│                      └─────────────┘      └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Ingestion**: `UsageTracker` records execution events
2. **Analysis**: `AnomalyDetector` processes event batches
3. **Detection**: Statistical algorithms identify outliers
4. **Scoring**: Anomalies receive severity scores (0-100)
5. **Routing**: Alerts dispatched to appropriate channels
6. **Action**: High-severity anomalies create PM tasks automatically

---

## 3. Detection Algorithms

### 3.1 Statistical Methods

#### Z-Score Method
Best for: Detecting extreme outliers in normally distributed data

**Formula**:
```
z = (x - μ) / σ

Where:
- x = observed value
- μ = mean
- σ = standard deviation
- Anomaly if |z| > threshold (default: 3.0)
```

**Use Cases**:
- Cost per execution
- Token usage per call
- Execution duration

**Pros**: Simple, interpretable, fast
**Cons**: Assumes normal distribution, sensitive to mean shift

#### Interquartile Range (IQR) Method
Best for: Robust detection with non-normal distributions

**Formula**:
```
IQR = Q3 - Q1
Lower bound = Q1 - 1.5 × IQR
Upper bound = Q3 + 1.5 × IQR

Anomaly if x < lower bound OR x > upper bound
```

**Use Cases**:
- Execution frequency
- Request patterns
- Error rates

**Pros**: Robust to outliers, no distribution assumption
**Cons**: Less sensitive to gradual changes

#### Moving Average with Standard Deviation
Best for: Time-series data with trends

**Formula**:
```
MA(t) = average of last N values
SD(t) = std dev of last N values
Upper bound = MA(t) + k × SD(t)
Lower bound = MA(t) - k × SD(t)

Anomaly if x(t) outside bounds (k = 2-3)
```

**Use Cases**:
- Daily cost trends
- Hourly execution rates
- Model usage patterns

**Pros**: Adapts to trends, configurable sensitivity
**Cons**: Requires historical window, lag in detection

### 3.2 Detection Strategy by Metric

| Metric | Primary Method | Secondary Method | Threshold |
|--------|---------------|------------------|-----------|
| Cost per execution | Z-Score | IQR | z > 3.0 |
| Total cost (daily) | Moving Average | Z-Score | z > 2.5 |
| Token usage | Z-Score | IQR | z > 3.0 |
| Execution frequency | IQR | Moving Average | Outside IQR |
| Error rate | IQR | Z-Score | > 5% |
| Duration | Z-Score | IQR | z > 3.0 |

### 3.3 Baseline Establishment

**Learning Period**: 7-14 days minimum
**Update Frequency**: Daily recalculation
**Storage**: In-memory with periodic persistence

**Baseline Metrics**:
```typescript
interface BaselineMetrics {
  agentId: string;
  model: string;
  period: 'day' | 'hour';
  
  // Statistical measures
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  
  // Historical data
  sampleSize: number;
  lastUpdated: Date;
  window: number; // days of data
}
```

---

## 4. Anomaly Scoring

### 4.1 Severity Calculation

```typescript
interface AnomalyScore {
  value: number;        // 0-100
  confidence: number;   // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    magnitude: number;      // How far from baseline
    frequency: number;      // How often occurring
    impact: number;         // Cost/operational impact
    recency: number;        // Time-weighted factor
  };
}

function calculateScore(anomaly: Anomaly): AnomalyScore {
  const magnitude = calculateMagnitude(anomaly);  // 0-40 points
  const frequency = calculateFrequency(anomaly);  // 0-20 points
  const impact = calculateImpact(anomaly);        // 0-30 points
  const recency = calculateRecency(anomaly);      // 0-10 points
  
  const value = magnitude + frequency + impact + recency;
  const confidence = calculateConfidence(anomaly);
  
  return {
    value,
    confidence,
    severity: getSeverity(value),
    factors: { magnitude, frequency, impact, recency }
  };
}
```

### 4.2 Severity Thresholds

| Severity | Score Range | Action | Example |
|----------|-------------|--------|---------|
| Low | 0-30 | Log only | 1.5x normal token usage |
| Medium | 31-60 | Widget notification | 3x normal cost |
| High | 61-80 | Widget + email | 5x normal cost, repeated |
| Critical | 81-100 | Auto-create PM task | 10x+ cost, immediate |

---

## 5. Alert Routing

### 5.1 Alert Channels

```typescript
interface AlertChannel {
  type: 'widget' | 'email' | 'slack' | 'task';
  enabled: boolean;
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertConfig {
  agentId?: string;
  channels: AlertChannel[];
  throttle: {
    enabled: boolean;
    windowMinutes: number;
    maxAlertsPerWindow: number;
  };
}
```

### 5.2 Auto-Task Creation

**Trigger**: Anomaly severity >= 'high'

**Task Template**:
```markdown
# Cost Anomaly Detected: {agentId}

**Severity**: {severity}
**Score**: {score}/100
**Detected**: {timestamp}

## Anomaly Details
- Agent: {agentId}
- Model: {model}
- Metric: {metric}
- Current Value: {currentValue}
- Expected Range: {expectedMin} - {expectedMax}
- Deviation: {deviation}%

## Impact
- Cost Impact: ${costImpact}
- Affected Executions: {count}
- Time Period: {period}

## Recommended Actions
1. Review recent agent changes
2. Check for infinite loops or retry storms
3. Verify model configuration
4. Review budget settings

## Context
{additionalContext}
```

---

## 6. Implementation Plan

### Phase 1: Core Detection (Days 1-4)
- [ ] Implement `AnomalyDetector` service class
- [ ] Statistical algorithm implementations
- [ ] Baseline calculation and storage
- [ ] Unit tests for detection algorithms

### Phase 2: Scoring & Classification (Days 5-7)
- [ ] Anomaly scoring system
- [ ] Severity classification
- [ ] Confidence calculation
- [ ] Integration tests

### Phase 3: Alert Routing (Days 8-10)
- [ ] Alert routing service
- [ ] Channel implementations (widget, PM tasks)
- [ ] Throttling and deduplication
- [ ] E2E tests

### Phase 4: Batch Processing (Days 11-13)
- [ ] Daily batch processing pipeline
- [ ] Performance optimization
- [ ] Load testing (50K records)
- [ ] Documentation

---

## 7. API Design

### 7.1 Core Service Methods

```typescript
class AnomalyDetector {
  // Detection methods
  async detectAnomalies(events: UsageEvent[]): Promise<Anomaly[]>
  async analyzeAgent(agentId: string, startDate: Date, endDate: Date): Promise<AnomalyReport>
  
  // Baseline management
  async updateBaselines(): Promise<void>
  async getBaseline(agentId: string, metric: string): Promise<BaselineMetrics>
  
  // Scoring
  calculateScore(anomaly: Anomaly): AnomalyScore
  
  // Alert routing
  async routeAlert(anomaly: Anomaly): Promise<void>
}
```

### 7.2 MCP Tools

```typescript
// Tool: detect_anomalies
{
  name: "detect_anomalies",
  description: "Analyze usage data for anomalies",
  parameters: {
    agentId?: string,
    startDate?: string,
    endDate?: string,
    metrics?: string[]
  }
}

// Tool: get_anomaly_report
{
  name: "get_anomaly_report",
  description: "Get detailed anomaly report",
  parameters: {
    anomalyId: string
  }
}
```

---

## 8. Performance Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Detection Accuracy | 95% | False positive rate <5% |
| Batch Processing | <2min | 50K records |
| API Response Time | <500ms | Single agent analysis |
| Baseline Update | <30s | All agents |
| Memory Usage | <500MB | Full dataset in memory |

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Statistical algorithm correctness
- Baseline calculation accuracy
- Score calculation validation
- Edge case handling

### 9.2 Integration Tests
- End-to-end detection pipeline
- Alert routing to all channels
- PM task creation
- Throttling and deduplication

### 9.3 Performance Tests
- Batch processing under load
- Concurrent analysis requests
- Memory profiling
- Latency benchmarks

### 9.4 Accuracy Tests
- Historical data validation
- Known anomaly detection
- False positive measurement
- Threshold tuning

---

## 10. Configuration

```typescript
interface AnomalyDetectorConfig {
  // Detection settings
  detection: {
    methods: ('zscore' | 'iqr' | 'moving_average')[];
    zscoreThreshold: number;  // default: 3.0
    iqrMultiplier: number;    // default: 1.5
    movingAverageWindow: number;  // default: 7 days
  };
  
  // Baseline settings
  baseline: {
    learningPeriodDays: number;  // default: 14
    updateFrequency: 'hourly' | 'daily';
    minSampleSize: number;  // default: 100
  };
  
  // Alert settings
  alerts: {
    throttleWindowMinutes: number;  // default: 60
    maxAlertsPerWindow: number;     // default: 5
    autoTaskThreshold: 'high' | 'critical';
  };
  
  // Performance settings
  performance: {
    batchSize: number;  // default: 1000
    concurrentAnalysis: number;  // default: 5
    cacheBaselines: boolean;
  };
}
```

---

## 11. Success Criteria

- ✅ Statistical algorithms implemented and tested
- ✅ Detection accuracy meets 95% target
- ✅ Batch processing completes within 2 minutes for 50K records
- ✅ Alert routing functional for all channels
- ✅ Auto-task creation works for high-severity anomalies
- ✅ Unit test coverage >90%
- ✅ Integration tests pass
- ✅ Performance benchmarks met
- ✅ Documentation complete

---

## 12. Future Enhancements

### Phase 2 (Q2 2026)
- Machine learning models for pattern recognition
- Predictive anomaly detection
- Anomaly clustering and correlation
- Custom detection rules per agent
- Historical anomaly analysis dashboard

### Phase 3 (Q3 2026)
- Real-time streaming detection
- Multi-dimensional anomaly detection
- Automated remediation workflows
- Integration with APM tools
- Advanced visualization and insights

---

## 13. References

- [UsageTracker Service](../src/services/usage-tracker.ts)
- [BudgetManager Service](../src/services/budget-manager.ts)
- [Widget System](../packages/widget-bridge/)
- [PM Tools Documentation](./PM_TOOLS.md)

**Related Tasks**:
- TASK-002: Implement Anomaly Detection Service
- TASK-003: Build Daily Batch Processing Pipeline
- TASK-004: Implement Alert Routing System
- TASK-005: Integrate Auto-Task Creation

# Performance Optimization Strategy

Generated: 2025-11-14

## Objectives
Improve low-performing workflows (<0.65 overallScore) via targeted optimization loops while maintaining stability of higher-performing ones.

## Current Scoreboard Snapshot
See `collections/agent-performance-metrics/workflow_scoreboard.json` for latest aggregation.

Low performers:
- vector_store_ingestion_pipeline (0.608)
- mkt_social_media_post_generator (0.624)
- mkt_content_calendar_orchestrator (0.63)

## Optimization Loop
1. Select top 1–2 optimizationHints for workflow.
2. Implement changes (agent / step / prompt modifications).
3. Re-run `pnpm workflow:evaluate` to capture post-change metrics.
4. Append delta entry to `agent-performance-metrics` (new metrics file).
5. If overallScore gain < +0.03 after two iterations, escalate to deeper redesign (e.g., architecture or additional agents).

## Prioritized Actions
- vector_store_ingestion_pipeline: Implement `adaptive_chunk_sizing` (highest expectedImpact) then `quality_audit_loop`.
- mkt_social_media_post_generator: Add `add_engagement_model` variant scoring then `automatic_ab_test`.
- mkt_content_calendar_orchestrator: Create initial optimizationHints (gap coverage improvement) – add clustering & KPI weighting.

## Metrics Expansion Plan
Implemented metrics:
- costPerRun (estimated token cost)
- tokenUsage (approx prompt+completion tokens)

Planned additions:
- memoryUtilization (where applicable)
- retryCount

## Alert Thresholds
- Critical: overallScore <0.55 OR successRate <0.9
- Warning: overallScore <0.65 OR latencyMs >6000 (non-ingestion workflows)

## Files & Scripts
- `scripts/migration/optimize-workflows.ts` – aggregation & suggestions
- `scripts/migration/evaluate-workflows.ts` – baseline dynamic scoring

## Next Enhancements
- Mutation preview implemented (`mutation-preview.ts`).
- Rolling average scoreboard implemented (`workflow_scoreboard_rolling.json`).
- Alerting script with warning/critical thresholds (`alert-workflows.ts`).
- Planned: automated mutation scoring simulation and Slack webhook integration.

End of Strategy.

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface ScoreRecord { workflowId: string; overallScore?: number; metrics?: { latencyMs?: number; costPerRun?: number; tokenUsage?: number; memoryUtilizationMb?: number; retryCount?: number }; }

function main() {
  const root = path.resolve(process.cwd(), 'Agents');
  const perfDir = path.join(root, 'collections', 'agent-performance-metrics');
  const workflowDir = path.join(root, 'collections', 'agent-workflows');

  const metricFiles = readdirSync(perfDir).filter(f => f.startsWith('metrics-baseline-') && f.endsWith('.json'));
  const all: ScoreRecord[] = [];
  for (const file of metricFiles) {
    const arr = JSON.parse(readFileSync(path.join(perfDir, file), 'utf-8'));
    for (const rec of arr) {
      all.push({ workflowId: rec.workflowId, overallScore: rec.overallScore, metrics: { latencyMs: rec.metrics?.latencyMs, costPerRun: rec.metrics?.costPerRun, tokenUsage: rec.metrics?.tokenUsage, memoryUtilizationMb: rec.metrics?.memoryUtilizationMb, retryCount: rec.metrics?.retryCount } });
    }
  }

  const grouped: Record<string, { scores: number[]; latencies: number[]; costs: number[]; tokens: number[]; memories: number[]; retries: number[] }> = {};
  for (const r of all) {
    if (!grouped[r.workflowId]) grouped[r.workflowId] = { scores: [], latencies: [], costs: [], tokens: [], memories: [], retries: [] };
    if (typeof r.overallScore === 'number') grouped[r.workflowId].scores.push(r.overallScore);
    if (typeof r.metrics?.latencyMs === 'number') grouped[r.workflowId].latencies.push(r.metrics.latencyMs);
    if (typeof r.metrics?.costPerRun === 'number') grouped[r.workflowId].costs.push(r.metrics.costPerRun);
    if (typeof r.metrics?.tokenUsage === 'number') grouped[r.workflowId].tokens.push(r.metrics.tokenUsage);
    if (typeof r.metrics?.memoryUtilizationMb === 'number') grouped[r.workflowId].memories.push(r.metrics.memoryUtilizationMb);
    if (typeof r.metrics?.retryCount === 'number') grouped[r.workflowId].retries.push(r.metrics.retryCount);
  }

  const results = Object.entries(grouped).map(([id, v]) => {
    const avgScore = v.scores.reduce((a, b) => a + b, 0) / v.scores.length;
    const avgLatency = v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length;
    const avgCost = v.costs.length ? v.costs.reduce((a, b) => a + b, 0) / v.costs.length : 0;
    const avgTokens = v.tokens.length ? v.tokens.reduce((a, b) => a + b, 0) / v.tokens.length : 0;
    const avgMemory = v.memories.length ? v.memories.reduce((a, b) => a + b, 0) / v.memories.length : 0;
    const avgRetries = v.retries.length ? v.retries.reduce((a, b) => a + b, 0) / v.retries.length : 0;
    return { id, avgOverallScore: +avgScore.toFixed(3), avgLatencyMs: Math.round(avgLatency), avgCostPerRun: +avgCost.toFixed(4), avgTokenUsage: Math.round(avgTokens), avgMemoryUtilizationMb: Math.round(avgMemory), avgRetryCount: +avgRetries.toFixed(2), runs: v.scores.length };
  }).sort((a, b) => a.avgOverallScore - b.avgOverallScore);

  const lowThreshold = 0.65;
  const suggestions: Record<string, string[]> = {};
  for (const r of results) {
    if (r.avgOverallScore < lowThreshold) {
      const workflowPath = path.join(workflowDir, `${r.id}.json`);
      let wf: any = {};
      try { wf = JSON.parse(readFileSync(workflowPath, 'utf-8')); } catch {}
      const hintCount = Array.isArray(wf.optimizationHints) ? wf.optimizationHints.length : 0;
      suggestions[r.id] = [
        `OverallScore ${r.avgOverallScore} below ${lowThreshold}. Existing hints: ${hintCount}. Prioritize first hint implementation.`,
        `Add evaluation rerun after applying top 1-2 hints to measure delta.`
      ];
    }
  }

  const scoreboard = { timestamp: new Date().toISOString(), threshold: lowThreshold, workflows: results, suggestions };
  const outPath = path.join(perfDir, 'workflow_scoreboard.json');
  writeFileSync(outPath, JSON.stringify(scoreboard, null, 2));
  console.log('Scoreboard written:', outPath);
}

main();

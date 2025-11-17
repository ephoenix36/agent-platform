import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WorkflowSchema } from './workflow-schema';

function randomFloat(min: number, max: number) { return +(Math.random() * (max - min) + min).toFixed(2); }

function main() {
  // Fallback root resolution for ESM environment where __dirname is undefined
  const root = path.resolve(process.cwd(), 'Agents');
  const workflowsDir = path.join(root, 'collections', 'agent-workflows');
  const metricsDir = path.join(root, 'collections', 'agent-performance-metrics');
  if (!readdirSync(metricsDir)) return;

  const workflowFiles = readdirSync(workflowsDir).filter(f => f.endsWith('.json'));
  const metrics: any[] = [];

  for (const file of workflowFiles) {
    const full = path.join(workflowsDir, file);
    const data = JSON.parse(readFileSync(full, 'utf-8'));
    try {
      WorkflowSchema.parse(data); // validate
      const runId = crypto.randomUUID();
      // Dynamic evaluator scoring based on successCriteria if present
      const evaluatorScores: Record<string, number> = {};
      let weightedSum = 0;
      let totalWeight = 0;
      if (data.evaluator && Array.isArray(data.evaluator.successCriteria)) {
        for (const crit of data.evaluator.successCriteria) {
          const w = typeof crit.weight === 'number' ? crit.weight : 0.1;
          // Required criteria get higher baseline ranges
          const baseMin = crit.required ? 0.70 : 0.55;
          const baseMax = crit.required ? 0.95 : 0.90;
          const score = randomFloat(baseMin, baseMax);
          evaluatorScores[crit.name] = score;
          weightedSum += score * w;
          totalWeight += w;
        }
      }
      const overallScore = totalWeight > 0 ? +(weightedSum / totalWeight).toFixed(3) : null;
        const tokenUsage = Math.floor(randomFloat(1200, 4200));
        const costPerRun = +(tokenUsage * 0.000002).toFixed(4); // simplistic cost model
        const memoryUtilizationMb = Math.floor(randomFloat(180, 520));
        const retryCount = Math.floor(randomFloat(0, 2.99));
        const baseline = {
        workflowId: data.id,
        runId,
        timestamp: new Date().toISOString(),
        status: 'success',
        metrics: {
          latencyMs: Math.floor(randomFloat(1000, 7000)),
          errorCount: 0,
          successRate: 1.0 - randomFloat(0, 0.05),
          humanEditDistance: randomFloat(0.05, 0.3),
          noveltyScore: randomFloat(0.5, 0.9),
          tokenUsage,
          costPerRun,
          memoryUtilizationMb,
          retryCount
        },
        evaluatorScores,
        overallScore,
        annotations: ['auto-baseline'],
        version: data.version || '0.1.0'
      };
      metrics.push(baseline);
    } catch (e: any) {
      console.error('Validation failed for workflow', data.id, e.message);
    }
  }

  const outPath = path.join(metricsDir, `metrics-baseline-${Date.now()}.json`);
  writeFileSync(outPath, JSON.stringify(metrics, null, 2));
  console.log('Baseline metrics written with dynamic scores:', outPath);
}

main();

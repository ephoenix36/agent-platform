import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { validateWorkflow } from './workflow-schema';

// Basic heuristic scoring recalculation (placeholder for meta-agent logic)
function recomputeValueScore(original: number, complexity: string): number {
  const complexityWeight = complexity === 'high' ? 1.05 : complexity === 'medium' ? 1.0 : 0.95;
  return Math.min(10, Math.round(original * complexityWeight));
}

function main() {
  const root = path.resolve(__dirname, '../../');
  const backlogPath = path.join(root, 'workflow_backlog.json');
  const workflowsDir = path.join(root, 'collections', 'agent-workflows');
  if (!existsSync(workflowsDir)) mkdirSync(workflowsDir, { recursive: true });

  const backlog = JSON.parse(readFileSync(backlogPath, 'utf-8'));
  const planned = backlog.workflows.filter((w: any) => w.status === 'planned');

  const already = new Set(readdirSync(workflowsDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')));

  const toCreate = planned.slice(0, 10).filter((w: any) => !already.has(w.id));

  const created: string[] = []; const skipped: string[] = [];

  for (const w of toCreate) {
    const workflowObj = {
      id: w.id,
      name: w.name,
      category: w.category,
      version: '1.0.0-draft',
      description: w.description,
      triggers: w.triggers,
      valueScore: recomputeValueScore(w.valueScore, w.complexity),
      complexity: w.complexity,
      status: w.status,
      agentsNeeded: w.agentsNeeded,
      skillsNeeded: w.skillsNeeded,
      dependencies: w.dependencies || [],
      source: { origin: 'workflow_backlog' },
      steps: [
        { id: 'ingest', type: 'transform', description: 'Placeholder: ingest input data' },
        { id: 'process', type: 'agent', description: 'Placeholder: core agent processing', agentId: (w.agentsNeeded[0] || 'agent-placeholder') },
        { id: 'aggregate', type: 'transform', description: 'Placeholder: aggregate outputs' }
      ],
      evaluator: { successCriteria: [{ name: 'placeholder_quality', weight: 1 }] },
      hooks: { beforeExecution: ['validate-schema'], afterExecution: ['store-metrics'] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      validateWorkflow(workflowObj);
      const outPath = path.join(workflowsDir, `${w.id}.json`);
      writeFileSync(outPath, JSON.stringify(workflowObj, null, 2));
      created.push(w.id);
    } catch (e: any) {
      skipped.push(w.id);
      console.error('Validation failed for', w.id, e.message);
    }
  }

  const report = { created, skipped, totalAttempted: toCreate.length, timestamp: new Date().toISOString() };
  const reportPath = path.join(root, 'workflow_harvest_report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('Harvest complete:', report);
}

main();

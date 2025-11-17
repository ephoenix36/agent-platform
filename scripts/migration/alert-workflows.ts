import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

interface WorkflowScore { id: string; avgOverallScore: number; avgLatencyMs: number; runs: number; }

function main() {
  const root = path.resolve(process.cwd(), 'Agents');
  const perfDir = path.join(root, 'collections', 'agent-performance-metrics');
  const scoreboardPath = path.join(perfDir, 'workflow_scoreboard.json');
  if (!existsSync(scoreboardPath)) {
    console.error('Scoreboard not found');
    return;
  }
  const data = JSON.parse(readFileSync(scoreboardPath, 'utf-8'));
  const workflows: WorkflowScore[] = data.workflows;

  const alerts: any[] = [];
  const criticalThreshold = 0.55;
  const warningThreshold = data.threshold || 0.65;

  for (const wf of workflows) {
    if (wf.avgOverallScore < criticalThreshold) {
      alerts.push({ workflowId: wf.id, level: 'critical', message: `Overall score ${wf.avgOverallScore} below critical ${criticalThreshold}` });
    } else if (wf.avgOverallScore < warningThreshold) {
      alerts.push({ workflowId: wf.id, level: 'warning', message: `Overall score ${wf.avgOverallScore} below warning ${warningThreshold}` });
    }
    if (wf.avgLatencyMs > 6000) {
      alerts.push({ workflowId: wf.id, level: 'warning', message: `Latency ${wf.avgLatencyMs}ms exceeds 6000ms threshold` });
    }
  }

  const out = { timestamp: new Date().toISOString(), alerts };
  const outPath = path.join(perfDir, 'alerts.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Alerts written: ${alerts.length}`);

  // Slack stub
  const webhook = process.env.SLACK_ALERT_WEBHOOK;
  if (webhook && alerts.length) {
    console.log('Slack webhook detected — sending stub payload (not implemented).');
  }
}

main();

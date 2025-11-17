import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface RunRecord { workflowId: string; overallScore?: number; timestamp: string; }

function main() {
  const root = path.resolve(process.cwd(), 'Agents');
  const perfDir = path.join(root, 'collections', 'agent-performance-metrics');
  const files = readdirSync(perfDir).filter(f => f.startsWith('metrics-baseline-'));
  const runs: RunRecord[] = [];
  for (const f of files) {
    const arr = JSON.parse(readFileSync(path.join(perfDir, f), 'utf-8'));
    for (const rec of arr) runs.push({ workflowId: rec.workflowId, overallScore: rec.overallScore, timestamp: rec.timestamp });
  }
  const grouped: Record<string, RunRecord[]> = {};
  for (const r of runs) {
    grouped[r.workflowId] = grouped[r.workflowId] || [];
    grouped[r.workflowId].push(r);
  }
  const rolling = Object.entries(grouped).map(([id, arr]) => {
    const sorted = arr.sort((a,b)=> new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const lastFive = sorted.slice(-5);
    const avg = lastFive.reduce((a,b)=> a + (b.overallScore||0), 0) / lastFive.length;
    return { id, runs: sorted.length, rollingWindow: lastFive.length, rollingScores: lastFive.map(r=>r.overallScore), rollingAvgScore: +avg.toFixed(3) };
  }).sort((a,b)=> (a.rollingAvgScore - b.rollingAvgScore));

  const out = { timestamp: new Date().toISOString(), window: 5, workflows: rolling };
  writeFileSync(path.join(perfDir, 'workflow_scoreboard_rolling.json'), JSON.stringify(out, null, 2));
  console.log('Rolling scoreboard written');
}

main();

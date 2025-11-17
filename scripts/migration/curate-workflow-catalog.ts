import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function main() {
  const root = path.resolve(__dirname, '../../');
  const backlogPath = path.join(root, 'workflow_backlog.json');
  const backlog = JSON.parse(readFileSync(backlogPath, 'utf-8'));

  // Simple reprioritization heuristic: in-progress first ordered by valueScore desc.
  const inProgress = backlog.workflows.filter((w: any) => w.status === 'in-progress').sort((a: any, b: any) => b.valueScore - a.valueScore);
  const planned = backlog.workflows.filter((w: any) => w.status === 'planned').sort((a: any, b: any) => b.valueScore - a.valueScore);

  const nextRecommended = planned.slice(0, 5).map((w: any) => w.id);

  const dependencyMatrix: Record<string, string[]> = {};
  backlog.workflows.forEach((w: any) => { dependencyMatrix[w.id] = w.dependencies || []; });

  const updateReport = {
    timestamp: new Date().toISOString(),
    inProgressOrder: inProgress.map((w: any) => w.id),
    nextRecommended,
    dependencyMatrix,
    rationale: "Prioritize high valueScore items and ensure dependency coverage before expansion.",
    metricsPlan: {
      default: ["latency", "success_rate", "error_rate", "valueScore"],
      extended: ["novelty", "coverage", "human_edit_distance"]
    }
  };

  const reportPath = path.join(root, 'workflow_update_report.json');
  writeFileSync(reportPath, JSON.stringify(updateReport, null, 2));
  console.log('Curator report written:', reportPath);
}

main();

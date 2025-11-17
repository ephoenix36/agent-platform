import { readFileSync } from 'fs';
import path from 'path';

async function main() {
  const webhook = process.env.SLACK_ALERT_WEBHOOK;
  if (!webhook) {
    console.log('No SLACK_ALERT_WEBHOOK env var set; skipping dispatch.');
    return;
  }
  const root = path.resolve(process.cwd(), 'Agents');
  const alertsPath = path.join(root, 'collections', 'agent-performance-metrics', 'alerts.json');
  let alerts: any = {};
  try { alerts = JSON.parse(readFileSync(alertsPath, 'utf-8')); } catch { console.error('Alerts file missing'); return; }

  const blocks = (alerts.alerts || []).map((a: any) => ({
    type: 'section',
    text: { type: 'mrkdwn', text: `*${a.level.toUpperCase()}* | ${a.workflowId} -> ${a.message}` }
  }));

  const payload = { text: 'Workflow Alerts', blocks };
  try {
    const res = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    console.log('Slack dispatch status:', res.status);
  } catch (e: any) {
    console.error('Slack dispatch failed:', e.message);
  }
}

main();

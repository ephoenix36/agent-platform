#!/usr/bin/env node
/**
 * Migration script: Copy agents from MCP runtime to persistent storage
 */

import { PersistentStorageManager } from '../core/persistent-storage.js';
import { AgentManager } from '../core/agent-manager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateAgents() {
  console.log('='.repeat(60));
  console.log('  Agent Migration: Collections → Persistent Storage');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Initialize managers
    const collectionsPath = path.join(__dirname, '../../collections');
    const sourceManager = new AgentManager(collectionsPath);
    const storage = new PersistentStorageManager();

    console.log('Initializing persistent storage...');
    await storage.initialize();
    console.log('✓ Storage initialized\n');

    // Get all agents from collections
    console.log('Loading agents from collections...');
    const collections = ['agent-workflows', 'business-agents', 'creative-tools', 'meta-agents', 'research', 'web-development'];
    let totalAgents = 0;
    let migratedCount = 0;
    let errorCount = 0;

    for (const collection of collections) {
      try {
        const agents = await sourceManager.listAgents(collection);
        console.log(`\n  Collection: ${collection} (${agents.length} agents)`);

        for (const agent of agents) {
          totalAgents++;
          try {
            // Determine category
            let category = 'custom';
            if (collection.includes('marketplace')) {
              category = 'marketplace';
            } else if (collection.includes('template')) {
              category = 'templates';
            }

            // Save to persistent storage
            await storage.saveAgent(agent, 'json', category);
            migratedCount++;
            console.log(`    ✓ ${agent.name || agent.id}`);
          } catch (err) {
            errorCount++;
            console.error(`    ✗ Failed: ${agent.id || 'unknown'} - ${err}`);
          }
        }
      } catch (err) {
        console.error(`  ✗ Failed to process collection ${collection}: ${err}`);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Migration Summary:');
    console.log(`  Total agents found:     ${totalAgents}`);
    console.log(`  Successfully migrated:  ${migratedCount}`);
    console.log(`  Errors:                 ${errorCount}`);
    console.log('='.repeat(60));
    console.log('');

    // Show storage stats
    console.log('Storage Statistics:');
    const stats = await storage.getStats();
    for (const [area, data] of Object.entries(stats.areas)) {
      console.log(`  ${area.padEnd(20)} ${data.files} files, ${(data.size / 1024).toFixed(2)} KB`);
    }
    console.log('');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAgents()
  .then(() => {
    console.log('✓ Migration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Migration error:', error);
    process.exit(1);
  });

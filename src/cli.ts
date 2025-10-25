#!/usr/bin/env node
import { Command } from 'commander';
import { AgentManager } from './core/agent-manager.js';
import { AgentInstruction } from './types/schema.js';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();
const agentManager = new AgentManager('./collections');

program
  .name('agents')
  .description('CLI for managing and optimizing AI agent instructions')
  .version('0.1.0');

// List command
program
  .command('list [collection] [subsection]')
  .description('List collections, subsections, or agents')
  .action(async (collection?: string, subsection?: string) => {
    try {
      if (!collection) {
        // List all collections
        const collections = await agentManager.getCollections();
        console.log(chalk.bold('\n📚 Collections:\n'));
        collections.forEach(c => console.log(`  ${chalk.cyan(c)}`));
      } else if (!subsection) {
        // List subsections in collection
        const subsections = await agentManager.getSubsections(collection);
        console.log(chalk.bold(`\n📁 Subsections in ${chalk.cyan(collection)}:\n`));
        subsections.forEach(s => console.log(`  ${chalk.yellow(s)}`));
      } else {
        // List agents in subsection
        const agents = await agentManager.listAgents(collection, subsection);
        console.log(chalk.bold(`\n🤖 Agents in ${chalk.cyan(collection)}/${chalk.yellow(subsection)}:\n`));
        agents.forEach(a => {
          console.log(`  ${chalk.green(a.name)}`);
          console.log(`    ${chalk.gray(a.description)}`);
          console.log(`    ${chalk.gray(`Score: ${a.currentScore.toFixed(2)} | Difficulty: ${a.difficulty}`)}\n`);
        });
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
    }
  });

// Search command
program
  .command('search <query>')
  .description('Search for agents by name, description, or tags')
  .action(async (query: string) => {
    const spinner = ora('Searching agents...').start();
    try {
      const results = await agentManager.searchAgents(query);
      spinner.stop();
      
      if (results.length === 0) {
        console.log(chalk.yellow(`\nNo agents found matching "${query}"`));
        return;
      }

      console.log(chalk.bold(`\n🔍 Found ${results.length} agent(s):\n`));
      results.forEach(agent => {
        console.log(`  ${chalk.green(agent.name)}`);
        console.log(`    ${chalk.cyan(agent.collection)}/${chalk.yellow(agent.subsection)}`);
        console.log(`    ${chalk.gray(agent.description)}`);
        console.log(`    ${chalk.gray(`Tags: ${agent.tags.join(', ')}`)}\n`);
      });
    } catch (error) {
      spinner.stop();
      console.error(chalk.red(`Error: ${error}`));
    }
  });

// Info command
program
  .command('info <path>')
  .description('Show detailed information about an agent (format: collection/subsection/agent-id)')
  .action(async (path: string) => {
    try {
      const [collection, subsection, agentId] = path.split('/');
      if (!collection || !subsection || !agentId) {
        console.error(chalk.red('Invalid path format. Use: collection/subsection/agent-id'));
        return;
      }

      const agent = await agentManager.loadAgent(collection, subsection, agentId);
      
      console.log(chalk.bold(`\n📋 Agent Information\n`));
      console.log(`${chalk.bold('Name:')} ${chalk.green(agent.name)}`);
      console.log(`${chalk.bold('ID:')} ${agent.id}`);
      console.log(`${chalk.bold('Collection:')} ${chalk.cyan(agent.collection)}/${chalk.yellow(agent.subsection)}`);
      console.log(`${chalk.bold('Version:')} ${agent.version}`);
      console.log(`${chalk.bold('Description:')} ${agent.description}`);
      console.log(`${chalk.bold('Difficulty:')} ${agent.difficulty}`);
      console.log(`${chalk.bold('Current Score:')} ${agent.currentScore.toFixed(3)}`);
      console.log(`${chalk.bold('Threshold:')} ${agent.optimizationThreshold.toFixed(3)}`);
      console.log(`${chalk.bold('Tags:')} ${agent.tags.join(', ')}`);
      
      if (agent.requiredTools && agent.requiredTools.length > 0) {
        console.log(`${chalk.bold('Required Tools:')} ${agent.requiredTools.join(', ')}`);
      }
      
      if (agent.optimizationHistory.length > 0) {
        console.log(chalk.bold('\n📈 Optimization History:'));
        agent.optimizationHistory.slice(-3).forEach(run => {
          console.log(`  ${run.timestamp}: ${run.startScore.toFixed(3)} → ${run.endScore.toFixed(3)} (${run.generations} gen)`);
        });
      }
      
      console.log(chalk.bold('\n📝 System Prompt Preview:'));
      console.log(chalk.gray(agent.systemPrompt.slice(0, 300) + '...'));
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
    }
  });

// Run command (placeholder - would integrate with MCP)
program
  .command('run <path>')
  .description('Run an agent with input (format: collection/subsection/agent-id)')
  .option('-i, --input <text>', 'Input text for the agent')
  .option('-f, --file <path>', 'Input file path')
  .action(async (path: string, options) => {
    console.log(chalk.yellow('\n⚠️  Agent execution requires MCP integration (coming soon)'));
    console.log(chalk.gray(`Would run: ${path}`));
    console.log(chalk.gray(`Input: ${options.input || options.file || 'interactive'}`));
  });

// Optimize command (placeholder - would integrate with Python bridge)
program
  .command('optimize <path>')
  .description('Optimize an agent instruction using Evosuite')
  .option('-t, --threshold <number>', 'Target threshold (0-1)', '0.85')
  .option('-g, --generations <number>', 'Max generations', '50')
  .action(async (path: string, options) => {
    console.log(chalk.yellow('\n⚠️  Optimization requires Evosuite integration (coming soon)'));
    console.log(chalk.gray(`Would optimize: ${path}`));
    console.log(chalk.gray(`Threshold: ${options.threshold}, Max generations: ${options.generations}`));
  });

// Create command
program
  .command('create <collection> <subsection> <name>')
  .description('Create a new agent instruction from template')
  .action(async (collection: string, subsection: string, name: string) => {
    const spinner = ora('Creating agent...').start();
    try {
      const newAgent: AgentInstruction = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        description: 'New agent - add description',
        collection,
        subsection,
        version: '1.0.0',
        systemPrompt: 'You are an AI assistant. Add your system prompt here.',
        userPromptTemplate: '{input}',
        examples: [],
        tags: [],
        difficulty: 'intermediate',
        currentScore: 0.0,
        optimizationThreshold: 0.8,
        evaluator: {
          type: 'rule-based',
          implementation: 'evaluators/templates/basic.py',
          successCriteria: [],
          weightedMetrics: [],
        },
        mutator: {
          strategies: ['prompt-expansion'],
          constraints: [],
          implementation: 'mutators/templates/basic.py',
          mutationRate: 0.3,
        },
        optimizationHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await agentManager.saveAgent(newAgent);
      spinner.succeed(chalk.green(`Created agent: ${collection}/${subsection}/${newAgent.id}`));
      console.log(chalk.gray('\nEdit the JSON file to customize the agent.'));
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error}`));
    }
  });

program.parse();

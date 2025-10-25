# Agents Demo - Quick Start Guide

This guide demonstrates the complete Agents system functionality.

## Prerequisites

```bash
cd C:\Users\ephoe\Documents\Coding_Projects\Agents
npm install
npm run build
```

## Demo Walkthrough

### 1. Explore Collections

List all available collections:
```bash
node dist/cli.js list
```

Expected output:
```
📚 Collections:
  automation
  creative-tools
  meta-agents
  research
  web-development
```

### 2. Browse Subsections

Explore what's in the creative-tools collection:
```bash
node dist/cli.js list creative-tools
```

Expected output:
```
📁 Subsections in creative-tools:
  figma
  photoshop
```

### 3. View Agents

See agents in the photoshop subsection:
```bash
node dist/cli.js list creative-tools photoshop
```

Expected output:
```
🤖 Agents in creative-tools/photoshop:
  Photoshop Color Correction Agent
    Guides users through advanced color correction techniques in Adobe Photoshop
    Score: 0.68 | Difficulty: intermediate
```

### 4. Search for Agents

Find React-related agents:
```bash
node dist/cli.js search react
```

Expected output:
```
🔍 Found 1 agent(s):
  React Component Generator
    web-development/frontend
    Generates production-ready React components from natural language descriptions
    Tags: react, typescript, component, frontend, web-development
```

### 5. View Agent Details

Get comprehensive information about an agent:
```bash
node dist/cli.js info meta-agents/core/evaluator-creator
```

Expected output:
```
📋 Agent Information

Name: Evaluator Creator Meta-Agent
ID: evaluator-creator
Collection: meta-agents/core
Version: 1.0.0
Description: Creates custom evaluation functions for optimizing agent instructions across any task domain
Difficulty: advanced
Current Score: 0.750
Threshold: 0.850
Tags: meta-agent, evaluator, optimization, core

📝 System Prompt Preview:
You are an expert Evaluator Architect specializing in creating robust evaluation functions...
```

### 6. Create a New Agent

Create a custom agent:
```bash
node dist/cli.js create automation file-processing "CSV Validator"
```

Expected output:
```
✔ Created agent: automation/file-processing/csv-validator
Edit the JSON file to customize the agent.
```

### 7. Test Python Optimizer

Run the optimization engine directly:
```bash
python optimization/optimizer.py
```

Expected output:
```json
{
  "success": true,
  "best_score": 0.596,
  "best_variant": { ... },
  "generations": 7,
  "history": [ ... ],
  "converged": false
}
```

## Current Agent Library

### Creative Tools
- **Photoshop Color Correction** (Score: 0.68)
  - Professional color correction workflows
  - Non-destructive editing techniques
  - Skin tone preservation

### Web Development
- **React Component Generator** (Score: 0.74)
  - TypeScript + React components
  - Accessibility built-in
  - Production-ready code

### Research
- **Literature Synthesizer** (Score: 0.71)
  - Academic literature reviews
  - Thematic organization
  - Critical analysis

### Meta-Agents
- **Evaluator Creator** (Score: 0.75)
  - Creates Python evaluation functions
  - Supports multiple strategies
  - Self-optimizing

- **Mutator Creator** (Score: 0.72)
  - Creates mutation strategies
  - Adaptive behavior
  - Feedback-driven

## What Each Agent Contains

Every agent JSON file includes:

1. **Identity**: name, description, collection, version
2. **Instruction**: systemPrompt, userPromptTemplate, examples
3. **MCP Integration**: required tools, permissions
4. **Optimization**: evaluator config, mutator config, scores
5. **Metadata**: tags, difficulty, creation dates

## Example Agent Structure

```json
{
  "id": "color-correction-agent",
  "name": "Photoshop Color Correction Agent",
  "systemPrompt": "You are an expert Photoshop color correction specialist...",
  "evaluator": {
    "type": "llm-judge",
    "successCriteria": [...]
  },
  "mutator": {
    "strategies": ["example-enhancement", "technique-expansion"]
  },
  "currentScore": 0.68,
  "optimizationThreshold": 0.85
}
```

## Next Steps

### To Run Optimization (Coming Soon):
```bash
# This will be fully functional once Python bridge is integrated
node dist/cli.js optimize creative-tools/photoshop/color-correction-agent \
  --threshold 0.85 \
  --generations 50
```

### To Execute an Agent (Coming Soon):
```bash
# This will be functional once MCP integration is complete
node dist/cli.js run creative-tools/photoshop/color-correction-agent \
  --input "Portrait with warm color cast, underexposed"
```

### To Create Custom Evaluators:

Use the evaluator-creator meta-agent:
```bash
# Use via MCP or agents-mcp system
# Provide task description and success criteria
# Receive Python evaluation code
```

## Advanced Usage

### Search by Tags
```bash
node dist/cli.js search optimization
node dist/cli.js search meta-agent
node dist/cli.js search frontend
```

### Browse Entire Library
```bash
# List all collections
node dist/cli.js list

# For each collection, list subsections
node dist/cli.js list creative-tools
node dist/cli.js list web-development
node dist/cli.js list research

# For each subsection, list agents
node dist/cli.js list web-development frontend
node dist/cli.js list research literature-review
```

## Tips & Best Practices

1. **Naming Conventions**
   - Use kebab-case for IDs: `color-correction-agent`
   - Use Title Case for names: `Photoshop Color Correction Agent`

2. **Collection Organization**
   - Group by domain (creative-tools, web-development, etc.)
   - Use subsections for specialization (photoshop, figma, etc.)

3. **Optimization Thresholds**
   - Start with 0.80 for most agents
   - Use 0.85+ for production-critical agents
   - Use 0.90+ for meta-agents

4. **Evaluator Design**
   - Start with rule-based for objective tasks
   - Use LLM-judge for subjective quality
   - Combine strategies for best results

5. **Version Control**
   - Commit agent JSON files to git
   - Track optimization improvements over time
   - Use branches for experimental optimizations

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Python Path Issues
```bash
# Ensure Python 3.8+ is in PATH
python --version

# If not, specify full path in PythonBridge
```

### Schema Validation Errors
- Check that all required fields are present
- Ensure score values are 0.0-1.0
- Verify array fields are arrays (not objects)

## Resources

- **Architecture**: See `ARCHITECTURE.md`
- **Status**: See `PROJECT_STATUS.md`
- **Types**: See `src/types/schema.ts`
- **Examples**: Browse `collections/` directory

## Feedback & Contributions

This is an early-stage project. Suggestions welcome!

- Create new agents for your domain
- Improve existing agent instructions
- Build better evaluators and mutators
- Share optimized agents

---

**Happy Agent Building! 🤖**

# Persistent Storage System - Index

## 📚 Documentation Hub

Your comprehensive guide to the MCP Agent Platform persistent storage system.

---

## 🚀 Quick Links

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[PERSISTENT_STORAGE_COMPLETE.md](./PERSISTENT_STORAGE_COMPLETE.md)** | Success summary & verification | Review what was built |
| **[PERSISTENT_STORAGE_QUICK_REF.md](./PERSISTENT_STORAGE_QUICK_REF.md)** | Quick reference guide | Daily development work |
| **[PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md)** | Complete documentation | Deep dive & integration |
| **[PERSISTENT_STORAGE_IMPLEMENTATION.md](./PERSISTENT_STORAGE_IMPLEMENTATION.md)** | Implementation details | Understand architecture |

---

## 📖 Documents Overview

### 1. [PERSISTENT_STORAGE_COMPLETE.md](./PERSISTENT_STORAGE_COMPLETE.md)
**Status Report & Success Summary**

✅ **What:** Verification that everything is working  
✅ **Contains:**
- Test results
- Complete feature list
- Current storage state
- Success criteria checklist
- Next steps

**Use this when:** You want to verify the system is working or show someone what was built.

---

### 2. [PERSISTENT_STORAGE_QUICK_REF.md](./PERSISTENT_STORAGE_QUICK_REF.md)
**Developer Quick Reference**

⚡ **What:** Fast lookup for common tasks  
⚡ **Contains:**
- Setup commands
- Code examples (copy-paste ready)
- File format quick reference
- NPM scripts
- Troubleshooting table

**Use this when:** You're actively developing and need quick code snippets.

---

### 3. [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md)
**Complete Documentation**

📖 **What:** Full technical reference  
📖 **Contains:**
- Directory structure (detailed)
- All file formats with examples
- Complete API reference
- Integration with EvoSuite
- Backup & recovery procedures
- Maintenance guide
- Best practices

**Use this when:** You're integrating the storage system, troubleshooting issues, or need complete specifications.

---

### 4. [PERSISTENT_STORAGE_IMPLEMENTATION.md](./PERSISTENT_STORAGE_IMPLEMENTATION.md)
**Implementation Details**

🔧 **What:** Technical architecture & design  
🔧 **Contains:**
- What was built (comprehensive list)
- Storage manager features
- Schema definitions
- Usage examples
- Next steps roadmap

**Use this when:** You want to understand the architecture or plan enhancements.

---

## 🎯 Getting Started Path

### New to the System?
1. Start: [PERSISTENT_STORAGE_COMPLETE.md](./PERSISTENT_STORAGE_COMPLETE.md) - See what's available
2. Read: [PERSISTENT_STORAGE_QUICK_REF.md](./PERSISTENT_STORAGE_QUICK_REF.md) - Learn basic usage
3. Reference: [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md) - Deep dive when needed

### Already Familiar?
- Bookmark: [PERSISTENT_STORAGE_QUICK_REF.md](./PERSISTENT_STORAGE_QUICK_REF.md) - Your daily reference

### Planning Integration?
- Read: [PERSISTENT_STORAGE_IMPLEMENTATION.md](./PERSISTENT_STORAGE_IMPLEMENTATION.md) first
- Then: [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md) for complete API docs

---

## 📦 What You Get

### Core Features
- ✅ **Multi-format agents** (JSON, Markdown)
- ✅ **Skills with rules** (instructions + compact guidelines)
- ✅ **Toolsets with instructions**
- ✅ **Lifecycle hooks**
- ✅ **Workflows**
- ✅ **14 storage areas** with categorization
- ✅ **Backup system**
- ✅ **EvoSuite integration** (evaluation + mutation rules)

### Files Created
- ✅ `setup-persistent-storage.ps1` - Setup script
- ✅ `persistent-storage.ts` - Storage manager (800+ lines)
- ✅ `migrate-to-persistent-storage.ts` - Migration script
- ✅ `test-persistent-storage.ts` - Test script
- ✅ 4 documentation files (1,350+ lines)
- ✅ Templates and examples

### Storage Created
- ✅ `~/.agents/` directory (51 subdirectories)
- ✅ Configuration files
- ✅ Example templates
- ✅ Test agent (JSON + Markdown)

---

## 🎓 Learning Path

### Level 1: Basic Usage
**Time:** 15 minutes

1. Read [Quick Start](#quick-start) section below
2. Run setup if needed: `npm run setup:storage`
3. Try the code examples in [PERSISTENT_STORAGE_QUICK_REF.md](./PERSISTENT_STORAGE_QUICK_REF.md)

### Level 2: Integration
**Time:** 1 hour

1. Study [PERSISTENT_STORAGE_IMPLEMENTATION.md](./PERSISTENT_STORAGE_IMPLEMENTATION.md)
2. Review API reference in [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md)
3. Integrate `PersistentStorageManager` into your code

### Level 3: Advanced Features
**Time:** 2-3 hours

1. Read full documentation: [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md)
2. Implement skills with rules
3. Create custom toolsets
4. Set up lifecycle hooks
5. Build workflows

---

## 🚀 Quick Start

### Setup (If Not Done)
```bash
npm run setup:storage
```

### Basic Usage
```typescript
import { PersistentStorageManager } from './src/core/persistent-storage.js';

const storage = new PersistentStorageManager();
await storage.initialize();

// Save an agent
await storage.saveAgent({
  id: 'my-agent',
  name: 'My Agent',
  model: 'gpt-4o',
  systemPrompt: 'You are...',
  toolkits: ['agent-development']
}, 'json', 'custom');

// Load it back
const agent = await storage.loadAgent('my-agent', 'custom');
```

### Verify Setup
```bash
npm run storage:stats
```

---

## 📂 Storage Structure

```
~/.agents/
├── agents/          → JSON & Markdown agent definitions
├── skills/          → Skills with instructions & rules
├── teams/           → Agent team configurations
├── toolsets/        → Toolsets with instructions & rules
├── workflows/       → Multi-step workflow definitions
├── hooks/           → Lifecycle hooks
├── collections/     → Data collections & knowledge bases
├── evaluation/      → Evaluation configs & results
├── mutation/        → Mutation strategies & history
├── metrics/         → Usage & performance tracking
├── projects/        → Project management data
├── cache/           → Cache & temporary files
├── logs/            → Execution & error logs
└── backups/         → Backup storage
```

---

## 🔗 Related Files

### Scripts
- `scripts/setup-persistent-storage.ps1` - Create storage structure
- `scripts/migrate-to-persistent-storage.ts` - Migrate from collections/
- `scripts/test-persistent-storage.ts` - Test storage operations

### Source Code
- `src/core/persistent-storage.ts` - Storage manager implementation
- `src/core/agent-manager.ts` - Original agent manager (legacy)

### Configuration
- `~/.agents/config.json` - Storage configuration
- `~/.agents/README.md` - Storage directory guide

---

## 💡 Common Tasks

### Save Different Asset Types
```typescript
// Agent
await storage.saveAgent(agent, 'json', 'custom');

// Skill
await storage.saveSkill(skill, 'user');

// Toolset
await storage.saveToolset(toolset, 'custom');

// Hook
await storage.saveHook(hook, 'system');

// Workflow
await storage.saveWorkflow(workflow, 'active');
```

### List & Search
```typescript
// List all agents
const agents = await storage.listAgents();

// List specific category
const customAgents = await storage.listAgents('custom');

// List skills
const skills = await storage.listSkills('user');
```

### Backup & Stats
```typescript
// Create backup
const path = await storage.createBackup(['agents', 'skills']);

// Get statistics
const stats = await storage.getStats();
```

---

## 🆘 Need Help?

### Common Issues

| Issue | Solution |
|-------|----------|
| Storage not initialized | Run `npm run setup:storage` |
| Can't find agent | Check category parameter |
| TypeScript errors | Run `npm run build` |
| Permission denied | Check directory permissions |

### Troubleshooting
See [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md) § Troubleshooting

---

## 📊 Status

**Current State:** ✅ FULLY OPERATIONAL

- Storage created: ✅
- Code complete: ✅
- Tests passing: ✅
- Documentation complete: ✅
- Templates available: ✅

**Ready for:** Production use & integration

---

## 🎯 Next Steps

1. **Review** [PERSISTENT_STORAGE_COMPLETE.md](./PERSISTENT_STORAGE_COMPLETE.md)
2. **Learn** from [PERSISTENT_STORAGE_QUICK_REF.md](./PERSISTENT_STORAGE_QUICK_REF.md)
3. **Integrate** using [PERSISTENT_STORAGE.md](./PERSISTENT_STORAGE.md)
4. **Enhance** with ideas from [PERSISTENT_STORAGE_IMPLEMENTATION.md](./PERSISTENT_STORAGE_IMPLEMENTATION.md)

---

**Version:** 1.0.0  
**Last Updated:** November 16, 2025  
**Status:** Complete ✅

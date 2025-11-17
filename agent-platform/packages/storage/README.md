# @agent-platform/storage

Storage layer for AI Agent Platform components with versioning, transactions, and hot reload.

## Features

- **CRUD Operations**: Create, read, update, delete components
- **Versioning**: Track all changes with version history
- **Transactions**: Atomic operations with rollback support
- **Hot Reload**: Auto-reload on file changes
- **Import/Export**: Portable component packages
- **Dependency Management**: Track and validate component dependencies
- **Multi-format**: JSON and YAML support

## Installation

```bash
npm install @agent-platform/storage
```

## Usage

```typescript
import { FileSystemStore, ComponentType, StorageLocation } from '@agent-platform/storage';

// Initialize store
const store = new FileSystemStore('./local-storage');
await store.initialize();

// Create a component
const result = await store.create({
  type: ComponentType.AGENT,
  name: 'Research Agent',
  description: 'AI agent for deep research',
  storageLocation: StorageLocation.USER,
  visibility: ComponentVisibility.PUBLIC,
  content: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: 'You are a research assistant...',
  },
  metadata: {
    tags: ['research', 'ai'],
    category: 'research',
  },
});

// Read a component
const agent = await store.read(result.data.id);

// Update a component
await store.update(agent.id, {
  description: 'Updated description',
});

// List components
const { components } = await store.list({
  type: ComponentType.AGENT,
  limit: 10,
});

// Watch for changes
const unsubscribe = store.watch((event) => {
  console.log(`Component ${event.type}:`, event.componentId);
});
```

## API Reference

See [types.ts](./src/types.ts) for full API documentation.

# Extension System

A comprehensive extension system for the Agent Platform with dynamic loading, lifecycle management, and security features.

## Features

- **Type-Safe Manifests**: Zod-validated extension manifests with comprehensive metadata
- **Dependency Management**: Automatic dependency resolution with semver version constraints
- **Lifecycle Management**: Complete install/enable/disable/uninstall lifecycle
- **Permission System**: Fine-grained permission control for security
- **Dynamic Loading**: Runtime module loading with caching and error handling
- **Event-Driven**: Rich event system for monitoring extension lifecycle
- **State Management**: Track extension states (installed, enabled, disabled, error)
- **Circular Dependency Detection**: Prevents dependency cycles

## Installation

```bash
npm install @agent-platform/extension-system
```

## Quick Start

```typescript
import {
  ExtensionRegistry,
  ExtensionLoader,
  ExtensionManifest,
  ExtensionCategory,
  Permission
} from '@agent-platform/extension-system';

// Create registry
const registry = new ExtensionRegistry({
  platformVersion: '1.0.0',
  allowedPermissions: [Permission.STORAGE_LOCAL, Permission.NETWORK_HTTP]
});

// Register an extension
const manifest: ExtensionManifest = {
  id: 'my-extension',
  name: 'My Extension',
  version: '1.0.0',
  description: 'My awesome extension',
  author: 'Developer Name',
  category: ExtensionCategory.UTILITY,
  main: './dist/index.js',
  permissions: [Permission.STORAGE_LOCAL],
  engines: { 'agent-platform': '>=1.0.0' }
};

await registry.register(manifest, '/path/to/extension');

// Create loader and activate
const loader = new ExtensionLoader(registry);
await loader.activate('my-extension');
```

## Extension Manifest

Extensions are defined by a manifest file:

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "Description of the extension",
  "author": {
    "name": "Developer Name",
    "email": "dev@example.com",
    "url": "https://example.com"
  },
  "category": "utility",
  "main": "./dist/index.js",
  "keywords": ["keyword1", "keyword2"],
  "dependencies": [
    {
      "id": "core-extension",
      "version": ">=1.0.0",
      "optional": false
    }
  ],
  "permissions": ["storage:local", "network:http"],
  "activationEvents": ["onStartup"],
  "engines": {
    "agent-platform": ">=1.0.0"
  },
  "contributes": {
    "commands": [
      {
        "id": "extension.command",
        "title": "My Command",
        "handler": "handleCommand"
      }
    ]
  }
}
```

## Extension Module

Extensions must export activate/deactivate functions:

```typescript
import { ExtensionContext } from '@agent-platform/extension-system';

export function activate(context: ExtensionContext) {
  console.log(`Extension ${context.extensionId} activated!`);
  
  // Register disposable resources
  context.subscriptions.push({
    dispose() {
      // Cleanup code
    }
  });
}

export function deactivate() {
  console.log('Extension deactivated!');
}
```

## Permission System

Available permissions:

- `network:http` - HTTP requests
- `network:websocket` - WebSocket connections
- `fs:read` - File system read access
- `fs:write` - File system write access
- `fs:delete` - File system delete access
- `storage:local` - Local storage access
- `storage:session` - Session storage access
- `widget:communicate` - Widget communication
- `widget:create` - Create widgets
- `workflow:read` - Read workflows
- `workflow:write` - Write workflows
- `workflow:execute` - Execute workflows
- `system:clipboard` - Clipboard access
- `system:notifications` - System notifications
- `extension:communicate` - Inter-extension communication

## Extension States

- `uninstalled` - Extension removed from registry
- `installed` - Extension registered but not enabled
- `enabled` - Extension active and running
- `disabled` - Extension installed but inactive
- `error` - Extension encountered an error

## Events

Registry events:

- `extension:registered` - Extension added to registry
- `extension:unregistered` - Extension removed from registry
- `extension:state-changed` - Extension state changed
- `extension:enabled` - Extension enabled
- `extension:disabled` - Extension disabled
- `extension:error` - Extension encountered error

Loader events:

- `extension:loaded` - Extension module loaded
- `extension:activated` - Extension activated
- `extension:deactivated` - Extension deactivated
- `extension:load-error` - Error loading extension

## API Reference

### ExtensionRegistry

```typescript
class ExtensionRegistry {
  constructor(config: RegistryConfig)
  
  // Core operations
  register(manifest: ExtensionManifest, installPath: string): Promise<ExtensionMetadata>
  unregister(extensionId: string): Promise<void>
  enable(extensionId: string): Promise<void>
  disable(extensionId: string): Promise<void>
  setError(extensionId: string, error: string): void
  
  // Queries
  get(extensionId: string): ExtensionMetadata
  has(extensionId: string): boolean
  getAll(): ExtensionMetadata[]
  getByState(state: ExtensionState): ExtensionMetadata[]
  getByPermission(permission: Permission): ExtensionMetadata[]
  getEnabled(): ExtensionMetadata[]
  getDependents(extensionId: string): string[]
  getDependencies(extensionId: string, includeOptional?: boolean): string[]
  getStats(): RegistryStats
  
  // Utility
  clear(): void
}
```

### ExtensionLoader

```typescript
class ExtensionLoader {
  constructor(registry: ExtensionRegistry)
  
  // Core operations
  load(extensionId: string): Promise<ExtensionModule>
  activate(extensionId: string): Promise<void>
  deactivate(extensionId: string): Promise<void>
  unload(extensionId: string): Promise<void>
  
  // Batch operations
  loadAll(): Promise<void>
  activateAll(): Promise<void>
  deactivateAll(): Promise<void>
  
  // Queries
  getModule(extensionId: string): ExtensionModule | undefined
  getContext(extensionId: string): ExtensionContext | undefined
  isLoaded(extensionId: string): boolean
  getLoadOrder(): string[]
  
  // Utility
  clear(): void
}
```

## Examples

See the `examples/` directory for complete examples:

- `basic-usage.ts` - Simple extension registration and activation
- More examples coming soon!

## Testing

```bash
npm test
```

## License

MIT

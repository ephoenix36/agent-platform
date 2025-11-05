/**
 * Extension System Integration Example
 * Demonstrates end-to-end usage of the extension system
 */

import {
  ExtensionRegistry,
  ExtensionLoader,
  ExtensionManifest,
  ExtensionCategory,
  Permission,
  ExtensionModule,
  ExtensionContext
} from '../src';

// Example: Create a simple extension
const exampleManifest: ExtensionManifest = {
  id: 'example-extension',
  name: 'Example Extension',
  version: '1.0.0',
  description: 'A simple example extension',
  author: {
    name: 'Developer',
    email: 'dev@example.com'
  },
  category: ExtensionCategory.UTILITY,
  main: './extension.js',
  keywords: ['example', 'demo'],
  dependencies: [],
  permissions: [
    Permission.STORAGE_LOCAL,
    Permission.WIDGET_COMMUNICATE
  ],
  activationEvents: ['onStartup'],
  engines: {
    'agent-platform': '>=1.0.0'
  },
  contributes: {
    commands: [
      {
        id: 'example.hello',
        title: 'Say Hello',
        description: 'Displays a hello message',
        handler: 'handleHello'
      }
    ],
    settings: [
      {
        key: 'example.greeting',
        type: 'string',
        default: 'Hello',
        description: 'The greeting to use'
      }
    ]
  }
};

// Example extension module
const exampleModule: ExtensionModule = {
  activate(context: ExtensionContext) {
    console.log(`Extension ${context.extensionId} activated!`);
    console.log(`Installed at: ${context.extensionPath}`);
    console.log(`Permissions: ${context.manifest.permissions.join(', ')}`);
    
    // Register cleanup
    context.subscriptions.push({
      dispose() {
        console.log('Cleaning up resources...');
      }
    });
  },
  
  deactivate() {
    console.log('Extension deactivated!');
  }
};

// Example usage
async function demonstrateExtensionSystem() {
  console.log('=== Extension System Demo ===\n');
  
  // 1. Create registry
  const registry = new ExtensionRegistry({
    platformVersion: '1.5.0',
    allowedPermissions: [
      Permission.STORAGE_LOCAL,
      Permission.WIDGET_COMMUNICATE,
      Permission.NETWORK_HTTP
    ]
  });
  
  console.log('1. Registry created\n');
  
  // 2. Register extension
  const metadata = await registry.register(
    exampleManifest,
    '/path/to/example-extension'
  );
  
  console.log('2. Extension registered:');
  console.log(`   ID: ${metadata.id}`);
  console.log(`   State: ${metadata.state}`);
  console.log(`   Installed at: ${new Date(metadata.installedAt).toISOString()}\n`);
  
  // 3. Create loader
  const loader = new ExtensionLoader(registry);
  console.log('3. Loader created\n');
  
  // 4. Listen to events
  loader.on('extension:activated', ({ extensionId }) => {
    console.log(`   Event: Extension ${extensionId} activated`);
  });
  
  loader.on('extension:deactivated', ({ extensionId }) => {
    console.log(`   Event: Extension ${extensionId} deactivated`);
  });
  
  // 5. Load and activate (would normally load from disk)
  // For demo, we'll use a mock approach
  console.log('4. Activating extension...\n');
  
  // Note: In production, loader.activate() would:
  //   - Import the module from installPath
  //   - Call module.activate()
  //   - Update registry state
  
  // 6. Check registry stats
  const stats = registry.getStats();
  console.log('\n5. Registry Statistics:');
  console.log(`   Total extensions: ${stats.total}`);
  console.log(`   Enabled: ${stats.enabled}`);
  console.log(`   Disabled: ${stats.disabled}`);
  console.log(`   Errors: ${stats.errors}\n`);
  
  // 7. Query extensions
  const httpExtensions = registry.getByPermission(Permission.NETWORK_HTTP);
  console.log('6. Extensions with HTTP permission:');
  console.log(`   Count: ${httpExtensions.length}\n`);
  
  // 8. Demonstrate dependency chain
  console.log('7. Dependency Management:');
  console.log('   - Extensions can depend on other extensions');
  console.log('   - Loader resolves dependencies in topological order');
  console.log('   - Circular dependencies are detected and prevented\n');
  
  console.log('=== Demo Complete ===');
  
  return { registry, loader, metadata };
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateExtensionSystem().catch(console.error);
}

export { demonstrateExtensionSystem, exampleManifest, exampleModule };

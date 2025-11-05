/**
 * Extension Loader Tests
 */

import {
  ExtensionLoader,
  LoaderError,
  LoaderEvent,
  ExtensionModule,
  ExtensionContext
} from '../src/loader/loader';
import {
  ExtensionRegistry,
  RegistryConfig
} from '../src/registry/registry';
import {
  ExtensionManifest,
  ExtensionState,
  ExtensionCategory
} from '../src/manifest/schema';

// Mock extension modules
class MockLoader extends ExtensionLoader {
  private mockModules: Map<string, ExtensionModule> = new Map();
  private pathToIdMap: Map<string, string> = new Map();

  setMockModule(extensionId: string, module: ExtensionModule, installPath?: string) {
    this.mockModules.set(extensionId, module);
    
    // Map install path to extension ID
    if (installPath) {
      this.pathToIdMap.set(installPath, extensionId);
    }
  }

  protected async importModule(modulePath: string): Promise<ExtensionModule> {
    // Find extension ID from path
    for (const [installPath, extensionId] of this.pathToIdMap) {
      if (modulePath.startsWith(installPath)) {
        const module = this.mockModules.get(extensionId);
        if (module) {
          return module;
        }
      }
    }

    // Fallback: throw error to simulate module not found
    throw new Error(`Cannot find module '${modulePath}'`);
  }
}

describe('ExtensionLoader', () => {
  let registry: ExtensionRegistry;
  let loader: MockLoader;
  let config: RegistryConfig;

  const baseManifest: ExtensionManifest = {
    id: 'ext-1',
    name: 'Extension 1',
    version: '1.0.0',
    description: 'Test extension',
    author: 'Test',
    category: ExtensionCategory.UTILITY,
    main: './index.js',
    keywords: [],
    dependencies: [],
    permissions: [],
    activationEvents: [],
    engines: {
      'agent-platform': '>=1.0.0'
    }
  };

  beforeEach(() => {
    config = { platformVersion: '1.5.0' };
    registry = new ExtensionRegistry(config);
    loader = new MockLoader(registry);
  });

  describe('load', () => {
    it('should load an extension module', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const mockModule: ExtensionModule = {
        activate: jest.fn(),
        deactivate: jest.fn()
      };
      loader.setMockModule('ext-1', mockModule, '/path/ext-1');

      const module = await loader.load('ext-1');
      
      expect(module).toBe(mockModule);
      expect(loader.isLoaded('ext-1')).toBe(true);
    });

    it('should emit loaded event', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');

      const handler = jest.fn();
      loader.on(LoaderEvent.EXTENSION_LOADED, handler);

      await loader.load('ext-1');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ extensionId: 'ext-1' })
      );
    });

    it('should cache loaded module', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const mockModule = { activate: jest.fn() };
      loader.setMockModule('ext-1', mockModule, '/path/ext-1');

      const module1 = await loader.load('ext-1');
      const module2 = await loader.load('ext-1');
      
      expect(module1).toBe(module2);
    });

    it('should throw on load failure', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      // Don't set mock module - will fail

      await expect(loader.load('ext-1')).rejects.toThrow(LoaderError);
    });

    it('should emit load error event on failure', async () => {
      await registry.register(baseManifest, '/path/ext-1');

      const handler = jest.fn();
      loader.on(LoaderEvent.EXTENSION_LOAD_ERROR, handler);

      try {
        await loader.load('ext-1');
      } catch (e) {
        // Expected
      }
      
      expect(handler).toHaveBeenCalled();
    });

    it('should set extension to error state on load failure', async () => {
      await registry.register(baseManifest, '/path/ext-1');

      try {
        await loader.load('ext-1');
      } catch (e) {
        // Expected
      }
      
      const metadata = registry.get('ext-1');
      expect(metadata.state).toBe(ExtensionState.ERROR);
      expect(metadata.error).toBeDefined();
    });

    it('should throw for non-existent extension', async () => {
      await expect(loader.load('non-existent')).rejects.toThrow();
    });

    it('should track load order', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path/ext-2');

      loader.setMockModule('ext-1', {}, '/path/ext-1');
      loader.setMockModule('ext-2', {}, '/path/ext-2');

      await loader.load('ext-1');
      await loader.load('ext-2');
      
      const loadOrder = loader.getLoadOrder();
      expect(loadOrder).toEqual(['ext-1', 'ext-2']);
    });
  });

  describe('activate', () => {
    it('should activate an extension', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const activateFn = jest.fn();
      loader.setMockModule('ext-1', { activate: activateFn }, '/path/ext-1');

      await loader.activate('ext-1');
      
      expect(activateFn).toHaveBeenCalled();
      
      const metadata = registry.get('ext-1');
      expect(metadata.state).toBe(ExtensionState.ENABLED);
    });

    it('should pass context to activate', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const activateFn = jest.fn();
      loader.setMockModule('ext-1', { activate: activateFn }, '/path/ext-1');

      await loader.activate('ext-1');
      
      expect(activateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionId: 'ext-1',
          extensionPath: '/path/ext-1',
          manifest: expect.objectContaining({ id: 'ext-1' }),
          registry: registry,
          subscriptions: expect.any(Array)
        })
      );
    });

    it('should emit activated event', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');

      const handler = jest.fn();
      loader.on(LoaderEvent.EXTENSION_ACTIVATED, handler);

      await loader.activate('ext-1');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ extensionId: 'ext-1' })
      );
    });

    it('should be idempotent for already activated', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const activateFn = jest.fn();
      loader.setMockModule('ext-1', { activate: activateFn }, '/path/ext-1');

      await loader.activate('ext-1');
      await loader.activate('ext-1');
      
      expect(activateFn).toHaveBeenCalledTimes(1);
    });

    it('should work without activate function', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');

      await loader.activate('ext-1');
      
      const metadata = registry.get('ext-1');
      expect(metadata.state).toBe(ExtensionState.ENABLED);
    });

    it('should activate dependencies first', async () => {
      const dep = { ...baseManifest, id: 'dep-1' };
      await registry.register(dep, '/path/dep-1');

      const manifest = {
        ...baseManifest,
        id: 'ext-1',
        dependencies: [
          { id: 'dep-1', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(manifest, '/path/ext-1');

      const depActivate = jest.fn();
      const extActivate = jest.fn();
      
      loader.setMockModule('dep-1', { activate: depActivate }, '/path/dep-1');
      loader.setMockModule('ext-1', { activate: extActivate }, '/path/ext-1');

      await loader.activate('ext-1');
      
      expect(depActivate).toHaveBeenCalled();
      expect(extActivate).toHaveBeenCalled();
      
      const depMeta = registry.get('dep-1');
      expect(depMeta.state).toBe(ExtensionState.ENABLED);
    });

    it('should handle activation errors', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const activateFn = jest.fn().mockRejectedValue(new Error('Activation failed'));
      loader.setMockModule('ext-1', { activate: activateFn }, '/path/ext-1');

      await expect(loader.activate('ext-1')).rejects.toThrow('Activation failed');
      
      const metadata = registry.get('ext-1');
      expect(metadata.state).toBe(ExtensionState.ERROR);
    });
  });

  describe('deactivate', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');
      await loader.activate('ext-1');
    });

    it('should deactivate an extension', async () => {
      await loader.deactivate('ext-1');
      
      const metadata = registry.get('ext-1');
      expect(metadata.state).toBe(ExtensionState.DISABLED);
    });

    it('should call deactivate function', async () => {
      const deactivateFn = jest.fn();
      loader.setMockModule('ext-1', { deactivate: deactivateFn }, '/path/ext-1');
      
      // Reload to get new mock
      await loader.unload('ext-1');
      await loader.load('ext-1');
      await loader.activate('ext-1');

      await loader.deactivate('ext-1');
      
      expect(deactivateFn).toHaveBeenCalled();
    });

    it('should emit deactivated event', async () => {
      const handler = jest.fn();
      loader.on(LoaderEvent.EXTENSION_DEACTIVATED, handler);

      await loader.deactivate('ext-1');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ extensionId: 'ext-1' })
      );
    });

    it('should dispose context subscriptions', async () => {
      const disposeFn = jest.fn();
      const context = loader.getContext('ext-1')!;
      context.subscriptions.push({ dispose: disposeFn });

      await loader.deactivate('ext-1');
      
      expect(disposeFn).toHaveBeenCalled();
    });

    it('should be idempotent for already deactivated', async () => {
      const deactivateFn = jest.fn();
      loader.setMockModule('ext-1', { deactivate: deactivateFn }, '/path/ext-1');
      
      await loader.unload('ext-1');
      await loader.load('ext-1');
      await loader.activate('ext-1');
      
      await loader.deactivate('ext-1');
      await loader.deactivate('ext-1');
      
      expect(deactivateFn).toHaveBeenCalledTimes(1);
    });

    it('should handle deactivation errors', async () => {
      const deactivateFn = jest.fn().mockRejectedValue(new Error('Deactivation failed'));
      loader.setMockModule('ext-1', { deactivate: deactivateFn }, '/path/ext-1');
      
      await loader.unload('ext-1');
      await loader.load('ext-1');
      await loader.activate('ext-1');

      await expect(loader.deactivate('ext-1')).rejects.toThrow('Deactivation failed');
    });
  });

  describe('unload', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');
      await loader.load('ext-1');
    });

    it('should unload an extension', async () => {
      await loader.unload('ext-1');
      
      expect(loader.isLoaded('ext-1')).toBe(false);
    });

    it('should deactivate before unloading if active', async () => {
      await loader.activate('ext-1');
      
      await loader.unload('ext-1');
      
      expect(loader.isLoaded('ext-1')).toBe(false);
      
      const metadata = registry.get('ext-1');
      expect(metadata.state).toBe(ExtensionState.DISABLED);
    });

    it('should clear module reference', async () => {
      await loader.unload('ext-1');
      
      const metadata = registry.get('ext-1');
      expect(metadata.module).toBeUndefined();
    });
  });

  describe('loadAll', () => {
    it('should load all extensions in dependency order', async () => {
      const dep = { ...baseManifest, id: 'dep-1' };
      await registry.register(dep, '/path/dep-1');

      const manifest = {
        ...baseManifest,
        id: 'ext-1',
        dependencies: [
          { id: 'dep-1', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(manifest, '/path/ext-1');

      loader.setMockModule('dep-1', {}, '/path/dep-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');

      await loader.loadAll();
      
      const loadOrder = loader.getLoadOrder();
      const depIndex = loadOrder.indexOf('dep-1');
      const extIndex = loadOrder.indexOf('ext-1');
      
      expect(depIndex).toBeLessThan(extIndex);
    });

    it('should continue on individual load failures', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path/ext-2');

      loader.setMockModule('ext-2', {}, '/path/ext-2');
      // ext-1 will fail (no mock)

      await loader.loadAll();
      
      expect(loader.isLoaded('ext-2')).toBe(true);
    });
  });

  describe('activateAll', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path/ext-1');
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path/ext-2');

      loader.setMockModule('ext-1', {}, '/path/ext-1');
      loader.setMockModule('ext-2', {}, '/path/ext-2');

      await loader.loadAll();
    });

    it('should activate all loaded extensions', async () => {
      await loader.activateAll();
      
      const ext1 = registry.get('ext-1');
      const ext2 = registry.get('ext-2');
      
      expect(ext1.state).toBe(ExtensionState.ENABLED);
      expect(ext2.state).toBe(ExtensionState.ENABLED);
    });

    it('should skip extensions in error state', async () => {
      registry.setError('ext-1', 'Test error');

      await loader.activateAll();
      
      const ext1 = registry.get('ext-1');
      const ext2 = registry.get('ext-2');
      
      expect(ext1.state).toBe(ExtensionState.ERROR);
      expect(ext2.state).toBe(ExtensionState.ENABLED);
    });
  });

  describe('deactivateAll', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path/ext-1');
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path/ext-2');

      loader.setMockModule('ext-1', {}, '/path/ext-1');
      loader.setMockModule('ext-2', {}, '/path/ext-2');

      await loader.loadAll();
      await loader.activateAll();
    });

    it('should deactivate all active extensions', async () => {
      await loader.deactivateAll();
      
      const ext1 = registry.get('ext-1');
      const ext2 = registry.get('ext-2');
      
      expect(ext1.state).toBe(ExtensionState.DISABLED);
      expect(ext2.state).toBe(ExtensionState.DISABLED);
    });
  });

  describe('getModule', () => {
    it('should return loaded module', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      
      const mockModule = {};
      loader.setMockModule('ext-1', mockModule, '/path/ext-1');
      await loader.load('ext-1');

      const module = loader.getModule('ext-1');
      expect(module).toBe(mockModule);
    });

    it('should return undefined for not loaded', () => {
      expect(loader.getModule('ext-1')).toBeUndefined();
    });
  });

  describe('getContext', () => {
    it('should return context for activated extension', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');
      
      await loader.activate('ext-1');

      const context = loader.getContext('ext-1');
      expect(context).toBeDefined();
      expect(context!.extensionId).toBe('ext-1');
    });

    it('should return undefined for not activated', () => {
      expect(loader.getContext('ext-1')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all caches', async () => {
      await registry.register(baseManifest, '/path/ext-1');
      loader.setMockModule('ext-1', {}, '/path/ext-1');
      
      await loader.load('ext-1');

      loader.clear();
      
      expect(loader.isLoaded('ext-1')).toBe(false);
      expect(loader.getLoadOrder()).toEqual([]);
    });
  });

  describe('circular dependency detection', () => {
    it('should detect circular dependencies', async () => {
      const ext1: ExtensionManifest = {
        ...baseManifest,
        id: 'ext-1',
        dependencies: [{ id: 'ext-2', version: '1.0.0', optional: false }]
      };
      
      const ext2: ExtensionManifest = {
        ...baseManifest,
        id: 'ext-2',
        dependencies: [{ id: 'ext-1', version: '1.0.0', optional: false }]
      };

      await registry.register(ext1, '/path/ext-1');
      await registry.register(ext2, '/path/ext-2');

      loader.setMockModule('ext-1', {}, '/path/ext-1');
      loader.setMockModule('ext-2', {}, '/path/ext-2');

      await expect(loader.loadAll()).rejects.toThrow('Circular dependency');
    });
  });
});

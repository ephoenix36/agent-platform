/**
 * Extension Registry Tests
 */

import {
  ExtensionRegistry,
  RegistryError,
  RegistryEvent,
  RegistryConfig
} from '../src/registry/registry';
import {
  ExtensionManifest,
  ExtensionState,
  ExtensionCategory,
  Permission
} from '../src/manifest/schema';

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;
  let config: RegistryConfig;
  
  const baseManifest: ExtensionManifest = {
    id: 'test-extension',
    name: 'Test Extension',
    version: '1.0.0',
    description: 'A test extension',
    author: 'Test Author',
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
    config = {
      platformVersion: '1.5.0'
    };
    registry = new ExtensionRegistry(config);
  });

  describe('register', () => {
    it('should register a valid extension', async () => {
      const metadata = await registry.register(baseManifest, '/path/to/extension');
      
      expect(metadata.id).toBe('test-extension');
      expect(metadata.state).toBe(ExtensionState.INSTALLED);
      expect(metadata.installPath).toBe('/path/to/extension');
      expect(metadata.installedAt).toBeDefined();
    });

    it('should emit registered event', async () => {
      const handler = jest.fn();
      registry.on(RegistryEvent.EXTENSION_REGISTERED, handler);
      
      await registry.register(baseManifest, '/path');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-extension' })
      );
    });

    it('should reject duplicate registration', async () => {
      await registry.register(baseManifest, '/path');
      
      await expect(
        registry.register(baseManifest, '/path')
      ).rejects.toThrow(RegistryError);
    });

    it('should reject invalid manifest', async () => {
      const invalid = { ...baseManifest, version: 'invalid' };
      
      await expect(
        registry.register(invalid as any, '/path')
      ).rejects.toThrow(RegistryError);
    });

    it('should reject incompatible platform version', async () => {
      const manifest = {
        ...baseManifest,
        engines: { 'agent-platform': '>=2.0.0' }
      };
      
      await expect(
        registry.register(manifest, '/path')
      ).rejects.toThrow('requires agent-platform');
    });

    it('should reject when max extensions exceeded', async () => {
      const limitedRegistry = new ExtensionRegistry({
        ...config,
        maxExtensions: 1
      });
      
      await limitedRegistry.register(baseManifest, '/path');
      
      const manifest2 = { ...baseManifest, id: 'extension-2' };
      await expect(
        limitedRegistry.register(manifest2, '/path')
      ).rejects.toThrow('Maximum number of extensions');
    });

    it('should reject disallowed permissions', async () => {
      const restrictedRegistry = new ExtensionRegistry({
        ...config,
        allowedPermissions: [Permission.STORAGE_LOCAL]
      });
      
      const manifest = {
        ...baseManifest,
        permissions: [Permission.NETWORK_HTTP]
      };
      
      await expect(
        restrictedRegistry.register(manifest, '/path')
      ).rejects.toThrow('disallowed permissions');
    });

    it('should allow permitted permissions', async () => {
      const restrictedRegistry = new ExtensionRegistry({
        ...config,
        allowedPermissions: [Permission.NETWORK_HTTP, Permission.STORAGE_LOCAL]
      });
      
      const manifest = {
        ...baseManifest,
        permissions: [Permission.NETWORK_HTTP]
      };
      
      const metadata = await restrictedRegistry.register(manifest, '/path');
      expect(metadata.permissions).toContain(Permission.NETWORK_HTTP);
    });

    it('should reject missing required dependency', async () => {
      const manifest = {
        ...baseManifest,
        dependencies: [
          { id: 'missing-dep', version: '1.0.0', optional: false }
        ]
      };
      
      await expect(
        registry.register(manifest, '/path')
      ).rejects.toThrow('not installed');
    });

    it('should allow missing optional dependency', async () => {
      const manifest = {
        ...baseManifest,
        dependencies: [
          { id: 'optional-dep', version: '1.0.0', optional: true }
        ]
      };
      
      const metadata = await registry.register(manifest, '/path');
      expect(metadata).toBeDefined();
    });

    it('should validate dependency version constraints', async () => {
      // Register dependency first
      const depManifest = { ...baseManifest, id: 'dep', version: '1.5.0' };
      await registry.register(depManifest, '/path');
      
      // Register extension with incompatible version constraint
      const manifest = {
        ...baseManifest,
        id: 'test-2',
        dependencies: [
          { id: 'dep', version: '>=2.0.0', optional: false }
        ]
      };
      
      await expect(
        registry.register(manifest, '/path')
      ).rejects.toThrow('does not satisfy');
    });

    it('should accept compatible dependency version', async () => {
      // Register dependency
      const depManifest = { ...baseManifest, id: 'dep', version: '1.5.0' };
      await registry.register(depManifest, '/path');
      
      // Register extension with compatible constraint
      const manifest = {
        ...baseManifest,
        id: 'test-2',
        dependencies: [
          { id: 'dep', version: '>=1.0.0', optional: false }
        ]
      };
      
      const metadata = await registry.register(manifest, '/path');
      expect(metadata).toBeDefined();
    });
  });

  describe('unregister', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path');
    });

    it('should unregister an extension', async () => {
      await registry.unregister('test-extension');
      
      expect(registry.has('test-extension')).toBe(false);
    });

    it('should emit unregistered event', async () => {
      const handler = jest.fn();
      registry.on(RegistryEvent.EXTENSION_UNREGISTERED, handler);
      
      await registry.unregister('test-extension');
      
      expect(handler).toHaveBeenCalled();
    });

    it('should reject unregistering non-existent extension', async () => {
      await expect(
        registry.unregister('non-existent')
      ).rejects.toThrow('not found');
    });

    it('should reject unregistering extension with dependents', async () => {
      const dependent = {
        ...baseManifest,
        id: 'dependent',
        dependencies: [
          { id: 'test-extension', version: '1.0.0', optional: false }
        ]
      };
      
      await registry.register(dependent, '/path');
      
      await expect(
        registry.unregister('test-extension')
      ).rejects.toThrow('required by');
    });
  });

  describe('enable', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path');
    });

    it('should enable an extension', async () => {
      await registry.enable('test-extension');
      
      const metadata = registry.get('test-extension');
      expect(metadata.state).toBe(ExtensionState.ENABLED);
    });

    it('should emit enabled event', async () => {
      const handler = jest.fn();
      registry.on(RegistryEvent.EXTENSION_ENABLED, handler);
      
      await registry.enable('test-extension');
      
      expect(handler).toHaveBeenCalled();
    });

    it('should emit state changed event', async () => {
      const handler = jest.fn();
      registry.on(RegistryEvent.EXTENSION_STATE_CHANGED, handler);
      
      await registry.enable('test-extension');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          oldState: ExtensionState.INSTALLED,
          newState: ExtensionState.ENABLED
        })
      );
    });

    it('should be idempotent for already enabled extension', async () => {
      await registry.enable('test-extension');
      await registry.enable('test-extension');
      
      const metadata = registry.get('test-extension');
      expect(metadata.state).toBe(ExtensionState.ENABLED);
    });

    it('should reject enabling extension in error state', async () => {
      registry.setError('test-extension', 'Test error');
      
      await expect(
        registry.enable('test-extension')
      ).rejects.toThrow('error state');
    });

    it('should reject enabling without required dependency', async () => {
      const depManifest = { ...baseManifest, id: 'dep' };
      await registry.register(depManifest, '/path');
      
      const manifest = {
        ...baseManifest,
        id: 'test-2',
        dependencies: [
          { id: 'dep', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(manifest, '/path');
      
      await expect(
        registry.enable('test-2')
      ).rejects.toThrow('not enabled');
    });

    it('should allow enabling with enabled dependency', async () => {
      const depManifest = { ...baseManifest, id: 'dep' };
      await registry.register(depManifest, '/path');
      await registry.enable('dep');
      
      const manifest = {
        ...baseManifest,
        id: 'test-2',
        dependencies: [
          { id: 'dep', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(manifest, '/path');
      
      await registry.enable('test-2');
      
      const metadata = registry.get('test-2');
      expect(metadata.state).toBe(ExtensionState.ENABLED);
    });
  });

  describe('disable', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path');
      await registry.enable('test-extension');
    });

    it('should disable an extension', async () => {
      await registry.disable('test-extension');
      
      const metadata = registry.get('test-extension');
      expect(metadata.state).toBe(ExtensionState.DISABLED);
    });

    it('should emit disabled event', async () => {
      const handler = jest.fn();
      registry.on(RegistryEvent.EXTENSION_DISABLED, handler);
      
      await registry.disable('test-extension');
      
      expect(handler).toHaveBeenCalled();
    });

    it('should be idempotent for already disabled extension', async () => {
      await registry.disable('test-extension');
      await registry.disable('test-extension');
      
      const metadata = registry.get('test-extension');
      expect(metadata.state).toBe(ExtensionState.DISABLED);
    });

    it('should reject disabling with enabled dependents', async () => {
      const dependent = {
        ...baseManifest,
        id: 'dependent',
        dependencies: [
          { id: 'test-extension', version: '1.0.0', optional: false }
        ]
      };
      
      await registry.register(dependent, '/path');
      await registry.enable('dependent');
      
      await expect(
        registry.disable('test-extension')
      ).rejects.toThrow('required by enabled extensions');
    });
  });

  describe('setError', () => {
    beforeEach(async () => {
      await registry.register(baseManifest, '/path');
    });

    it('should set extension to error state', () => {
      registry.setError('test-extension', 'Test error');
      
      const metadata = registry.get('test-extension');
      expect(metadata.state).toBe(ExtensionState.ERROR);
      expect(metadata.error).toBe('Test error');
    });

    it('should emit error event', () => {
      const handler = jest.fn();
      registry.on(RegistryEvent.EXTENSION_ERROR, handler);
      
      registry.setError('test-extension', 'Test error');
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return extension metadata', async () => {
      await registry.register(baseManifest, '/path');
      
      const metadata = registry.get('test-extension');
      expect(metadata.id).toBe('test-extension');
    });

    it('should throw if extension not found', () => {
      expect(() => registry.get('non-existent')).toThrow('not found');
    });
  });

  describe('has', () => {
    it('should return true for registered extension', async () => {
      await registry.register(baseManifest, '/path');
      
      expect(registry.has('test-extension')).toBe(true);
    });

    it('should return false for non-existent extension', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all extensions', async () => {
      await registry.register(baseManifest, '/path');
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path');
      
      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });

    it('should return empty array when no extensions', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getByState', () => {
    it('should return extensions by state', async () => {
      await registry.register(baseManifest, '/path');
      await registry.enable('test-extension');
      
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path');
      
      const enabled = registry.getByState(ExtensionState.ENABLED);
      const installed = registry.getByState(ExtensionState.INSTALLED);
      
      expect(enabled).toHaveLength(1);
      expect(installed).toHaveLength(1);
    });
  });

  describe('getByPermission', () => {
    it('should return extensions by permission', async () => {
      const manifest1 = {
        ...baseManifest,
        permissions: [Permission.NETWORK_HTTP]
      };
      await registry.register(manifest1, '/path');
      
      const manifest2 = {
        ...baseManifest,
        id: 'ext-2',
        permissions: [Permission.FS_READ]
      };
      await registry.register(manifest2, '/path');
      
      const httpExts = registry.getByPermission(Permission.NETWORK_HTTP);
      expect(httpExts).toHaveLength(1);
      expect(httpExts[0].id).toBe('test-extension');
    });
  });

  describe('getEnabled', () => {
    it('should return only enabled extensions', async () => {
      await registry.register(baseManifest, '/path');
      await registry.enable('test-extension');
      
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path');
      
      const enabled = registry.getEnabled();
      expect(enabled).toHaveLength(1);
      expect(enabled[0].id).toBe('test-extension');
    });
  });

  describe('getDependents', () => {
    it('should return extensions that depend on given extension', async () => {
      await registry.register(baseManifest, '/path');
      
      const dependent = {
        ...baseManifest,
        id: 'dependent',
        dependencies: [
          { id: 'test-extension', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(dependent, '/path');
      
      const dependents = registry.getDependents('test-extension');
      expect(dependents).toContain('dependent');
    });

    it('should return empty array when no dependents', async () => {
      await registry.register(baseManifest, '/path');
      
      const dependents = registry.getDependents('test-extension');
      expect(dependents).toEqual([]);
    });
  });

  describe('getDependencies', () => {
    it('should return all dependencies recursively', async () => {
      const dep1 = { ...baseManifest, id: 'dep-1' };
      await registry.register(dep1, '/path');
      
      const dep2 = {
        ...baseManifest,
        id: 'dep-2',
        dependencies: [
          { id: 'dep-1', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(dep2, '/path');
      
      const manifest = {
        ...baseManifest,
        id: 'main',
        dependencies: [
          { id: 'dep-2', version: '1.0.0', optional: false }
        ]
      };
      await registry.register(manifest, '/path');
      
      const deps = registry.getDependencies('main');
      expect(deps).toContain('dep-2');
      expect(deps).toContain('dep-1');
    });

    it('should exclude optional dependencies by default', async () => {
      const dep1 = { ...baseManifest, id: 'dep-1' };
      await registry.register(dep1, '/path');
      
      const manifest = {
        ...baseManifest,
        id: 'main',
        dependencies: [
          { id: 'dep-1', version: '1.0.0', optional: true }
        ]
      };
      await registry.register(manifest, '/path');
      
      const deps = registry.getDependencies('main', false);
      expect(deps).not.toContain('dep-1');
    });

    it('should include optional dependencies when requested', async () => {
      const dep1 = { ...baseManifest, id: 'dep-1' };
      await registry.register(dep1, '/path');
      
      const manifest = {
        ...baseManifest,
        id: 'main',
        dependencies: [
          { id: 'dep-1', version: '1.0.0', optional: true }
        ]
      };
      await registry.register(manifest, '/path');
      
      const deps = registry.getDependencies('main', true);
      expect(deps).toContain('dep-1');
    });
  });

  describe('clear', () => {
    it('should remove all extensions', async () => {
      await registry.register(baseManifest, '/path');
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path');
      
      registry.clear();
      
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', async () => {
      await registry.register(baseManifest, '/path');
      await registry.enable('test-extension');
      
      const manifest2 = { ...baseManifest, id: 'ext-2' };
      await registry.register(manifest2, '/path');
      
      registry.setError('ext-2', 'Test error');
      
      const stats = registry.getStats();
      
      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(1);
      expect(stats.errors).toBe(1);
      expect(stats.byState[ExtensionState.ENABLED]).toBe(1);
      expect(stats.byState[ExtensionState.ERROR]).toBe(1);
    });
  });
});

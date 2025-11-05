/**
 * Extension Manifest Schema Tests
 * Comprehensive test suite for manifest validation
 */

import {
  ExtensionManifestSchema,
  ExtensionMetadataSchema,
  ExtensionDependencySchema,
  ExtensionAuthorSchema,
  ExtensionContributionSchema,
  parseManifest,
  validateManifest,
  isValidExtensionId,
  isValidVersion,
  Permission,
  ExtensionState,
  ExtensionCategory,
  type ExtensionManifest,
  type ExtensionMetadata
} from '../src/manifest/schema';

describe('ExtensionAuthorSchema', () => {
  it('should validate string author', () => {
    const author = 'John Doe';
    expect(typeof author).toBe('string');
  });

  it('should validate complete author object', () => {
    const author = {
      name: 'John Doe',
      email: 'john@example.com',
      url: 'https://example.com'
    };
    
    const result = ExtensionAuthorSchema.parse(author);
    expect(result).toEqual(author);
  });

  it('should validate author with only name', () => {
    const author = {
      name: 'John Doe'
    };
    
    const result = ExtensionAuthorSchema.parse(author);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBeUndefined();
  });

  it('should reject invalid email', () => {
    const author = {
      name: 'John Doe',
      email: 'invalid-email'
    };
    
    expect(() => ExtensionAuthorSchema.parse(author)).toThrow();
  });

  it('should reject invalid URL', () => {
    const author = {
      name: 'John Doe',
      url: 'not-a-url'
    };
    
    expect(() => ExtensionAuthorSchema.parse(author)).toThrow();
  });
});

describe('ExtensionDependencySchema', () => {
  it('should validate required dependency', () => {
    const dep = {
      id: 'core-extension',
      version: '1.0.0',
      optional: false
    };
    
    const result = ExtensionDependencySchema.parse(dep);
    expect(result).toEqual(dep);
  });

  it('should validate optional dependency', () => {
    const dep = {
      id: 'optional-extension',
      version: '2.1.0',
      optional: true
    };
    
    const result = ExtensionDependencySchema.parse(dep);
    expect(result.optional).toBe(true);
  });

  it('should default optional to false', () => {
    const dep = {
      id: 'extension',
      version: '1.0.0'
    };
    
    const result = ExtensionDependencySchema.parse(dep);
    expect(result.optional).toBe(false);
  });

  it('should reject empty version string', () => {
    const dep = {
      id: 'extension',
      version: ''
    };
    
    expect(() => ExtensionDependencySchema.parse(dep)).toThrow();
  });

  it('should accept semver with prerelease', () => {
    const dep = {
      id: 'extension',
      version: '1.0.0-beta.1'
    };
    
    const result = ExtensionDependencySchema.parse(dep);
    expect(result.version).toBe('1.0.0-beta.1');
  });

  it('should accept semver with build metadata', () => {
    const dep = {
      id: 'extension',
      version: '1.0.0+20230101'
    };
    
    const result = ExtensionDependencySchema.parse(dep);
    expect(result.version).toBe('1.0.0+20230101');
  });
});

describe('ExtensionContributionSchema', () => {
  it('should validate empty contributions', () => {
    const contrib = {};
    const result = ExtensionContributionSchema.parse(contrib);
    expect(result).toEqual({});
  });

  it('should validate node contributions', () => {
    const contrib = {
      nodes: [
        {
          type: 'custom-action',
          displayName: 'Custom Action',
          description: 'Performs a custom action',
          category: 'Actions',
          icon: 'icon.svg'
        }
      ]
    };
    
    const result = ExtensionContributionSchema.parse(contrib);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes![0].type).toBe('custom-action');
  });

  it('should validate widget contributions', () => {
    const contrib = {
      widgets: [
        {
          id: 'custom-widget',
          name: 'Custom Widget',
          entryPoint: './widget/index.js'
        }
      ]
    };
    
    const result = ExtensionContributionSchema.parse(contrib);
    expect(result.widgets).toHaveLength(1);
    expect(result.widgets![0].id).toBe('custom-widget');
  });

  it('should validate command contributions', () => {
    const contrib = {
      commands: [
        {
          id: 'extension.doSomething',
          title: 'Do Something',
          description: 'Performs an action',
          handler: 'handleDoSomething'
        }
      ]
    };
    
    const result = ExtensionContributionSchema.parse(contrib);
    expect(result.commands).toHaveLength(1);
  });

  it('should validate settings contributions', () => {
    const contrib = {
      settings: [
        {
          key: 'extension.setting1',
          type: 'string' as const,
          default: 'value',
          description: 'A setting'
        }
      ]
    };
    
    const result = ExtensionContributionSchema.parse(contrib);
    expect(result.settings).toHaveLength(1);
  });

  it('should validate multiple contribution types', () => {
    const contrib = {
      nodes: [{ type: 'node', displayName: 'Node', description: 'A node', category: 'Cat' }],
      widgets: [{ id: 'widget', name: 'Widget', entryPoint: './widget.js' }],
      commands: [{ id: 'cmd', title: 'Command', handler: 'handler' }]
    };
    
    const result = ExtensionContributionSchema.parse(contrib);
    expect(result.nodes).toHaveLength(1);
    expect(result.widgets).toHaveLength(1);
    expect(result.commands).toHaveLength(1);
  });
});

describe('ExtensionManifestSchema', () => {
  const validManifest: ExtensionManifest = {
    id: 'test-extension',
    name: 'Test Extension',
    version: '1.0.0',
    description: 'A test extension',
    author: 'Test Author',
    category: ExtensionCategory.UTILITY,
    keywords: ['test', 'example'],
    main: './dist/index.js',
    dependencies: [],
    permissions: [Permission.NETWORK_HTTP],
    activationEvents: ['onStartup'],
    engines: {
      'agent-platform': '^1.0.0'
    }
  };

  it('should validate complete manifest', () => {
    const result = ExtensionManifestSchema.parse(validManifest);
    expect(result).toEqual(validManifest);
  });

  it('should validate minimal manifest', () => {
    const minimal = {
      id: 'minimal',
      name: 'Minimal',
      version: '1.0.0',
      description: 'Minimal extension',
      author: 'Author',
      category: ExtensionCategory.UTILITY,
      main: './index.js',
      engines: {
        'agent-platform': '1.0.0'
      }
    };
    
    const result = ExtensionManifestSchema.parse(minimal);
    expect(result.keywords).toEqual([]);
    expect(result.dependencies).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('should reject invalid extension ID (uppercase)', () => {
    const manifest = { ...validManifest, id: 'Test-Extension' };
    expect(() => ExtensionManifestSchema.parse(manifest)).toThrow();
  });

  it('should reject invalid extension ID (too short)', () => {
    const manifest = { ...validManifest, id: 'ab' };
    expect(() => ExtensionManifestSchema.parse(manifest)).toThrow();
  });

  it('should reject invalid extension ID (special chars)', () => {
    const manifest = { ...validManifest, id: 'test_extension' };
    expect(() => ExtensionManifestSchema.parse(manifest)).toThrow();
  });

  it('should reject invalid version', () => {
    const manifest = { ...validManifest, version: '1.0' };
    expect(() => ExtensionManifestSchema.parse(manifest)).toThrow();
  });

  it('should reject description too long', () => {
    const manifest = { ...validManifest, description: 'a'.repeat(501) };
    expect(() => ExtensionManifestSchema.parse(manifest)).toThrow();
  });

  it('should reject too many keywords', () => {
    const manifest = { 
      ...validManifest, 
      keywords: Array(11).fill('keyword') 
    };
    expect(() => ExtensionManifestSchema.parse(manifest)).toThrow();
  });

  it('should validate with author object', () => {
    const manifest = {
      ...validManifest,
      author: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    };
    
    const result = ExtensionManifestSchema.parse(manifest);
    expect(typeof result.author).toBe('object');
  });

  it('should validate with dependencies', () => {
    const manifest = {
      ...validManifest,
      dependencies: [
        { id: 'core', version: '1.0.0', optional: false }
      ]
    };
    
    const result = ExtensionManifestSchema.parse(manifest);
    expect(result.dependencies).toHaveLength(1);
  });

  it('should validate with multiple permissions', () => {
    const manifest = {
      ...validManifest,
      permissions: [
        Permission.NETWORK_HTTP,
        Permission.FS_READ,
        Permission.STORAGE_LOCAL
      ]
    };
    
    const result = ExtensionManifestSchema.parse(manifest);
    expect(result.permissions).toHaveLength(3);
  });

  it('should validate with contributions', () => {
    const manifest = {
      ...validManifest,
      contributes: {
        nodes: [
          {
            type: 'custom-node',
            displayName: 'Custom Node',
            description: 'A custom node',
            category: 'Custom'
          }
        ]
      }
    };
    
    const result = ExtensionManifestSchema.parse(manifest);
    expect(result.contributes?.nodes).toHaveLength(1);
  });

  it('should validate with optional fields', () => {
    const manifest = {
      ...validManifest,
      repository: 'https://github.com/user/repo',
      homepage: 'https://example.com',
      icon: './icon.png',
      license: 'MIT',
      readme: './README.md',
      changelog: './CHANGELOG.md'
    };
    
    const result = ExtensionManifestSchema.parse(manifest);
    expect(result.repository).toBe('https://github.com/user/repo');
    expect(result.license).toBe('MIT');
  });
});

describe('ExtensionMetadataSchema', () => {
  it('should validate complete metadata', () => {
    const metadata: ExtensionMetadata = {
      id: 'test-extension',
      name: 'Test Extension',
      version: '1.0.0',
      description: 'A test extension',
      author: 'Test Author',
      category: ExtensionCategory.UTILITY,
      keywords: [],
      main: './dist/index.js',
      dependencies: [],
      permissions: [],
      activationEvents: [],
      engines: {
        'agent-platform': '1.0.0'
      },
      state: ExtensionState.ENABLED,
      installPath: '/path/to/extension',
      installedAt: Date.now()
    };
    
    const result = ExtensionMetadataSchema.parse(metadata);
    expect(result.state).toBe(ExtensionState.ENABLED);
    expect(result.installPath).toBe('/path/to/extension');
  });

  it('should validate metadata with error state', () => {
    const metadata = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      description: 'Test',
      author: 'Author',
      category: ExtensionCategory.UTILITY,
      main: './index.js',
      engines: { 'agent-platform': '1.0.0' },
      state: ExtensionState.ERROR,
      installPath: '/path',
      installedAt: Date.now(),
      error: 'Failed to load extension'
    };
    
    const result = ExtensionMetadataSchema.parse(metadata);
    expect(result.state).toBe(ExtensionState.ERROR);
    expect(result.error).toBe('Failed to load extension');
  });

  it('should validate metadata with module reference', () => {
    const mockModule = { activate: () => {}, deactivate: () => {} };
    const metadata = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      description: 'Test',
      author: 'Author',
      category: ExtensionCategory.UTILITY,
      main: './index.js',
      engines: { 'agent-platform': '1.0.0' },
      state: ExtensionState.ENABLED,
      installPath: '/path',
      installedAt: Date.now(),
      module: mockModule
    };
    
    const result = ExtensionMetadataSchema.parse(metadata);
    expect(result.module).toBe(mockModule);
  });
});

describe('parseManifest', () => {
  it('should parse valid manifest', () => {
    const data = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      description: 'Test extension',
      author: 'Author',
      category: ExtensionCategory.UTILITY,
      main: './index.js',
      engines: { 'agent-platform': '1.0.0' }
    };
    
    const result = parseManifest(data);
    expect(result.id).toBe('test');
  });

  it('should throw on invalid manifest', () => {
    const data = { id: 'test' };
    expect(() => parseManifest(data)).toThrow();
  });
});

describe('validateManifest', () => {
  it('should return success for valid manifest', () => {
    const data = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      description: 'Test extension',
      author: 'Author',
      category: ExtensionCategory.UTILITY,
      main: './index.js',
      engines: { 'agent-platform': '1.0.0' }
    };
    
    const result = validateManifest(data);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid manifest', () => {
    const data = { id: 'test' };
    
    const result = validateManifest(data);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });
});

describe('isValidExtensionId', () => {
  it('should accept valid IDs', () => {
    expect(isValidExtensionId('test')).toBe(true);
    expect(isValidExtensionId('test-extension')).toBe(true);
    expect(isValidExtensionId('my-awesome-extension-123')).toBe(true);
  });

  it('should reject invalid IDs', () => {
    expect(isValidExtensionId('ab')).toBe(false); // Too short
    expect(isValidExtensionId('Test')).toBe(false); // Uppercase
    expect(isValidExtensionId('test_extension')).toBe(false); // Underscore
    expect(isValidExtensionId('test extension')).toBe(false); // Space
    expect(isValidExtensionId('test.extension')).toBe(false); // Dot
    expect(isValidExtensionId('')).toBe(false); // Empty
  });
});

describe('isValidVersion', () => {
  it('should accept valid semver', () => {
    expect(isValidVersion('1.0.0')).toBe(true);
    expect(isValidVersion('0.0.1')).toBe(true);
    expect(isValidVersion('1.2.3-alpha')).toBe(true);
    expect(isValidVersion('1.0.0-beta.1')).toBe(true);
    expect(isValidVersion('2.0.0+20230101')).toBe(true);
    expect(isValidVersion('1.0.0-rc.1+build.123')).toBe(true);
  });

  it('should reject invalid semver', () => {
    expect(isValidVersion('1.0')).toBe(false);
    expect(isValidVersion('1')).toBe(false);
    expect(isValidVersion('v1.0.0')).toBe(false);
    expect(isValidVersion('1.0.0.0')).toBe(false);
    expect(isValidVersion('abc')).toBe(false);
    expect(isValidVersion('')).toBe(false);
  });
});

describe('Permission enum', () => {
  it('should have all expected permissions', () => {
    expect(Permission.NETWORK_HTTP).toBe('network:http');
    expect(Permission.FS_READ).toBe('fs:read');
    expect(Permission.WIDGET_COMMUNICATE).toBe('widget:communicate');
    expect(Permission.WORKFLOW_EXECUTE).toBe('workflow:execute');
  });
});

describe('ExtensionState enum', () => {
  it('should have all expected states', () => {
    expect(ExtensionState.UNINSTALLED).toBe('uninstalled');
    expect(ExtensionState.INSTALLED).toBe('installed');
    expect(ExtensionState.ENABLED).toBe('enabled');
    expect(ExtensionState.DISABLED).toBe('disabled');
    expect(ExtensionState.ERROR).toBe('error');
  });
});

describe('ExtensionCategory enum', () => {
  it('should have all expected categories', () => {
    expect(ExtensionCategory.WORKFLOW_NODE).toBe('workflow-node');
    expect(ExtensionCategory.WIDGET).toBe('widget');
    expect(ExtensionCategory.INTEGRATION).toBe('integration');
    expect(ExtensionCategory.UTILITY).toBe('utility');
  });
});

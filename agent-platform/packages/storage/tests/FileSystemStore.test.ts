import { FileSystemStore } from '../src/FileSystemStore.js';
import {
  ComponentType,
  StorageLocation,
  ComponentVisibility,
  AgentContent,
} from '../src/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileSystemStore', () => {
  let store: FileSystemStore;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(__dirname, `test-storage-${Date.now()}`);
    store = new FileSystemStore(testDir);
    await store.initialize();
  });

  afterEach(async () => {
    // Cleanup
    await store.dispose();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should create directory structure', async () => {
      const platformPath = path.join(testDir, 'platform', 'agents');
      const userPath = path.join(testDir, 'user', 'agents');

      const platformExists = await fs
        .access(platformPath)
        .then(() => true)
        .catch(() => false);
      const userExists = await fs
        .access(userPath)
        .then(() => true)
        .catch(() => false);

      expect(platformExists).toBe(true);
      expect(userExists).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new agent component', async () => {
      const agentContent: AgentContent = {
        name: 'Test Agent',
        description: 'A test agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'You are a helpful assistant',
      };

      const result = await store.create({
        type: ComponentType.AGENT,
        name: 'Test Agent',
        description: 'A test agent',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {
          tags: ['test'],
          category: 'testing',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();
      expect(result.data?.version).toBe(1);
      expect(result.data?.name).toBe('Test Agent');
    });

    it('should save component to file', async () => {
      const agentContent: AgentContent = {
        name: 'File Test Agent',
        description: 'Testing file save',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test prompt',
      };

      const result = await store.create({
        type: ComponentType.AGENT,
        name: 'File Test Agent',
        description: 'Testing file save',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      expect(result.success).toBe(true);

      const filePath = path.join(testDir, result.data!.storagePath!);
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);

      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      expect(parsed.id).toBe(result.data!.id);
    });

    it('should generate unique IDs', async () => {
      const agentContent: AgentContent = {
        name: 'Agent 1',
        description: 'First agent',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const result1 = await store.create({
        type: ComponentType.AGENT,
        name: 'Same Name',
        description: 'First',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const result2 = await store.create({
        type: ComponentType.AGENT,
        name: 'Same Name',
        description: 'Second',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      expect(result1.data!.id).not.toBe(result2.data!.id);
    });
  });

  describe('read', () => {
    it('should read existing component', async () => {
      const agentContent: AgentContent = {
        name: 'Read Test',
        description: 'Testing read',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Read Test',
        description: 'Testing read',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const component = await store.read(createResult.data!.id);

      expect(component).toBeDefined();
      expect(component!.id).toBe(createResult.data!.id);
      expect(component!.name).toBe('Read Test');
    });

    it('should return null for non-existent component', async () => {
      const component = await store.read('non-existent-id');
      expect(component).toBeNull();
    });

    it('should read specific version', async () => {
      const agentContent: AgentContent = {
        name: 'Version Test',
        description: 'Original',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Version Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      await store.update(createResult.data!.id, {
        description: 'Updated',
      });

      const v1 = await store.read(createResult.data!.id, 1);
      const v2 = await store.read(createResult.data!.id, 2);

      expect(v1?.description).toBe('Original');
      expect(v2?.description).toBe('Updated');
    });
  });

  describe('update', () => {
    it('should update component', async () => {
      const agentContent: AgentContent = {
        name: 'Update Test',
        description: 'Original',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Update Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const updateResult = await store.update(createResult.data!.id, {
        description: 'Updated description',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.description).toBe('Updated description');
      expect(updateResult.data?.version).toBe(2);
    });

    it('should increment version on update', async () => {
      const agentContent: AgentContent = {
        name: 'Version Inc Test',
        description: 'Original',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Version Inc Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      await store.update(createResult.data!.id, { description: 'Update 1' });
      await store.update(createResult.data!.id, { description: 'Update 2' });
      const final = await store.update(createResult.data!.id, { description: 'Update 3' });

      expect(final.data?.version).toBe(4);
    });

    it('should maintain version history', async () => {
      const agentContent: AgentContent = {
        name: 'History Test',
        description: 'Original',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'History Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      await store.update(createResult.data!.id, { description: 'Update 1' });
      await store.update(createResult.data!.id, { description: 'Update 2' });

      const versions = await store.getVersions(createResult.data!.id);
      expect(versions.length).toBe(3);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(3);
    });

    it('should return error for non-existent component', async () => {
      const result = await store.update('non-existent', { description: 'Update' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('delete', () => {
    it('should soft delete by default', async () => {
      const agentContent: AgentContent = {
        name: 'Delete Test',
        description: 'To be deleted',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Delete Test',
        description: 'To be deleted',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const deleteResult = await store.delete(createResult.data!.id);
      expect(deleteResult.success).toBe(true);

      const component = await store.read(createResult.data!.id);
      expect(component).toBeDefined();
      expect((component!.metadata as any).deleted).toBe(true);
    });

    it('should permanently delete when specified', async () => {
      const agentContent: AgentContent = {
        name: 'Permanent Delete Test',
        description: 'To be permanently deleted',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Permanent Delete Test',
        description: 'To be permanently deleted',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const deleteResult = await store.delete(createResult.data!.id, true);
      expect(deleteResult.success).toBe(true);

      const component = await store.read(createResult.data!.id);
      expect(component).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create test components
      for (let i = 0; i < 5; i++) {
        const agentContent: AgentContent = {
          name: `Agent ${i}`,
          description: `Test agent ${i}`,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        };

        await store.create({
          type: ComponentType.AGENT,
          name: `Agent ${i}`,
          description: `Test agent ${i}`,
          storageLocation: StorageLocation.USER,
          visibility: ComponentVisibility.PUBLIC,
          content: agentContent,
          metadata: {
            tags: i % 2 === 0 ? ['even'] : ['odd'],
            category: 'test',
          },
        });
      }
    });

    it('should list all components', async () => {
      const result = await store.list();
      expect(result.components.length).toBe(5);
      expect(result.total).toBe(5);
    });

    it('should filter by type', async () => {
      const result = await store.list({ type: ComponentType.AGENT });
      expect(result.components.length).toBe(5);
    });

    it('should filter by tags', async () => {
      const result = await store.list({ tags: ['even'] });
      expect(result.components.length).toBe(3);
    });

    it('should support pagination', async () => {
      const page1 = await store.list({ limit: 2, offset: 0 });
      const page2 = await store.list({ limit: 2, offset: 2 });

      expect(page1.components.length).toBe(2);
      expect(page2.components.length).toBe(2);
      expect(page1.components[0].id).not.toBe(page2.components[0].id);
    });

    it('should support sorting', async () => {
      const asc = await store.list({ sortBy: 'name', sortOrder: 'asc' });
      const desc = await store.list({ sortBy: 'name', sortOrder: 'desc' });

      expect(asc.components[0].name).toBe('Agent 0');
      expect(desc.components[0].name).toBe('Agent 4');
    });

    it('should filter out soft-deleted components', async () => {
      const components = await store.list();
      const firstId = components.components[0].id;

      await store.delete(firstId);

      const afterDelete = await store.list();
      expect(afterDelete.components.length).toBe(4);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const agentContent: AgentContent = {
        name: 'Research Agent',
        description: 'An agent for research tasks',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      await store.create({
        type: ComponentType.AGENT,
        name: 'Research Agent',
        description: 'An agent for research tasks',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const codeContent: AgentContent = {
        name: 'Code Agent',
        description: 'An agent for coding tasks',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      await store.create({
        type: ComponentType.AGENT,
        name: 'Code Agent',
        description: 'An agent for coding tasks',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: codeContent,
        metadata: {},
      });
    });

    it('should search by name', async () => {
      const result = await store.search('Research');
      expect(result.components.length).toBe(1);
      expect(result.components[0].name).toBe('Research Agent');
    });

    it('should search by description', async () => {
      const result = await store.search('coding');
      expect(result.components.length).toBe(1);
      expect(result.components[0].name).toBe('Code Agent');
    });

    it('should be case-insensitive', async () => {
      const result = await store.search('RESEARCH');
      expect(result.components.length).toBe(1);
    });
  });

  describe('dependencies', () => {
    it('should track dependencies', async () => {
      const skillContent = {
        name: 'Test Skill',
        description: 'A test skill',
        toolkits: ['toolkit-1', 'toolkit-2'],
        instructions: {
          overview: 'Test skill',
          usage: 'Use this skill',
        },
        rules: [],
      };

      const createResult = await store.create({
        type: ComponentType.SKILL,
        name: 'Test Skill',
        description: 'A test skill',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: skillContent,
        metadata: {},
        dependencies: ['dep-1', 'dep-2'],
      });

      const deps = await store.getDependencies(createResult.data!.id);
      expect(deps).toContain('dep-1');
      expect(deps).toContain('dep-2');
      expect(deps).toContain('toolkit-1');
      expect(deps).toContain('toolkit-2');
    });

    it('should find dependents', async () => {
      const agentContent: AgentContent = {
        name: 'Dependent Agent',
        description: 'Uses skills',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
        skills: ['skill-1'],
      };

      const agent = await store.create({
        type: ComponentType.AGENT,
        name: 'Dependent Agent',
        description: 'Uses skills',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const dependents = await store.getDependents('skill-1');
      expect(dependents).toContain(agent.data!.id);
    });
  });

  describe('export/import', () => {
    it('should export components', async () => {
      const agentContent: AgentContent = {
        name: 'Export Test',
        description: 'Test export',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      await store.create({
        type: ComponentType.AGENT,
        name: 'Export Test',
        description: 'Test export',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const exportData = await store.export();
      expect(exportData.components.length).toBeGreaterThan(0);
      expect(exportData.version).toBe('1.0.0');
      expect(exportData.exportDate).toBeDefined();
    });

    it('should import components', async () => {
      const agentContent: AgentContent = {
        name: 'Import Test',
        description: 'Test import',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      const component = await store.create({
        type: ComponentType.AGENT,
        name: 'Import Test',
        description: 'Test import',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const exportData = await store.export([component.data!.id]);

      // Clear store
      await store.clear('CONFIRM_CLEAR_ALL_COMPONENTS');

      // Import back
      const importResult = await store.import(exportData);
      expect(importResult.success).toBe(true);
      expect(importResult.data).toContain(component.data!.id);

      const imported = await store.read(component.data!.id);
      expect(imported?.name).toBe('Import Test');
    });
  });

  describe('stats', () => {
    it('should provide storage statistics', async () => {
      const agentContent: AgentContent = {
        name: 'Stats Test',
        description: 'Test stats',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        systemPrompt: 'Test',
      };

      await store.create({
        type: ComponentType.AGENT,
        name: 'Stats Test',
        description: 'Test stats',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: agentContent,
        metadata: {},
      });

      const stats = await store.getStats();
      expect(stats.totalComponents).toBeGreaterThan(0);
      expect(stats.componentsByType[ComponentType.AGENT]).toBeGreaterThan(0);
      expect(stats.componentsByLocation[StorageLocation.USER]).toBeGreaterThan(0);
    });
  });
});

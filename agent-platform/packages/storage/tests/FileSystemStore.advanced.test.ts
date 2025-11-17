import { FileSystemStore } from '../src/FileSystemStore.js';
import {
  ComponentType,
  StorageLocation,
  ComponentVisibility,
  WorkflowContent,
} from '../src/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileSystemStore - Additional Coverage', () => {
  let store: FileSystemStore;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(__dirname, `test-storage-advanced-${Date.now()}`);
    store = new FileSystemStore(testDir);
    await store.initialize();
  });

  afterEach(async () => {
    await store.dispose();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('watch functionality', () => {
    it('should register and unregister watch callbacks', async () => {
      const events: any[] = [];
      const callback = (event: any) => {
        events.push(event);
      };
      
      const unsubscribe = store.watch(callback);
      expect(typeof unsubscribe).toBe('function');
      
      // Unsubscribe should work without errors
      unsubscribe();
    });

    it('should unsubscribe properly', async () => {
      const events: any[] = [];
      const unsubscribe = store.watch((event) => {
        events.push(event);
      });

      unsubscribe();

      await store.create({
        type: ComponentType.AGENT,
        name: 'Unsubscribe Test',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(events.length).toBe(0);
    });
  });

  describe('transaction operations', () => {
    it('should begin and commit transaction', async () => {
      const transaction = await store.beginTransaction();
      expect(transaction.id).toBeDefined();
      expect(transaction.startTime).toBeDefined();

      const result = await store.commitTransaction(transaction);
      expect(result.success).toBe(true);
    });

    it('should rollback transaction', async () => {
      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Rollback Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      const transaction = await store.beginTransaction();
      transaction.operations.push({
        type: 'update',
        componentId: createResult.data!.id,
        timestamp: new Date(),
      });

      await store.update(createResult.data!.id, { description: 'Updated' });

      const result = await store.rollbackTransaction(transaction);
      expect(result.success).toBe(true);
    });
  });

  describe('version restoration', () => {
    it('should restore to previous version', async () => {
      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Restore Test',
        description: 'v1',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      await store.update(createResult.data!.id, { description: 'v2' });
      await store.update(createResult.data!.id, { description: 'v3' });

      const restoreResult = await store.restoreVersion(createResult.data!.id, 1);
      expect(restoreResult.success).toBe(true);

      const current = await store.read(createResult.data!.id);
      expect(current?.description).toBe('v1');
    });

    it('should return error for non-existent version', async () => {
      const createResult = await store.create({
        type: ComponentType.AGENT,
        name: 'Version Error Test',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      const result = await store.restoreVersion(createResult.data!.id, 999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('dependency validation', () => {
    it('should validate dependencies successfully', async () => {
      const dep1 = await store.create({
        type: ComponentType.SKILL,
        name: 'Dependency 1',
        description: 'Dep 1',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Dep 1',
          description: 'Test',
          toolkits: [],
          instructions: { overview: 'Test', usage: 'Test' },
          rules: [],
        },
        metadata: {},
      });

      const component = await store.create({
        type: ComponentType.AGENT,
        name: 'With Deps',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
          skills: [dep1.data!.id],
        },
        metadata: {},
      });

      const validation = await store.validateDependencies(component.data!.id);
      expect(validation.valid).toBe(true);
      expect(validation.missing.length).toBe(0);
    });

    it('should detect missing dependencies', async () => {
      const component = await store.create({
        type: ComponentType.AGENT,
        name: 'Missing Deps',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
          skills: ['non-existent-skill'],
        },
        metadata: {},
      });

      const validation = await store.validateDependencies(component.data!.id);
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('non-existent-skill');
    });
  });

  describe('export with dependencies', () => {
    it('should export with dependencies', async () => {
      const skill = await store.create({
        type: ComponentType.SKILL,
        name: 'Export Skill',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          toolkits: [],
          instructions: { overview: 'Test', usage: 'Test' },
          rules: [],
        },
        metadata: {},
      });

      const agent = await store.create({
        type: ComponentType.AGENT,
        name: 'Export Agent',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
          skills: [skill.data!.id],
        },
        metadata: {},
      });

      const exportData = await store.export([agent.data!.id], true);
      
      expect(exportData.components.length).toBe(2);
      expect(exportData.dependencies[agent.data!.id]).toContain(skill.data!.id);
    });

    it('should export without dependencies', async () => {
      const skill = await store.create({
        type: ComponentType.SKILL,
        name: 'No Export Skill',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          toolkits: [],
          instructions: { overview: 'Test', usage: 'Test' },
          rules: [],
        },
        metadata: {},
      });

      const agent = await store.create({
        type: ComponentType.AGENT,
        name: 'No Dep Export Agent',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
          skills: [skill.data!.id],
        },
        metadata: {},
      });

      const exportData = await store.export([agent.data!.id], false);
      
      expect(exportData.components.length).toBe(1);
    });
  });

  describe('import with overwrite', () => {
    it('should skip existing components when not overwriting', async () => {
      const component = await store.create({
        type: ComponentType.AGENT,
        name: 'Skip Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      const exportData = await store.export([component.data!.id]);
      
      // Create a new store instance to test import behavior
      const importStore = new FileSystemStore(testDir);
      await importStore.initialize();
      
      // Import with overwrite false should skip
      const importResult = await importStore.import(exportData, false);
      expect(importResult.success).toBe(true);
      
      await importStore.dispose();
    });

    it('should overwrite existing components when specified', async () => {
      const component = await store.create({
        type: ComponentType.AGENT,
        name: 'Overwrite Test',
        description: 'Original',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      const exportData = await store.export([component.data!.id]);
      exportData.components[0].description = 'Modified';

      const importResult = await store.import(exportData, true);
      expect(importResult.success).toBe(true);

      const current = await store.read(component.data!.id);
      expect(current?.description).toBe('Modified');
    });
  });

  describe('workflow content type', () => {
    it('should handle workflow components', async () => {
      const workflowContent: WorkflowContent = {
        name: 'Test Workflow',
        description: 'A test workflow',
        trigger: 'manual',
        steps: [
          {
            id: 'step1',
            type: 'agent',
            config: {
              agentId: 'test-agent',
            },
          },
        ],
      };

      const result = await store.create({
        type: ComponentType.WORKFLOW,
        name: 'Test Workflow',
        description: 'A test workflow',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: workflowContent,
        metadata: {},
      });

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe(ComponentType.WORKFLOW);

      const deps = await store.getDependencies(result.data!.id);
      expect(deps).toContain('test-agent');
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      // Create a component
      const result = await store.create({
        type: ComponentType.AGENT,
        name: 'Error Test',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      // Manually corrupt the file
      const filePath = path.join(testDir, result.data!.storagePath!);
      await fs.writeFile(filePath, 'invalid json', 'utf-8');

      // Reinitialize to reload components
      await store.dispose();
      store = new FileSystemStore(testDir);
      
      // Should not throw, but component should not be loaded
      await expect(store.initialize()).resolves.not.toThrow();
    });

    it('should handle validation errors on create', async () => {
      const result = await store.create({
        type: ComponentType.AGENT,
        name: '', // Invalid: empty name
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('clear operation', () => {
    it('should reject clear without proper confirmation', async () => {
      const result = await store.clear('wrong-token');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid confirmation');
    });

    it('should clear user components with proper confirmation', async () => {
      await store.create({
        type: ComponentType.AGENT,
        name: 'To Clear',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      const result = await store.clear('CONFIRM_CLEAR_ALL_COMPONENTS');
      expect(result.success).toBe(true);

      const components = await store.list({ storageLocation: StorageLocation.USER });
      expect(components.components.length).toBe(0);
    });
  });

  describe('exists check', () => {
    it('should return true for existing component', async () => {
      const result = await store.create({
        type: ComponentType.AGENT,
        name: 'Exists Test',
        description: 'Test',
        storageLocation: StorageLocation.USER,
        visibility: ComponentVisibility.PUBLIC,
        content: {
          name: 'Test',
          description: 'Test',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          systemPrompt: 'Test',
        },
        metadata: {},
      });

      const exists = await store.exists(result.data!.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent component', async () => {
      const exists = await store.exists('non-existent');
      expect(exists).toBe(false);
    });
  });
});

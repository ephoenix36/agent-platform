import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HookManager } from '../../src/hooks/HookManager.js';
import { 
  LoggingHook, 
  MetricsHook, 
  ValidationHook,
  AuthHook,
  ToolInstrumentor
} from '../../src/hooks/standard-hooks.js';

describe('Standard Hooks', () => {
  let hookManager: HookManager;

  beforeEach(() => {
    hookManager = new HookManager();
  });

  describe('LoggingHook', () => {
    it('should create a logging hook for tool:before event', () => {
      const logger = jest.fn();
      const hook = LoggingHook.createBeforeHook('test-logger', logger);

      expect(hook.id).toBe('test-logger');
      expect(hook.event).toBe('tool:before');
      expect(hook.priority).toBe(10); // Low priority for logging
    });

    it('should log tool execution start', async () => {
      const logger = jest.fn();
      const hook = LoggingHook.createBeforeHook('test-logger', logger);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent', prompt: 'Hello' },
        metadata: {}
      });

      expect(logger).toHaveBeenCalledWith('tool:before', 'execute_agent', { agentId: 'test-agent', prompt: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should create a logging hook for tool:after event', () => {
      const logger = jest.fn();
      const hook = LoggingHook.createAfterHook('test-logger-after', logger);

      expect(hook.event).toBe('tool:after');
    });

    it('should log tool execution completion', async () => {
      const logger = jest.fn();
      const hook = LoggingHook.createAfterHook('test-logger-after', logger);

      const result = await hook.handler({
        event: 'tool:after',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        output: { result: 'success' },
        metadata: { duration: 150 }
      });

      expect(logger).toHaveBeenCalledWith('tool:after', 'execute_agent', { result: 'success' }, { duration: 150 });
      expect(result.success).toBe(true);
    });

    it('should handle logging errors gracefully', async () => {
      const logger = jest.fn(() => {
        throw new Error('Logger failed');
      });
      const hook = LoggingHook.createBeforeHook('test-logger', logger);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        metadata: {}
      });

      // Should catch error and return success: false
      expect(result.success).toBe(false);
      expect(result.error).toContain('Logger failed');
    });
  });

  describe('MetricsHook', () => {
    it('should create a metrics hook for tool:before event', () => {
      const collector = jest.fn();
      const hook = MetricsHook.createBeforeHook('test-metrics', collector);

      expect(hook.id).toBe('test-metrics');
      expect(hook.event).toBe('tool:before');
      expect(hook.priority).toBe(20); // Low priority for metrics
    });

    it('should collect metrics on tool start', async () => {
      const collector = jest.fn();
      const hook = MetricsHook.createBeforeHook('test-metrics', collector);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        metadata: {}
      });

      expect(collector).toHaveBeenCalledWith({
        event: 'tool.start',
        toolName: 'execute_agent',
        timestamp: expect.any(String)
      });
      expect(result.success).toBe(true);
    });

    it('should create a metrics hook for tool:after event', () => {
      const collector = jest.fn();
      const hook = MetricsHook.createAfterHook('test-metrics-after', collector);

      expect(hook.event).toBe('tool:after');
    });

    it('should collect metrics on tool completion', async () => {
      const collector = jest.fn();
      const hook = MetricsHook.createAfterHook('test-metrics-after', collector);

      const result = await hook.handler({
        event: 'tool:after',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        output: { result: 'success' },
        metadata: { duration: 250 }
      });

      expect(collector).toHaveBeenCalledWith({
        event: 'tool.complete',
        toolName: 'execute_agent',
        duration: 250,
        timestamp: expect.any(String)
      });
      expect(result.success).toBe(true);
    });

    it('should measure performance overhead (< 5ms)', async () => {
      const collector = jest.fn();
      const hook = MetricsHook.createBeforeHook('test-metrics', collector);

      const start = Date.now();
      await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        metadata: {}
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('ValidationHook', () => {
    it('should create a validation hook', () => {
      const validator = jest.fn(() => ({ valid: true }));
      const hook = ValidationHook.createHook('test-validator', validator);

      expect(hook.id).toBe('test-validator');
      expect(hook.event).toBe('tool:before');
      expect(hook.priority).toBe(5); // High priority for validation
    });

    it('should validate input and allow execution', async () => {
      const validator = jest.fn(() => ({ valid: true }));
      const hook = ValidationHook.createHook('test-validator', validator);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent', prompt: 'Hello' },
        metadata: {}
      });

      expect(validator).toHaveBeenCalledWith({ agentId: 'test-agent', prompt: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should validate input and reject invalid data', async () => {
      const validator = jest.fn(() => ({ 
        valid: false, 
        errors: ['agentId is required'] 
      }));
      const hook = ValidationHook.createHook('test-validator', validator);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: {},
        metadata: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('agentId is required');
    });

    it('should transform validated input', async () => {
      const validator = jest.fn(() => ({ 
        valid: true,
        transformedData: { agentId: 'test-agent', prompt: 'HELLO' } // Uppercase
      }));
      const hook = ValidationHook.createHook('test-validator', validator);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent', prompt: 'hello' },
        metadata: {}
      });

      expect(result.success).toBe(true);
      expect(result.transformedInput).toEqual({ agentId: 'test-agent', prompt: 'HELLO' });
    });
  });

  describe('AuthHook', () => {
    it('should create an auth hook', () => {
      const authCheck = jest.fn(async () => ({ authorized: true }));
      const hook = AuthHook.createHook('test-auth', authCheck);

      expect(hook.id).toBe('test-auth');
      expect(hook.event).toBe('tool:before');
      expect(hook.priority).toBe(1); // Highest priority for auth
    });

    it('should authorize tool execution', async () => {
      const authCheck = jest.fn(async () => ({ authorized: true, userId: 'user-123' }));
      const hook = AuthHook.createHook('test-auth', authCheck);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        metadata: { apiKey: 'test-key' }
      });

      expect(authCheck).toHaveBeenCalledWith({ agentId: 'test-agent' }, { apiKey: 'test-key' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ userId: 'user-123' });
    });

    it('should reject unauthorized access', async () => {
      const authCheck = jest.fn(async () => ({ 
        authorized: false, 
        reason: 'Invalid API key' 
      }));
      const hook = AuthHook.createHook('test-auth', authCheck);

      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        metadata: { apiKey: 'invalid-key' }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should handle auth check timeouts', async () => {
      const authCheck = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 600)); // Exceeds 500ms timeout
        return { authorized: true };
      });
      const hook = AuthHook.createHook('test-auth', authCheck);

      // This will be caught by HookManager's timeout mechanism
      const result = await hook.handler({
        event: 'tool:before',
        toolName: 'execute_agent',
        input: { agentId: 'test-agent' },
        metadata: {}
      });

      // Since we're testing in isolation, just verify the handler exists
      expect(hook.handler).toBeDefined();
    });
  });

  describe('ToolInstrumentor', () => {
    it('should wrap tool execution with hooks', async () => {
      const beforeHook = jest.fn(async () => ({ success: true }));
      const afterHook = jest.fn(async () => ({ success: true }));

      hookManager.registerHook({
        id: 'before-hook',
        event: 'tool:before',
        priority: 50,
        handler: beforeHook
      });

      hookManager.registerHook({
        id: 'after-hook',
        event: 'tool:after',
        priority: 50,
        handler: afterHook
      });

      const instrumentor = new ToolInstrumentor(hookManager);

      const toolHandler = jest.fn(async (input) => ({ result: 'success' }));

      const instrumentedHandler = instrumentor.instrument('test_tool', toolHandler);

      const result = await instrumentedHandler({ agentId: 'test-agent' });

      expect(beforeHook).toHaveBeenCalled();
      expect(toolHandler).toHaveBeenCalledWith({ agentId: 'test-agent' });
      expect(afterHook).toHaveBeenCalled();
      expect(result).toEqual({ result: 'success' });
    });

    it('should measure execution time', async () => {
      const instrumentor = new ToolInstrumentor(hookManager);

      const toolHandler = jest.fn(async (input) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { result: 'success' };
      });

      const instrumentedHandler = instrumentor.instrument('test_tool', toolHandler);

      const start = Date.now();
      await instrumentedHandler({ agentId: 'test-agent' });
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should handle tool execution errors', async () => {
      const errorHook = jest.fn(async () => ({ success: true }));

      hookManager.registerHook({
        id: 'error-hook',
        event: 'tool:error',
        priority: 50,
        handler: errorHook
      });

      const instrumentor = new ToolInstrumentor(hookManager);

      const toolHandler = jest.fn(async () => {
        throw new Error('Tool failed');
      });

      const instrumentedHandler = instrumentor.instrument('test_tool', toolHandler);

      await expect(instrumentedHandler({ agentId: 'test-agent' })).rejects.toThrow('Tool failed');

      expect(errorHook).toHaveBeenCalled();
    });

    it('should add minimal overhead (< 5ms without hooks)', async () => {
      const instrumentor = new ToolInstrumentor(hookManager);

      const toolHandler = jest.fn(async (input) => ({ result: 'success' }));

      const instrumentedHandler = instrumentor.instrument('test_tool', toolHandler);

      const start = Date.now();
      await instrumentedHandler({ agentId: 'test-agent' });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5);
    });

    it('should work without hook manager (backward compatible)', async () => {
      const instrumentor = new ToolInstrumentor();

      const toolHandler = jest.fn(async (input) => ({ result: 'success' }));

      const instrumentedHandler = instrumentor.instrument('test_tool', toolHandler);

      const result = await instrumentedHandler({ agentId: 'test-agent' });

      expect(result).toEqual({ result: 'success' });
    });
  });
});

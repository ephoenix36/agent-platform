/**
 * Hook Manager Test Suite
 * 
 * Tests for the lifecycle hook system with priority ordering,
 * error isolation, and timeout enforcement.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HookManager } from '../../src/hooks/HookManager.js';
import { 
  Hook, 
  HookContext, 
  HookEvent, 
  HookResult,
  HookType 
} from '../../src/hooks/types.js';

describe('HookManager', () => {
  let hookManager: HookManager;

  beforeEach(() => {
    hookManager = new HookManager();
  });

  describe('Hook Registration', () => {
    it('should register a hook successfully', () => {
      const hook: Hook = {
        id: 'test-hook',
        event: 'tool:before',
        priority: 50,
        handler: async (context: HookContext) => ({ success: true })
      };

      hookManager.registerHook(hook);
      const hooks = hookManager.getHooks('tool:before');
      
      expect(hooks).toHaveLength(1);
      expect(hooks[0].id).toBe('test-hook');
    });

    it('should allow multiple hooks on same event', () => {
      const hook1: Hook = {
        id: 'hook-1',
        event: 'tool:before',
        priority: 50,
        handler: async () => ({ success: true })
      };

      const hook2: Hook = {
        id: 'hook-2',
        event: 'tool:before',
        priority: 75,
        handler: async () => ({ success: true })
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);

      const hooks = hookManager.getHooks('tool:before');
      expect(hooks).toHaveLength(2);
    });

    it('should reject duplicate hook IDs', () => {
      const hook: Hook = {
        id: 'duplicate',
        event: 'tool:before',
        priority: 50,
        handler: async () => ({ success: true })
      };

      hookManager.registerHook(hook);

      expect(() => {
        hookManager.registerHook(hook);
      }).toThrow('Hook with id "duplicate" already registered');
    });

    it('should validate priority range (0-100)', () => {
      const invalidHook: Hook = {
        id: 'invalid-priority',
        event: 'tool:before',
        priority: 150, // Invalid
        handler: async () => ({ success: true })
      };

      expect(() => {
        hookManager.registerHook(invalidHook);
      }).toThrow('Hook priority must be between 0 and 100');
    });
  });

  describe('Hook Execution Order', () => {
    it('should execute hooks in priority order (lowest first)', async () => {
      const executionOrder: number[] = [];

      const hook1: Hook = {
        id: 'low-priority',
        event: 'tool:before',
        priority: 25,
        handler: async () => {
          executionOrder.push(25);
          return { success: true };
        }
      };

      const hook2: Hook = {
        id: 'high-priority',
        event: 'tool:before',
        priority: 75,
        handler: async () => {
          executionOrder.push(75);
          return { success: true };
        }
      };

      const hook3: Hook = {
        id: 'medium-priority',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          executionOrder.push(50);
          return { success: true };
        }
      };

      hookManager.registerHook(hook2); // Register out of order
      hookManager.registerHook(hook1);
      hookManager.registerHook(hook3);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {}
      };

      await hookManager.executeHooks('tool:before', context);

      expect(executionOrder).toEqual([25, 50, 75]);
    });

    it('should handle hooks with same priority (stable sort)', async () => {
      const executionOrder: string[] = [];

      const hook1: Hook = {
        id: 'first',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          executionOrder.push('first');
          return { success: true };
        }
      };

      const hook2: Hook = {
        id: 'second',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          executionOrder.push('second');
          return { success: true };
        }
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {}
      };

      await hookManager.executeHooks('tool:before', context);

      // Should maintain registration order for same priority
      expect(executionOrder).toEqual(['first', 'second']);
    });
  });

  describe('Error Isolation', () => {
    it('should continue executing hooks after one fails', async () => {
      const executionOrder: string[] = [];

      const hook1: Hook = {
        id: 'success-1',
        event: 'tool:before',
        priority: 25,
        handler: async () => {
          executionOrder.push('success-1');
          return { success: true };
        }
      };

      const hook2: Hook = {
        id: 'failing-hook',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          executionOrder.push('failing-hook');
          throw new Error('Hook failed');
        }
      };

      const hook3: Hook = {
        id: 'success-2',
        event: 'tool:before',
        priority: 75,
        handler: async () => {
          executionOrder.push('success-2');
          return { success: true };
        }
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);
      hookManager.registerHook(hook3);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {}
      };

      await hookManager.executeHooks('tool:before', context);

      // All hooks should execute despite the failure
      expect(executionOrder).toEqual(['success-1', 'failing-hook', 'success-2']);
    });

    it('should log failed hooks without throwing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const hook: Hook = {
        id: 'failing',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          throw new Error('Test error');
        }
      };

      hookManager.registerHook(hook);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {}
      };

      // Should not throw
      await expect(
        hookManager.executeHooks('tool:before', context)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hook "failing" failed'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Timeout Enforcement', () => {
    it('should timeout hooks that exceed the limit', async () => {
      const hook: Hook = {
        id: 'slow-hook',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { success: true };
        }
      };

      hookManager.registerHook(hook);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {}
      };

      const startTime = Date.now();
      await hookManager.executeHooks('tool:before', context, { timeout: 100 });
      const duration = Date.now() - startTime;

      // Should timeout around 100ms, not wait 1000ms
      expect(duration).toBeLessThan(200);
    });

    it('should use default timeout of 500ms', async () => {
      const hook: Hook = {
        id: 'timeout-test',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          await new Promise(resolve => setTimeout(resolve, 600));
          return { success: true };
        }
      };

      hookManager.registerHook(hook);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {}
      };

      const startTime = Date.now();
      await hookManager.executeHooks('tool:before', context); // No timeout specified
      const duration = Date.now() - startTime;

      // Should timeout around 500ms
      expect(duration).toBeGreaterThan(400);
      expect(duration).toBeLessThan(700);
    });
  });

  describe('Hook Context Management', () => {
    it('should pass context to all hooks', async () => {
      let receivedContext: HookContext | null = null;

      const hook: Hook = {
        id: 'context-test',
        event: 'tool:before',
        priority: 50,
        handler: async (context) => {
          receivedContext = context;
          return { success: true };
        }
      };

      hookManager.registerHook(hook);

      const originalContext: HookContext = {
        event: 'tool:before',
        toolName: 'my-tool',
        input: { key: 'value' },
        metadata: { userId: '123' }
      };

      await hookManager.executeHooks('tool:before', originalContext);

      expect(receivedContext).toEqual(originalContext);
    });

    it('should support context abort signal', async () => {
      const executionOrder: string[] = [];

      const hook1: Hook = {
        id: 'aborting-hook',
        event: 'tool:before',
        priority: 25,
        handler: async (context) => {
          executionOrder.push('hook1');
          context.abort();
          return { success: true };
        }
      };

      const hook2: Hook = {
        id: 'should-not-run',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          executionOrder.push('hook2');
          return { success: true };
        }
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: {},
        metadata: {},
        abort: () => { context.aborted = true; },
        aborted: false
      };

      await hookManager.executeHooks('tool:before', context);

      // Only first hook should execute
      expect(executionOrder).toEqual(['hook1']);
      expect(context.aborted).toBe(true);
    });
  });

  describe('Hook Transformation', () => {
    it('should allow hooks to transform input', async () => {
      const hook: Hook = {
        id: 'transform-hook',
        event: 'tool:before',
        priority: 50,
        type: 'transform',
        handler: async (context) => {
          return {
            success: true,
            transformedInput: {
              ...context.input,
              transformed: true
            }
          };
        }
      };

      hookManager.registerHook(hook);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: { original: 'value' },
        metadata: {}
      };

      const result = await hookManager.executeHooks('tool:before', context);

      expect(result.transformedInput).toEqual({
        original: 'value',
        transformed: true
      });
    });

    it('should chain transformations across multiple hooks', async () => {
      const hook1: Hook = {
        id: 'transform-1',
        event: 'tool:before',
        priority: 25,
        type: 'transform',
        handler: async (context) => ({
          success: true,
          transformedInput: { ...context.input, step1: true }
        })
      };

      const hook2: Hook = {
        id: 'transform-2',
        event: 'tool:before',
        priority: 50,
        type: 'transform',
        handler: async (context) => ({
          success: true,
          transformedInput: { ...context.input, step2: true }
        })
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test-tool',
        input: { original: true },
        metadata: {}
      };

      const result = await hookManager.executeHooks('tool:before', context);

      expect(result.transformedInput).toEqual({
        original: true,
        step1: true,
        step2: true
      });
    });
  });

  describe('Hook Removal', () => {
    it('should remove a hook by ID', () => {
      const hook: Hook = {
        id: 'removable',
        event: 'tool:before',
        priority: 50,
        handler: async () => ({ success: true })
      };

      hookManager.registerHook(hook);
      expect(hookManager.getHooks('tool:before')).toHaveLength(1);

      hookManager.removeHook('removable');
      expect(hookManager.getHooks('tool:before')).toHaveLength(0);
    });

    it('should handle removal of non-existent hook', () => {
      expect(() => {
        hookManager.removeHook('non-existent');
      }).not.toThrow();
    });

    it('should only remove specified hook, not others', () => {
      const hook1: Hook = {
        id: 'keep',
        event: 'tool:before',
        priority: 50,
        handler: async () => ({ success: true })
      };

      const hook2: Hook = {
        id: 'remove',
        event: 'tool:before',
        priority: 50,
        handler: async () => ({ success: true })
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);

      hookManager.removeHook('remove');

      const hooks = hookManager.getHooks('tool:before');
      expect(hooks).toHaveLength(1);
      expect(hooks[0].id).toBe('keep');
    });
  });

  describe('Multiple Event Types', () => {
    it('should isolate hooks by event type', async () => {
      const executionLog: string[] = [];

      const beforeHook: Hook = {
        id: 'before',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          executionLog.push('before');
          return { success: true };
        }
      };

      const afterHook: Hook = {
        id: 'after',
        event: 'tool:after',
        priority: 50,
        handler: async () => {
          executionLog.push('after');
          return { success: true };
        }
      };

      hookManager.registerHook(beforeHook);
      hookManager.registerHook(afterHook);

      // Execute only 'tool:before' hooks
      await hookManager.executeHooks('tool:before', {
        event: 'tool:before',
        toolName: 'test',
        input: {},
        metadata: {}
      });

      expect(executionLog).toEqual(['before']);
    });

    it('should support all hook event types', () => {
      const events: HookEvent[] = [
        'tool:before',
        'tool:after',
        'tool:error',
        'agent:before',
        'agent:after',
        'workflow:step:before',
        'workflow:step:after'
      ];

      events.forEach((event, index) => {
        const hook: Hook = {
          id: `hook-${index}`,
          event,
          priority: 50,
          handler: async () => ({ success: true })
        };

        hookManager.registerHook(hook);
        expect(hookManager.getHooks(event)).toHaveLength(1);
      });
    });
  });

  describe('Async Hook Handlers', () => {
    it('should support fully async hooks', async () => {
      const hook: Hook = {
        id: 'async-hook',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return { success: true };
        }
      };

      hookManager.registerHook(hook);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test',
        input: {},
        metadata: {}
      };

      await expect(
        hookManager.executeHooks('tool:before', context)
      ).resolves.not.toThrow();
    });

    it('should wait for all async hooks to complete', async () => {
      const completionOrder: string[] = [];

      const hook1: Hook = {
        id: 'fast',
        event: 'tool:before',
        priority: 25,
        handler: async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          completionOrder.push('fast');
          return { success: true };
        }
      };

      const hook2: Hook = {
        id: 'slow',
        event: 'tool:before',
        priority: 50,
        handler: async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          completionOrder.push('slow');
          return { success: true };
        }
      };

      hookManager.registerHook(hook1);
      hookManager.registerHook(hook2);

      const context: HookContext = {
        event: 'tool:before',
        toolName: 'test',
        input: {},
        metadata: {}
      };

      await hookManager.executeHooks('tool:before', context);

      // Both should complete, 'fast' finishes first due to shorter delay
      expect(completionOrder).toEqual(['fast', 'slow']);
    });
  });
});

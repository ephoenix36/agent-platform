/**
 * Optimization Service Test Suite
 * 
 * Tests for EvoSuite SDK integration with agent optimization,
 * evaluation, and mutation capabilities.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OptimizationService } from '../../src/services/OptimizationService.js';
import type { EvolutionResult, EvolutionConfig } from '@evosuite/sdk';

describe('OptimizationService', () => {
  let optimizationService: OptimizationService;

  beforeEach(() => {
    optimizationService = new OptimizationService();
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = optimizationService.getConfig();
      
      expect(config).toHaveProperty('populationSize');
      expect(config).toHaveProperty('generations');
      expect(config).toHaveProperty('mutationRate');
      expect(config.populationSize).toBeGreaterThan(0);
      expect(config.generations).toBeGreaterThan(0);
    });

    it('should allow custom configuration', () => {
      const customService = new OptimizationService({
        populationSize: 100,
        generations: 50,
        mutationRate: 0.1
      });

      const config = customService.getConfig();
      expect(config.populationSize).toBe(100);
      expect(config.generations).toBe(50);
      expect(config.mutationRate).toBe(0.1);
    });
  });

  describe('Agent Config Conversion', () => {
    it('should convert agent config to EvoSuite format', () => {
      const agentConfig = {
        id: 'test-agent',
        model: 'gpt-4',
        systemPrompt: 'You are a helpful assistant',
        temperature: 0.7,
        maxTokens: 1000
      };

      const evoConfig = optimizationService.convertAgentConfig(agentConfig);

      expect(evoConfig).toHaveProperty('populationSize');
      expect(evoConfig).toHaveProperty('generations');
      expect(evoConfig).toHaveProperty('evaluator');
    });

    it('should preserve agent metadata in conversion', () => {
      const agentConfig = {
        id: 'complex-agent',
        model: 'claude-3',
        systemPrompt: 'Complex prompt',
        metadata: {
          version: '1.0',
          tags: ['production']
        }
      };

      const evoConfig = optimizationService.convertAgentConfig(agentConfig);
      
      // Should be accessible via config or metadata
      expect(evoConfig).toBeDefined();
    });

    it('should handle minimal agent config', () => {
      const minimalConfig = {
        id: 'minimal',
        model: 'gpt-3.5-turbo'
      };

      const evoConfig = optimizationService.convertAgentConfig(minimalConfig);
      expect(evoConfig).toHaveProperty('evaluator');
    });
  });

  describe('Evolution Runner', () => {
    it('should initialize evolution runner', () => {
      const runner = optimizationService.createRunner({
        populationSize: 50,
        generations: 10,
        evaluator: (genome: number[]) => -(genome[0] ** 2), // Simple optimization
        genomeDimension: 1,
        genomeRange: [-5, 5]
      });

      expect(runner).toBeDefined();
      expect(runner).toHaveProperty('run');
    });

    it.skip('should run optimization successfully (requires Python backend)', async () => {
      // Simple sphere function minimization
      const evaluator = (genome: number[]) => {
        return -genome.reduce((sum, x) => sum + x * x, 0);
      };

      const result = await optimizationService.optimize({
        evaluator,
        populationSize: 20,
        generations: 10,
        genomeDimension: 2,
        genomeRange: [-5, 5]
      });

      expect(result).toHaveProperty('bestScore');
      expect(result).toHaveProperty('bestIndividual');
      expect(result).toHaveProperty('generationsCompleted');
      expect(result.generationsCompleted).toBeGreaterThan(0);
    }, 30000); // 30s timeout for optimization

    it.skip('should improve fitness over generations (requires Python backend)', async () => {
      const evaluator = (genome: number[]) => -Math.abs(genome[0]);

      const result = await optimizationService.optimize({
        evaluator,
        populationSize: 10,
        generations: 5,
        genomeDimension: 1,
        genomeRange: [-10, 10]
      });

      // Best score should be close to 0 (optimal)
      expect(result.bestScore).toBeGreaterThan(-1);
    }, 30000);
  });

  describe('Evaluator Execution', () => {
    it('should execute custom evaluator on genome', async () => {
      const genome = [1, 2, 3];
      const evaluator = (g: number[]) => g.reduce((a, b) => a + b, 0);

      const score = await optimizationService.evaluateGenome(genome, evaluator);

      expect(score).toBe(6);
    });

    it('should handle async evaluators', async () => {
      const genome = [5];
      const asyncEvaluator = async (g: number[]) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return g[0] * 2;
      };

      const score = await optimizationService.evaluateGenome(genome, asyncEvaluator);

      expect(score).toBe(10);
    });

    it('should handle evaluator errors gracefully', async () => {
      const genome = [1];
      const failingEvaluator = () => {
        throw new Error('Evaluation failed');
      };

      await expect(
        optimizationService.evaluateGenome(genome, failingEvaluator)
      ).rejects.toThrow('Evaluation failed');
    });
  });

  describe('Mutation Operations', () => {
    it('should mutate genome within bounds', () => {
      const genome = [0, 0, 0];
      const mutated = optimizationService.mutate(genome, {
        rate: 0.5,
        range: [-1, 1]
      });

      expect(mutated).toHaveLength(genome.length);
      mutated.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should preserve genome structure during mutation', () => {
      const genome = [1, 2, 3, 4, 5];
      const mutated = optimizationService.mutate(genome, {
        rate: 0.3,
        range: [-10, 10]
      });

      expect(mutated).toHaveLength(5);
    });

    it('should respect mutation rate', () => {
      const genome = Array(100).fill(0);
      const mutated = optimizationService.mutate(genome, {
        rate: 0,  // No mutation
        range: [-1, 1]
      });

      expect(mutated).toEqual(genome);
    });
  });

  describe('Telemetry Integration', () => {
    it.skip('should emit events during optimization (requires Python backend)', async () => {
      const events: string[] = [];
      
      optimizationService.on('optimization:start', () => events.push('start'));
      optimizationService.on('optimization:generation', () => events.push('generation'));
      optimizationService.on('optimization:complete', () => events.push('complete'));

      await optimizationService.optimize({
        evaluator: (g: number[]) => -(g[0] ** 2),
        populationSize: 10,
        generations: 2,
        genomeDimension: 1,
        genomeRange: [-5, 5]
      });

      expect(events).toContain('start');
      expect(events).toContain('complete');
      expect(events.filter(e => e === 'generation').length).toBeGreaterThan(0);
    }, 30000);

    it.skip('should provide progress updates (requires Python backend)', async () => {
      let progressCount = 0;

      optimizationService.on('optimization:generation', () => {
        progressCount++;
      });

      await optimizationService.optimize({
        evaluator: (g: number[]) => -g[0],
        populationSize: 10,
        generations: 5,
        genomeDimension: 1,
        genomeRange: [-5, 5]
      });

      expect(progressCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should validate optimization parameters', async () => {
      await expect(
        optimizationService.optimize({
          evaluator: (g: number[]) => g[0],
          populationSize: 0, // Invalid
          generations: 10,
          genomeDimension: 1,
          genomeRange: [-5, 5]
        })
      ).rejects.toThrow();
    });

    it('should validate genome range', async () => {
      await expect(
        optimizationService.optimize({
          evaluator: (g: number[]) => g[0],
          populationSize: 10,
          generations: 5,
          genomeDimension: 1,
          genomeRange: [5, -5] // Invalid (min > max)
        })
      ).rejects.toThrow();
    });

    it('should handle infinite fitness scores', async () => {
      const evaluator = () => Infinity;

      await expect(
        optimizationService.optimize({
          evaluator,
          populationSize: 10,
          generations: 5,
          genomeDimension: 1,
          genomeRange: [-5, 5]
        })
      ).rejects.toThrow();
    });
  });

  describe('Result Caching', () => {
    it.skip('should cache optimization results (requires Python backend)', async () => {
      const evaluator = jest.fn((g: number[]) => -(g[0] ** 2));

      const config = {
        evaluator,
        populationSize: 10,
        generations: 3,
        genomeDimension: 1,
        genomeRange: [-5, 5] as [number, number]
      };

      await optimizationService.optimize(config);
      const callCount1 = evaluator.mock.calls.length;

      // Second run with same config should use cache
      await optimizationService.optimize(config);
      const callCount2 = evaluator.mock.calls.length;

      // Should not re-evaluate (cached)
      expect(callCount2).toBe(callCount1);
    }, 30000);

    it.skip('should clear cache when requested (requires Python backend)', async () => {
      const evaluator = jest.fn((g: number[]) => g[0]);

      const config = {
        evaluator,
        populationSize: 10,
        generations: 2,
        genomeDimension: 1,
        genomeRange: [-5, 5] as [number, number]
      };

      await optimizationService.optimize(config);
      optimizationService.clearCache();
      await optimizationService.optimize(config);

      // Should evaluate twice (cache cleared)
      expect(evaluator.mock.calls.length).toBeGreaterThan(10);
    }, 30000);
  });
});

/**
 * Optimization Service
 * 
 * Integrates EvoSuite SDK for agent optimization, evaluation, and mutation.
 */

import { EvolutionRunner } from '@evosuite/sdk';
import type {
  EvolutionConfig,
  EvolutionResult,
  EvaluatorFunction
} from '@evosuite/sdk';
import { EventEmitter } from 'events';

// Type alias for genome (number array)
type Genome = number[];

/**
 * Agent configuration format
 */
export interface AgentConfig {
  id: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

/**
 * Optimization options
 */
export interface OptimizationOptions {
  evaluator: EvaluatorFunction;
  populationSize: number;
  generations: number;
  genomeDimension: number;
  genomeRange: [number, number];
  mutationRate?: number;
  selectionStrategy?: string;
}

/**
 * Mutation options
 */
export interface MutationOptions {
  rate: number;
  range: [number, number];
}

/**
 * Optimization service for EvoSuite integration
 */
export class OptimizationService extends EventEmitter {
  private defaultConfig: Partial<EvolutionConfig>;
  private resultCache: Map<string, EvolutionResult> = new Map();

  constructor(config?: Partial<EvolutionConfig>) {
    super();
    this.defaultConfig = {
      populationSize: 50,
      generations: 20,
      mutationRate: 0.1,
      selectionStrategy: 'tournament',
      ...config
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<Pick<EvolutionConfig, 'populationSize' | 'generations' | 'mutationRate'>> {
    return {
      populationSize: this.defaultConfig.populationSize ?? 50,
      generations: this.defaultConfig.generations ?? 20,
      mutationRate: this.defaultConfig.mutationRate ?? 0.1
    };
  }

  /**
   * Convert agent config to EvoSuite evolution config
   */
  convertAgentConfig(agentConfig: AgentConfig): EvolutionConfig {
    // Create an evaluator that scores agent configurations
    const evaluator: EvaluatorFunction = (genome: Genome): number => {
      // Genome represents agent parameters
      // For now, simple scoring based on parameter balance
      const temperature = genome[0] ?? 0.7;
      const maxTokens = genome[1] ?? 1000;

      // Score based on balanced parameters
      const tempScore = 1 - Math.abs(temperature - 0.7);
      const tokenScore = maxTokens / 2000; // Normalize to 0-1

      return (tempScore + tokenScore) / 2;
    };

    return {
      populationSize: this.defaultConfig.populationSize ?? 50,
      generations: this.defaultConfig.generations ?? 20,
      evaluator,
      mutationRate: this.defaultConfig.mutationRate ?? 0.1,
      selectionStrategy: this.defaultConfig.selectionStrategy ?? 'tournament',
      genomeDimension: 2, // temperature, maxTokens
      genomeRange: [0, 2] as [number, number]
    };
  }

  /**
   * Create evolution runner
   */
  createRunner(config: EvolutionConfig): EvolutionRunner {
    return new EvolutionRunner(config);
  }

  /**
   * Run optimization
   */
  async optimize(options: OptimizationOptions): Promise<EvolutionResult> {
    // Validate parameters
    this.validateOptimizationOptions(options);

    // Check cache
    const cacheKey = this.getCacheKey(options);
    const cached = this.resultCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Emit start event
    this.emit('optimization:start', { options });

    try {
      const config: EvolutionConfig = {
        populationSize: options.populationSize,
        generations: options.generations,
        evaluator: options.evaluator,
        mutationRate: options.mutationRate ?? this.defaultConfig.mutationRate ?? 0.1,
        selectionStrategy: (options.selectionStrategy ?? this.defaultConfig.selectionStrategy ?? 'tournament') as any,
        genomeDimension: options.genomeDimension,
        genomeRange: options.genomeRange
      };

      const runner = new EvolutionRunner(config);

      // Hook into generation events (if available)
      const result = await runner.run();

      // Emit generation events
      this.emit('optimization:generation', { generation: result.generationsCompleted });

      // Validate result
      if (!Number.isFinite(result.bestScore ?? NaN)) {
        throw new Error('Optimization produced invalid fitness score');
      }

      // Cache result
      this.resultCache.set(cacheKey, result);

      // Emit complete event
      this.emit('optimization:complete', { result });

      return result;
    } catch (error) {
      this.emit('optimization:error', { error });
      throw error;
    }
  }

  /**
   * Evaluate a genome with given evaluator
   */
  async evaluateGenome(genome: Genome, evaluator: EvaluatorFunction): Promise<number> {
    try {
      const score = await Promise.resolve(evaluator(genome));
      return score;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mutate a genome
   */
  mutate(genome: Genome, options: MutationOptions): Genome {
    const { rate, range } = options;
    const [min, max] = range;

    return genome.map((value: number) => {
      if (Math.random() < rate) {
        // Apply Gaussian mutation
        const mutation = (Math.random() - 0.5) * (max - min) * 0.2;
        const newValue = value + mutation;
        // Clamp to range
        return Math.max(min, Math.min(max, newValue));
      }
      return value;
    });
  }

  /**
   * Validate optimization options
   */
  private validateOptimizationOptions(options: OptimizationOptions): void {
    if (options.populationSize <= 0) {
      throw new Error('Population size must be positive');
    }

    if (options.generations <= 0) {
      throw new Error('Generations must be positive');
    }

    if (options.genomeDimension <= 0) {
      throw new Error('Genome dimension must be positive');
    }

    const [min, max] = options.genomeRange;
    if (min >= max) {
      throw new Error('Invalid genome range: min must be less than max');
    }

    if (options.mutationRate !== undefined) {
      if (options.mutationRate < 0 || options.mutationRate > 1) {
        throw new Error('Mutation rate must be between 0 and 1');
      }
    }
  }

  /**
   * Generate cache key from options
   */
  private getCacheKey(options: OptimizationOptions): string {
    return JSON.stringify({
      populationSize: options.populationSize,
      generations: options.generations,
      genomeDimension: options.genomeDimension,
      genomeRange: options.genomeRange,
      mutationRate: options.mutationRate,
      selectionStrategy: options.selectionStrategy
    });
  }

  /**
   * Clear result cache
   */
  clearCache(): void {
    this.resultCache.clear();
  }
}

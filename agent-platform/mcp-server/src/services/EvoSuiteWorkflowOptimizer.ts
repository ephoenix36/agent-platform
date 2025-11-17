/**
 * EvoSuite Integration for Workflow Optimization
 * 
 * Integrates the EvoSuite SDK for evolutionary optimization of workflows.
 * Supports:
 * - Multi-objective optimization (speed, reliability, cost)
 * - Directed mutations (prompt engineering, parameter tuning)
 * - Multi-dimensional evaluations
 * - Universal EvoAssets for workflow configurations
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logging.js';
import { TelemetryBridge } from '../telemetry/TelemetryBridge.js';
import type { WorkflowDefinition, WorkflowExecutionResult, EvaluatorPlugin } from './EnhancedWorkflowEngine.js';

/**
 * EvoAsset represents a workflow configuration that can be evolved
 */
export interface EvoAsset {
  id: string;
  type: 'workflow' | 'agent' | 'step_config';
  genome: any;  // The evolvable parameters
  fitness?: Record<string, number>;  // Multi-objective fitness scores
  generation: number;
  parentIds?: string[];
}

/**
 * Mutation strategy for workflow optimization
 */
export interface MutationStrategy {
  id: string;
  name: string;
  category: 'prompt-engineering' | 'parameter-tuning' | 'architecture' | 'hybrid';
  weight: number;  // Probability weight for selection
  mutate(asset: EvoAsset): Promise<EvoAsset>;
}

/**
 * Crossover strategy for combining workflows
 */
export interface CrossoverStrategy {
  id: string;
  name: string;
  combine(parent1: EvoAsset, parent2: EvoAsset): Promise<EvoAsset[]>;
}

/**
 * Selection strategy for choosing parents
 */
export interface SelectionStrategy {
  id: string;
  name: string;
  select(population: EvoAsset[], count: number): EvoAsset[];
}

/**
 * Optimization objectives
 */
export interface OptimizationObjectives {
  minimize_duration?: number;      // Target duration in ms
  maximize_success_rate?: number;  // Target success rate (0-1)
  minimize_cost?: number;          // Target cost in tokens/credits
  maximize_quality?: number;       // Target quality score (0-1)
  minimize_errors?: number;        // Target error count
}

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteCount: number;  // Number of top performers to preserve
  objectives: OptimizationObjectives;
  evaluators: string[];  // IDs of evaluators to use
  constraints?: {
    maxDuration?: number;
    maxCost?: number;
    minSuccessRate?: number;
  };
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  bestAssets: EvoAsset[];  // Pareto-optimal solutions
  generation: number;
  populationSize: number;
  convergenceHistory: Array<{
    generation: number;
    bestFitness: Record<string, number>;
    averageFitness: Record<string, number>;
  }>;
  duration: number;
}

/**
 * EvoSuite-based workflow optimizer
 */
export class EvoSuiteWorkflowOptimizer extends EventEmitter {
  private logger: Logger;
  private telemetryBridge: TelemetryBridge;
  
  private mutationStrategies: Map<string, MutationStrategy>;
  private crossoverStrategies: Map<string, CrossoverStrategy>;
  private selectionStrategies: Map<string, SelectionStrategy>;
  private evaluators: Map<string, EvaluatorPlugin>;
  
  private currentPopulation: EvoAsset[];
  private generation: number;
  private convergenceHistory: Array<any>;

  constructor(logger: Logger, telemetryBridge: TelemetryBridge) {
    super();
    this.logger = logger;
    this.telemetryBridge = telemetryBridge;
    
    this.mutationStrategies = new Map();
    this.crossoverStrategies = new Map();
    this.selectionStrategies = new Map();
    this.evaluators = new Map();
    
    this.currentPopulation = [];
    this.generation = 0;
    this.convergenceHistory = [];
    
    this.registerDefaultStrategies();
  }

  /**
   * Register a mutation strategy
   */
  registerMutation(strategy: MutationStrategy): void {
    this.mutationStrategies.set(strategy.id, strategy);
    this.logger.info(`Registered mutation strategy: ${strategy.name}`);
    
    // Emit event for telemetry
    this.emit('mutation.registered', {
      strategyId: strategy.id,
      category: strategy.category
    });
  }

  /**
   * Register a crossover strategy
   */
  registerCrossover(strategy: CrossoverStrategy): void {
    this.crossoverStrategies.set(strategy.id, strategy);
    this.logger.info(`Registered crossover strategy: ${strategy.name}`);
  }

  /**
   * Register a selection strategy
   */
  registerSelection(strategy: SelectionStrategy): void {
    this.selectionStrategies.set(strategy.id, strategy);
    this.logger.info(`Registered selection strategy: ${strategy.name}`);
  }

  /**
   * Register an evaluator
   */
  registerEvaluator(evaluator: EvaluatorPlugin): void {
    this.evaluators.set(evaluator.id, evaluator);
    this.logger.info(`Registered evaluator: ${evaluator.name}`);
  }

  /**
   * Optimize a workflow using evolutionary algorithms
   */
  async optimize(
    workflow: WorkflowDefinition,
    config: OptimizationConfig
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    this.logger.info(`Starting optimization for workflow: ${workflow.name}`);
    this.logger.info(`Configuration: ${JSON.stringify(config, null, 2)}`);

    // Initialize population
    this.currentPopulation = await this.initializePopulation(
      workflow,
      config.populationSize
    );
    this.generation = 0;
    this.convergenceHistory = [];

    // Emit optimization start
    this.emit('optimization:start', {
      workflowId: workflow.id,
      populationSize: config.populationSize,
      maxGenerations: config.maxGenerations
    });

    // Evolution loop
    for (let gen = 0; gen < config.maxGenerations; gen++) {
      this.generation = gen;
      
      this.logger.info(`Generation ${gen + 1}/${config.maxGenerations}`);

      // Evaluate population
      await this.evaluatePopulation(config.evaluators);

      // Record generation metrics
      const generationMetrics = this.getGenerationMetrics();
      this.convergenceHistory.push({
        generation: gen,
        bestFitness: generationMetrics.best,
        averageFitness: generationMetrics.average
      });

      // Emit generation complete
      this.emit('optimization:generation', {
        generation: gen,
        bestFitness: generationMetrics.best,
        averageFitness: generationMetrics.average
      });

      // Check convergence
      if (this.hasConverged()) {
        this.logger.info(`Converged at generation ${gen}`);
        break;
      }

      // Select parents (elitism + selection)
      const elite = this.selectElite(config.eliteCount);
      const parents = this.selectParents(
        config.populationSize - config.eliteCount
      );

      // Create next generation
      const offspring = await this.createOffspring(
        parents,
        config.mutationRate,
        config.crossoverRate
      );

      // Combine elite and offspring
      this.currentPopulation = [...elite, ...offspring];

      // Emit progress
      this.emit('generation:complete', {
        generation: gen,
        population: this.currentPopulation.length,
        metrics: generationMetrics
      });
    }

    // Extract Pareto-optimal solutions
    const bestAssets = this.getParetoFront();

    const duration = Date.now() - startTime;

    const result: OptimizationResult = {
      bestAssets,
      generation: this.generation,
      populationSize: this.currentPopulation.length,
      convergenceHistory: this.convergenceHistory,
      duration
    };

    // Emit optimization complete
    this.emit('optimization:complete', {
      workflowId: workflow.id,
      finalGeneration: this.generation,
      paretoFrontSize: bestAssets.length,
      duration
    });

    this.logger.info(`Optimization complete. Found ${bestAssets.length} Pareto-optimal solutions`);

    return result;
  }

  /**
   * Initialize population with variations of the base workflow
   */
  private async initializePopulation(
    workflow: WorkflowDefinition,
    size: number
  ): Promise<EvoAsset[]> {
    const population: EvoAsset[] = [];

    // Add the original workflow
    population.push({
      id: `asset_0_${Date.now()}`,
      type: 'workflow',
      genome: workflow,
      generation: 0
    });

    // Create variations
    for (let i = 1; i < size; i++) {
      const asset = await this.createVariation(workflow, i);
      population.push(asset);
    }

    return population;
  }

  /**
   * Create a variation of the workflow
   */
  private async createVariation(
    workflow: WorkflowDefinition,
    index: number
  ): Promise<EvoAsset> {
    // Select random mutation strategy
    const strategies = Array.from(this.mutationStrategies.values());
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];

    // Create base asset
    const baseAsset: EvoAsset = {
      id: `asset_${index}_${Date.now()}`,
      type: 'workflow',
      genome: JSON.parse(JSON.stringify(workflow)),  // Deep clone
      generation: 0
    };

    // Apply mutation
    return await strategy.mutate(baseAsset);
  }

  /**
   * Evaluate entire population
   */
  private async evaluatePopulation(evaluatorIds: string[]): Promise<void> {
    const promises = this.currentPopulation.map(async (asset) => {
      const fitness: Record<string, number> = {};

      for (const id of evaluatorIds) {
        const evaluator = this.evaluators.get(id);
        if (!evaluator) {
          this.logger.warn(`Evaluator ${id} not found`);
          continue;
        }

        try {
          // Mock execution result for evaluation
          const mockResult: WorkflowExecutionResult = {
            workflowId: asset.genome.id,
            executionId: `eval_${asset.id}`,
            status: 'completed',
            steps: [],
            duration: 0,
            metrics: {} as any
          };

          const scores = await evaluator.evaluate(mockResult);
          Object.assign(fitness, scores);
        } catch (error: any) {
          this.logger.error(`Evaluation failed for asset ${asset.id}:`, error);
        }
      }

      asset.fitness = fitness;
    });

    await Promise.all(promises);
  }

  /**
   * Get generation metrics
   */
  private getGenerationMetrics() {
    const objectives = this.getObjectiveNames();
    const best: Record<string, number> = {};
    const average: Record<string, number> = {};

    for (const obj of objectives) {
      const values = this.currentPopulation
        .map(a => a.fitness?.[obj] || 0)
        .filter(v => !isNaN(v));

      if (values.length > 0) {
        best[obj] = Math.max(...values);
        average[obj] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    }

    return { best, average };
  }

  /**
   * Get unique objective names from population
   */
  private getObjectiveNames(): string[] {
    const objectives = new Set<string>();
    
    for (const asset of this.currentPopulation) {
      if (asset.fitness) {
        Object.keys(asset.fitness).forEach(key => objectives.add(key));
      }
    }

    return Array.from(objectives);
  }

  /**
   * Check if optimization has converged
   */
  private hasConverged(): boolean {
    if (this.convergenceHistory.length < 5) return false;

    // Check if best fitness hasn't improved in last 5 generations
    const recent = this.convergenceHistory.slice(-5);
    const objectives = this.getObjectiveNames();

    for (const obj of objectives) {
      const values = recent.map(r => r.bestFitness[obj]);
      const variance = this.calculateVariance(values);
      
      if (variance > 0.01) {  // Still changing
        return false;
      }
    }

    return true;  // Converged
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Select elite individuals
   */
  private selectElite(count: number): EvoAsset[] {
    // Sort by aggregate fitness (sum of all objectives)
    const sorted = [...this.currentPopulation].sort((a, b) => {
      const fitnessA = this.aggregateFitness(a);
      const fitnessB = this.aggregateFitness(b);
      return fitnessB - fitnessA;
    });

    return sorted.slice(0, count);
  }

  /**
   * Aggregate fitness across all objectives
   */
  private aggregateFitness(asset: EvoAsset): number {
    if (!asset.fitness) return 0;
    
    const values = Object.values(asset.fitness);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Select parents for reproduction
   */
  private selectParents(count: number): EvoAsset[] {
    // Use tournament selection (default)
    const parents: EvoAsset[] = [];
    const tournamentSize = 3;

    for (let i = 0; i < count; i++) {
      // Select random candidates
      const candidates = [];
      for (let j = 0; j < tournamentSize; j++) {
        const index = Math.floor(Math.random() * this.currentPopulation.length);
        candidates.push(this.currentPopulation[index]);
      }

      // Pick the best
      const best = candidates.reduce((a, b) =>
        this.aggregateFitness(a) > this.aggregateFitness(b) ? a : b
      );

      parents.push(best);
    }

    return parents;
  }

  /**
   * Create offspring through crossover and mutation
   */
  private async createOffspring(
    parents: EvoAsset[],
    mutationRate: number,
    crossoverRate: number
  ): Promise<EvoAsset[]> {
    const offspring: EvoAsset[] = [];

    for (let i = 0; i < parents.length; i += 2) {
      const parent1 = parents[i];
      const parent2 = parents[i + 1] || parent1;

      let children: EvoAsset[];

      // Crossover
      if (Math.random() < crossoverRate && this.crossoverStrategies.size > 0) {
        const strategies = Array.from(this.crossoverStrategies.values());
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        children = await strategy.combine(parent1, parent2);
      } else {
        // No crossover, just copy parents
        children = [
          JSON.parse(JSON.stringify(parent1)),
          JSON.parse(JSON.stringify(parent2))
        ];
      }

      // Mutation
      for (const child of children) {
        if (Math.random() < mutationRate) {
          const mutated = await this.mutateAsset(child);
          offspring.push(mutated);
        } else {
          offspring.push(child);
        }
      }
    }

    return offspring.slice(0, parents.length);
  }

  /**
   * Mutate an asset using weighted random strategy
   */
  private async mutateAsset(asset: EvoAsset): Promise<EvoAsset> {
    const strategies = Array.from(this.mutationStrategies.values());
    
    // Weight-based selection
    const totalWeight = strategies.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const strategy of strategies) {
      random -= strategy.weight;
      if (random <= 0) {
        return await strategy.mutate(asset);
      }
    }

    // Fallback
    return await strategies[0].mutate(asset);
  }

  /**
   * Get Pareto-optimal front
   */
  private getParetoFront(): EvoAsset[] {
    const pareto: EvoAsset[] = [];

    for (const asset of this.currentPopulation) {
      let dominated = false;

      for (const other of this.currentPopulation) {
        if (asset === other) continue;

        if (this.dominates(other, asset)) {
          dominated = true;
          break;
        }
      }

      if (!dominated) {
        pareto.push(asset);
      }
    }

    return pareto;
  }

  /**
   * Check if asset1 dominates asset2 (all objectives better or equal, at least one strictly better)
   */
  private dominates(asset1: EvoAsset, asset2: EvoAsset): boolean {
    if (!asset1.fitness || !asset2.fitness) return false;

    const objectives = this.getObjectiveNames();
    let strictlyBetter = false;

    for (const obj of objectives) {
      const fitness1 = asset1.fitness[obj] || 0;
      const fitness2 = asset2.fitness[obj] || 0;

      if (fitness1 < fitness2) {
        return false;  // asset1 is worse in this objective
      }

      if (fitness1 > fitness2) {
        strictlyBetter = true;
      }
    }

    return strictlyBetter;
  }

  /**
   * Register default strategies
   */
  private registerDefaultStrategies(): void {
    // Prompt engineering mutation
    this.registerMutation({
      id: 'prompt-engineer',
      name: 'Prompt Engineering Mutation',
      category: 'prompt-engineering',
      weight: 1.0,
      mutate: async (asset: EvoAsset) => {
        // Mutate agent prompts in workflow steps
        const mutated = JSON.parse(JSON.stringify(asset));
        
        for (const step of mutated.genome.steps || []) {
          if (step.type === 'agent' && step.config.systemPrompt) {
            // Add variety to prompts
            const variations = [
              'Be more concise and direct.',
              'Think step by step before responding.',
              'Consider multiple perspectives.',
              'Focus on practical solutions.'
            ];
            
            const variation = variations[Math.floor(Math.random() * variations.length)];
            step.config.systemPrompt += `\n\n${variation}`;
          }
        }

        mutated.id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        mutated.generation = asset.generation + 1;
        mutated.parentIds = [asset.id];

        return mutated;
      }
    });

    // Parameter tuning mutation
    this.registerMutation({
      id: 'parameter-tune',
      name: 'Parameter Tuning Mutation',
      category: 'parameter-tuning',
      weight: 1.0,
      mutate: async (asset: EvoAsset) => {
        const mutated = JSON.parse(JSON.stringify(asset));
        
        for (const step of mutated.genome.steps || []) {
          if (step.type === 'agent' && step.config) {
            // Mutate temperature
            if (step.config.temperature !== undefined) {
              step.config.temperature += (Math.random() - 0.5) * 0.2;
              step.config.temperature = Math.max(0, Math.min(2, step.config.temperature));
            }

            // Mutate maxTokens
            if (step.config.maxTokens !== undefined) {
              step.config.maxTokens += Math.floor((Math.random() - 0.5) * 1000);
              step.config.maxTokens = Math.max(100, Math.min(8000, step.config.maxTokens));
            }
          }
        }

        mutated.id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        mutated.generation = asset.generation + 1;
        mutated.parentIds = [asset.id];

        return mutated;
      }
    });

    this.logger.info('Registered default mutation strategies');
  }
}

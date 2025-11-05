/**
 * Evaluator & Mutator Specification V1.0
 * Defines the structure for optimization components
 */

/**
 * Evaluator: Scores agent performance
 */
export interface EvaluatorV1 {
  // Metadata
  id: string;
  version: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  
  // Classification
  category: 'performance' | 'quality' | 'cost' | 'latency' | 'accuracy' | 'custom';
  tags: string[];
  
  // Evaluation Configuration
  config: {
    metrics: {
      name: string;
      weight: number; // 0-1, weights should sum to 1
      targetValue?: number;
      direction: 'maximize' | 'minimize';
    }[];
    aggregation: 'weighted-average' | 'min' | 'max' | 'geometric-mean';
  };
  
  // Execution
  execution: {
    functionPath: string; // Path to evaluation function
    async: boolean;
    timeout?: number; // milliseconds
  };
  
  // Input/Output
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
  };
  outputSchema: {
    type: 'object';
    properties: {
      score: { type: 'number'; min: 0; max: 1 };
      metrics: { type: 'object' };
      feedback?: { type: 'string' };
    };
  };
  
  // Metadata
  metadata: {
    icon?: string;
    license: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Mutator: Modifies agent configuration for optimization
 */
export interface MutatorV1 {
  // Metadata
  id: string;
  version: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  
  // Classification
  category: 'prompt-engineering' | 'parameter-tuning' | 'architecture' | 'hybrid' | 'custom';
  tags: string[];
  
  // Mutation Strategy
  strategy: {
    type: 'evolutionary' | 'bayesian' | 'gradient-based' | 'random-search' | 'custom';
    parameters: {
      mutationRate?: number; // 0-1
      crossoverRate?: number; // 0-1
      populationSize?: number;
      generations?: number;
    };
  };
  
  // Mutation Targets
  targets: {
    systemPrompt?: boolean;
    temperature?: boolean;
    maxTokens?: boolean;
    tools?: boolean;
    model?: boolean;
    custom?: string[]; // Custom configuration keys
  };
  
  // Execution
  execution: {
    functionPath: string; // Path to mutation function
    async: boolean;
    timeout?: number;
  };
  
  // Input/Output
  inputSchema: {
    type: 'object';
    properties: {
      currentConfig: { type: 'object' };
      evaluationScore: { type: 'number' };
      generation?: { type: 'number' };
    };
  };
  outputSchema: {
    type: 'object';
    properties: {
      newConfig: { type: 'object' };
      changes: { type: 'array' };
      rationale?: { type: 'string' };
    };
  };
  
  // Constraints
  constraints?: {
    maxPromptLength?: number;
    allowedModels?: string[];
    temperatureRange?: { min: number; max: number };
    maxTokensRange?: { min: number; max: number };
  };
  
  // Metadata
  metadata: {
    icon?: string;
    license: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Example Evaluator: LLM Response Quality
 */
export const responseQualityEvaluator: EvaluatorV1 = {
  id: 'response-quality-v1',
  version: '1.0.0',
  name: 'Response Quality Evaluator',
  description: 'Evaluates LLM response quality across multiple dimensions',
  author: {
    id: 'platform',
    name: 'Platform Team',
  },
  category: 'quality',
  tags: ['llm', 'quality', 'evaluation'],
  config: {
    metrics: [
      {
        name: 'relevance',
        weight: 0.4,
        direction: 'maximize',
      },
      {
        name: 'coherence',
        weight: 0.3,
        direction: 'maximize',
      },
      {
        name: 'conciseness',
        weight: 0.2,
        direction: 'maximize',
      },
      {
        name: 'accuracy',
        weight: 0.1,
        direction: 'maximize',
      },
    ],
    aggregation: 'weighted-average',
  },
  execution: {
    functionPath: '/evaluators/response-quality.ts',
    async: true,
    timeout: 30000,
  },
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      response: { type: 'string' },
      context: { type: 'string' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      score: { type: 'number', min: 0, max: 1 },
      metrics: {
        type: 'object',
        properties: {
          relevance: { type: 'number' },
          coherence: { type: 'number' },
          conciseness: { type: 'number' },
          accuracy: { type: 'number' },
        },
      },
      feedback: { type: 'string' },
    },
  },
  metadata: {
    icon: '⭐',
    license: 'MIT',
    verified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};

/**
 * Example Mutator: Prompt Engineering
 */
export const promptEngineeringMutator: MutatorV1 = {
  id: 'prompt-engineer-v1',
  version: '1.0.0',
  name: 'Prompt Engineering Mutator',
  description: 'Automatically improves system prompts through evolutionary optimization',
  author: {
    id: 'platform',
    name: 'Platform Team',
  },
  category: 'prompt-engineering',
  tags: ['prompts', 'optimization', 'evolution'],
  strategy: {
    type: 'evolutionary',
    parameters: {
      mutationRate: 0.2,
      crossoverRate: 0.7,
      populationSize: 10,
      generations: 20,
    },
  },
  targets: {
    systemPrompt: true,
    temperature: true,
    maxTokens: false,
    tools: false,
    model: false,
  },
  execution: {
    functionPath: '/mutators/prompt-engineering.ts',
    async: true,
    timeout: 60000,
  },
  inputSchema: {
    type: 'object',
    properties: {
      currentConfig: { type: 'object' },
      evaluationScore: { type: 'number' },
      generation: { type: 'number' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      newConfig: { type: 'object' },
      changes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            oldValue: { type: 'any' },
            newValue: { type: 'any' },
          },
        },
      },
      rationale: { type: 'string' },
    },
  },
  constraints: {
    maxPromptLength: 4000,
    temperatureRange: { min: 0, max: 2 },
  },
  metadata: {
    icon: '🧬',
    license: 'MIT',
    verified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};

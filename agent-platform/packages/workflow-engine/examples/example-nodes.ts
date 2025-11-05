/**
 * Example Node Implementations
 * Demonstrates usage of BaseNode for common workflow patterns
 */

import { z } from 'zod';
import { BaseNode, NodeDefinition, NodeExecutionContext, NodeExecutionResult } from '../src/nodes/base';

/**
 * Example 1: HTTP Request Node
 * Makes HTTP requests to external APIs
 */
export class HttpRequestNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      type: 'http-request',
      displayName: 'HTTP Request',
      description: 'Make HTTP requests to external APIs',
      category: 'actions',
      icon: '🌐',
      version: '1.0.0',
      inputs: [
        {
          name: 'url',
          displayName: 'URL',
          description: 'The URL to request',
          type: 'string',
          required: true
        },
        {
          name: 'headers',
          displayName: 'Headers',
          description: 'Request headers',
          type: 'object',
          required: false,
          defaultValue: {}
        },
        {
          name: 'body',
          displayName: 'Request Body',
          description: 'Request body data',
          type: 'any',
          required: false
        }
      ],
      outputs: [
        {
          name: 'response',
          displayName: 'Response',
          description: 'HTTP response data',
          type: 'object',
          required: true
        },
        {
          name: 'statusCode',
          displayName: 'Status Code',
          description: 'HTTP status code',
          type: 'number',
          required: true
        }
      ],
      configSchema: z.object({
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
        timeout: z.number().min(0).default(30000)
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const url = context.inputs.url as string;
    const method = this.config.method as string;
    const headers = (context.inputs.headers as Record<string, string>) || {};
    const body = context.inputs.body;
    const timeout = this.config.timeout as number;

    context.log(`Making ${method} request to ${url}`, 'info');

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return this.success({
        response: data,
        statusCode: response.status
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      context.log(`HTTP request failed: ${err.message}`, 'error');
      return this.error(err);
    }
  }
}

/**
 * Example 2: JSON Transform Node
 * Transforms JSON data using expressions
 */
export class JsonTransformNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      type: 'json-transform',
      displayName: 'JSON Transform',
      description: 'Transform JSON data using expressions',
      category: 'transforms',
      icon: '🔄',
      version: '1.0.0',
      inputs: [
        {
          name: 'data',
          displayName: 'Input Data',
          description: 'Data to transform',
          type: 'any',
          required: true
        }
      ],
      outputs: [
        {
          name: 'result',
          displayName: 'Result',
          description: 'Transformed data',
          type: 'any',
          required: true
        }
      ],
      configSchema: z.object({
        expression: z.string().default('$'), // $ returns input as-is
        outputKey: z.string().optional()
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const data = context.inputs.data;
    const expression = this.config.expression as string;
    const outputKey = this.config.outputKey as string | undefined;

    context.log(`Applying transformation: ${expression}`, 'info');

    try {
      // Simple expression evaluation (in production, use JSONata library)
      let result = data;

      // Handle common simple cases
      if (expression === '$') {
        result = data;
      } else if (expression.startsWith('$.')) {
        // Simple property access
        const path = expression.slice(2).split('.');
        result = path.reduce((obj, key) => obj?.[key], data);
      } else {
        // For complex expressions, would use JSONata or similar library
        context.log('Complex expressions not yet implemented', 'warn');
        result = data;
      }

      const output = outputKey ? { [outputKey]: result } : { result };

      return this.success(output);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      context.log(`Transform failed: ${err.message}`, 'error');
      return this.error(err);
    }
  }
}

/**
 * Example 3: Webhook Trigger Node
 * Starts workflows when webhook is called
 */
export class WebhookTriggerNode extends BaseNode {
  private server: any; // Would be actual HTTP server

  protected define(): NodeDefinition {
    return {
      type: 'webhook-trigger',
      displayName: 'Webhook',
      description: 'Start workflow when webhook receives a request',
      category: 'triggers',
      icon: '📡',
      version: '1.0.0',
      inputs: [],
      outputs: [
        {
          name: 'body',
          displayName: 'Request Body',
          description: 'Webhook request body',
          type: 'any',
          required: false
        },
        {
          name: 'headers',
          displayName: 'Headers',
          description: 'Request headers',
          type: 'object',
          required: false
        },
        {
          name: 'query',
          displayName: 'Query Parameters',
          description: 'URL query parameters',
          type: 'object',
          required: false
        }
      ],
      configSchema: z.object({
        path: z.string().default('/webhook'),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
        port: z.number().min(1).max(65535).default(3000)
      })
    };
  }

  protected async onInitialize(): Promise<void> {
    const path = this.config.path as string;
    const port = this.config.port as number;

    // Mock context for initialization
    const context = {
      log: (msg: string) => console.log(msg)
    } as any;

    context.log(`Starting webhook listener on port ${port}${path}`);

    // In production, would start actual HTTP server
    // For example purposes, just create mock server
    this.server = {
      path,
      port,
      active: true
    };
  }

  protected async onCleanup(): Promise<void> {
    // In production, would stop HTTP server
    if (this.server) {
      this.server.active = false;
      this.server = null;
    }
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    // This would be called when webhook receives request
    // For example, returning mock data
    return this.success({
      body: { message: 'Webhook received' },
      headers: { 'content-type': 'application/json' },
      query: {}
    });
  }
}

/**
 * Example 4: If/Else Condition Node
 * Routes data based on condition
 */
export class IfElseNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      type: 'if-else',
      displayName: 'If/Else',
      description: 'Route data based on condition',
      category: 'conditions',
      icon: '🔀',
      version: '1.0.0',
      inputs: [
        {
          name: 'value',
          displayName: 'Value',
          description: 'Value to evaluate',
          type: 'any',
          required: true
        }
      ],
      outputs: [
        {
          name: 'true',
          displayName: 'True Branch',
          description: 'Data when condition is true',
          type: 'any',
          required: false
        },
        {
          name: 'false',
          displayName: 'False Branch',
          description: 'Data when condition is false',
          type: 'any',
          required: false
        }
      ],
      configSchema: z.object({
        operator: z.enum(['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains', 'isEmpty']).default('equals'),
        compareValue: z.any().optional()
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const value = context.inputs.value;
    const operator = this.config.operator as string;
    const compareValue = this.config.compareValue;

    context.log(`Evaluating: ${value} ${operator} ${compareValue}`, 'info');

    let conditionMet = false;
    switch (operator) {
      case 'equals':
        conditionMet = value === compareValue;
        break;
      case 'notEquals':
        conditionMet = value !== compareValue;
        break;
      case 'greaterThan':
        conditionMet = Number(value) > Number(compareValue);
        break;
      case 'lessThan':
        conditionMet = Number(value) < Number(compareValue);
        break;
      case 'contains':
        conditionMet = String(value).includes(String(compareValue));
        break;
      case 'isEmpty':
        conditionMet = !value || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0);
        break;
    }

    // Return data on the appropriate branch
    return this.success({
      [conditionMet ? 'true' : 'false']: value
    });
  }
}

/**
 * Example 5: Array Iterator Node
 * Process array items one by one
 */
export class ArrayIteratorNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      type: 'array-iterator',
      displayName: 'Array Iterator',
      description: 'Process array items one by one',
      category: 'iterators',
      icon: '🔁',
      version: '1.0.0',
      inputs: [
        {
          name: 'array',
          displayName: 'Array',
          description: 'Array to iterate',
          type: 'array',
          required: true
        }
      ],
      outputs: [
        {
          name: 'results',
          displayName: 'Results',
          description: 'Array of processed results',
          type: 'array',
          required: true
        },
        {
          name: 'count',
          displayName: 'Count',
          description: 'Number of items processed',
          type: 'number',
          required: true
        }
      ],
      configSchema: z.object({
        continueOnError: z.boolean().default(true),
        itemKey: z.string().default('item'),
        indexKey: z.string().default('index')
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const array = context.inputs.array as any[];
    const itemKey = this.config.itemKey as string;
    const indexKey = this.config.indexKey as string;
    const continueOnError = this.config.continueOnError as boolean;

    const results: any[] = [];
    
    for (let i = 0; i < array.length; i++) {
      try {
        context.log(`Processing item ${i}`, 'info');

        // Process each item
        const processed = {
          [itemKey]: array[i],
          [indexKey]: i,
          processedAt: new Date().toISOString()
        };

        results.push(processed);
      } catch (error) {
        if (!continueOnError) {
          throw error;
        }
        context.log(`Error processing item ${i}: ${error}`, 'warn');
      }
    }

    return this.success({
      results,
      count: results.length
    });
  }
}

/**
 * Example 6: API Call with Retry
 * Makes API calls with retry logic
 */
export class RetryApiCallNode extends BaseNode {
  protected define(): NodeDefinition {
    return {
      type: 'retry-api-call',
      displayName: 'API Call with Retry',
      description: 'Make API calls with automatic retry',
      category: 'actions',
      icon: '🔄',
      version: '1.0.0',
      inputs: [
        {
          name: 'url',
          displayName: 'URL',
          description: 'API endpoint URL',
          type: 'string',
          required: true
        }
      ],
      outputs: [
        {
          name: 'response',
          displayName: 'Response',
          description: 'API response data',
          type: 'any',
          required: true
        }
      ],
      configSchema: z.object({
        retryAttempts: z.number().min(0).max(10).default(3),
        retryDelay: z.number().min(0).default(1000),
        timeout: z.number().min(0).default(30000)
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const url = context.inputs.url as string;
    const retryAttempts = this.config.retryAttempts as number;
    const retryDelay = this.config.retryDelay as number;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          context.log(`Retry attempt ${attempt}/${retryAttempts}`, 'info');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        context.log(`Calling API: ${url}`, 'info');
        const response = await fetch(url);
        const data = await response.json();

        return this.success({
          response: data
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        context.log(`Attempt ${attempt + 1} failed: ${lastError.message}`, 'warn');
      }
    }

    return this.error(lastError || new Error('API call failed after retries'));
  }
}

/**
 * Example 7: Data Cache Node
 * Caches expensive computations
 */
export class DataCacheNode extends BaseNode {
  private cache: Map<string, { value: any; timestamp: number }> = new Map();

  protected define(): NodeDefinition {
    return {
      type: 'data-cache',
      displayName: 'Data Cache',
      description: 'Cache expensive computations',
      category: 'utilities',
      icon: '💾',
      version: '1.0.0',
      inputs: [
        {
          name: 'data',
          displayName: 'Input Data',
          description: 'Data to process/cache',
          type: 'any',
          required: true
        }
      ],
      outputs: [
        {
          name: 'result',
          displayName: 'Result',
          description: 'Processed data (from cache or fresh)',
          type: 'any',
          required: true
        }
      ],
      configSchema: z.object({
        cacheEnabled: z.boolean().default(true),
        cacheTTL: z.number().min(0).default(60000),
        cacheKey: z.string().optional(),
        processingDelay: z.number().min(0).default(100) // Simulate expensive operation
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const data = context.inputs.data;
    const delay = this.config.processingDelay as number;
    const cacheEnabled = this.config.cacheEnabled !== false;
    const cacheTTL = (this.config.cacheTTL as number) || 60000;
    const cacheKey = (this.config.cacheKey as string) || JSON.stringify(data);

    // Check cache if enabled
    if (cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cacheTTL) {
        context.log('Using cached result', 'info');
        return this.success({ result: cached.value }, { fromCache: true });
      }
    }

    context.log(`Processing data (simulating ${delay}ms operation)`, 'info');

    // Simulate expensive operation
    await new Promise(resolve => setTimeout(resolve, delay));

    // Transform data (example: uppercase all strings)
    const result = this.processData(data);

    // Store in cache
    if (cacheEnabled) {
      this.cache.set(cacheKey, {
        value: result,
        timestamp: Date.now()
      });
    }

    return this.success({ result });
  }

  private processData(data: any): any {
    if (typeof data === 'string') {
      return data.toUpperCase();
    }
    if (Array.isArray(data)) {
      return data.map(item => this.processData(item));
    }
    if (typeof data === 'object' && data !== null) {
      const processed: any = {};
      for (const [key, value] of Object.entries(data)) {
        processed[key] = this.processData(value);
      }
      return processed;
    }
    return data;
  }

  protected async onCleanup(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Usage Example:
 * 
 * ```typescript
 * // Create and configure an HTTP request node
 * const httpNode = new HttpRequestNode();
 * httpNode.setConfig({
 *   method: 'POST',
 *   timeout: 5000
 * });
 * 
 * // Create execution context
 * const context: NodeExecutionContext = {
 *   nodeId: 'http-1',
 *   workflowId: 'workflow-123',
 *   executionId: 'exec-456',
 *   inputs: {
 *     url: 'https://api.example.com/data',
 *     headers: { 'Authorization': 'Bearer token' },
 *     body: { key: 'value' }
 *   },
 *   config: {},
 *   metadata: {},
 *   log: (msg, level) => console.log(`[${level}] ${msg}`),
 *   emit: (event, data) => console.log(`Event: ${event}`, data),
 *   getVariable: (name) => null,
 *   setVariable: (name, value) => {}
 * };
 * 
 * // Run the node
 * const result = await httpNode.run(context);
 * console.log('Result:', result);
 * ```
 */

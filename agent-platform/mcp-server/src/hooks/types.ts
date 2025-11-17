/**
 * Hook System Type Definitions
 * 
 * Defines interfaces for the lifecycle hook system.
 */

/**
 * Hook event types
 */
export type HookEvent =
  | 'tool:before'
  | 'tool:after'
  | 'tool:error'
  | 'agent:before'
  | 'agent:after'
  | 'workflow:before'
  | 'workflow:after'
  | 'workflow:step:before'
  | 'workflow:step:after';

/**
 * Hook type categorization
 */
export type HookType = 
  | 'validation'   // Validate input/output
  | 'transform'    // Transform data
  | 'logging'      // Log events
  | 'metrics'      // Collect metrics
  | 'auth'         // Authentication/authorization
  | 'custom';      // Custom hook logic

/**
 * Hook execution context
 */
export interface HookContext {
  /** The event that triggered this hook */
  event: HookEvent;
  
  /** Name of the tool/agent/workflow being executed */
  toolName?: string;
  agentId?: string;
  workflowId?: string;
  
  /** Input data to the operation */
  input: any;
  
  /** Output data from the operation (for 'after' hooks) */
  output?: any;
  
  /** Error information (for 'error' hooks) */
  error?: Error;
  
  /** Additional metadata */
  metadata: Record<string, any>;
  
  /** Abort signal to stop further hook execution */
  abort?: () => void;
  aborted?: boolean;
}

/**
 * Result from hook execution
 */
export interface HookResult {
  /** Whether the hook executed successfully */
  success: boolean;
  
  /** Transformed input (for transform hooks) */
  transformedInput?: any;
  
  /** Transformed output (for transform hooks) */
  transformedOutput?: any;
  
  /** Additional data from the hook */
  data?: any;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Hook definition
 */
export interface Hook {
  /** Unique identifier for the hook */
  id: string;
  
  /** Event to listen for */
  event: HookEvent;
  
  /** Execution priority (0-100, lower executes first) */
  priority: number;
  
  /** Optional hook type categorization */
  type?: HookType;
  
  /** Hook handler function */
  handler: (context: HookContext) => Promise<HookResult>;
  
  /** Optional description */
  description?: string;
  
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Options for hook execution
 */
export interface HookExecutionOptions {
  /** Timeout in milliseconds (default: 500) */
  timeout?: number;
  
  /** Whether to stop on first error (default: false) */
  stopOnError?: boolean;
  
  /** Whether to collect results from all hooks */
  collectResults?: boolean;
}

/**
 * Result from executing multiple hooks
 */
export interface HookExecutionResult {
  /** Input after all transformations */
  transformedInput?: any;
  
  /** Output after all transformations */
  transformedOutput?: any;
  
  /** Results from individual hooks (if collectResults=true) */
  hookResults?: Array<{
    hookId: string;
    result: HookResult;
    duration: number;
  }>;
  
  /** Whether execution was aborted */
  aborted?: boolean;
  
  /** Total execution time */
  totalDuration?: number;
}

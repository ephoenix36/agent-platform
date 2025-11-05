// Minimal api-client stub to satisfy imports and provide a simple runtime implementation for dev/testing

export type AgentConfig = {
  id?: string;
  protocol?: string;
  [key: string]: any;
};

export type ExecutionEvent = {
  type: string;
  data?: any;
  timestamp?: number;
  execution_id?: string;
};

export const apiClient = {
  async executeAgentStreaming(
    config: any,
    onEvent: (event: ExecutionEvent) => void,
    onComplete?: () => void,
    onError?: (err: any) => void
  ) {
    try {
      // Simulate a streaming execution with a few events for local development
      const execId = `exec-${Date.now()}`;
      onEvent({ type: 'metadata', execution_id: execId, timestamp: Date.now() });
      onEvent({ type: 'status', data: 'started', timestamp: Date.now() });
      await new Promise((r) => setTimeout(r, 200));
      onEvent({ type: 'log', data: 'Performing step 1', timestamp: Date.now() });
      await new Promise((r) => setTimeout(r, 200));
      onEvent({ type: 'result', data: { message: 'Sample result' }, timestamp: Date.now() });
      onComplete?.();
    } catch (err) {
      onError?.(err);
    }
  },

  async cancelExecution(executionId: string) {
    // No-op for dev stub
    return true;
  },
};

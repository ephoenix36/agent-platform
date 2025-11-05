/**
 * API Client for Agent Platform Backend
 * 
 * Handles all communication with the FastAPI backend including:
 * - Agent CRUD operations
 * - Execution streaming
 * - Real-time event handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AgentConfig {
  name: string;
  protocol?: 'mcp' | 'crewai' | 'langchain' | 'langgraph';
  instructions?: string;
  system_message?: string;
  role?: string;
  goal?: string;
  backstory?: string;
  tools?: string[] | any[];
  chain_type?: string;
  steps?: any[];
  ui_components?: boolean;
}

export interface ExecutionEvent {
  type: 'status' | 'log' | 'error' | 'tool_call' | 'tool_result' | 'ui_component' | 'thinking' | 'result' | 'metadata';
  data: any;
  timestamp: number | null;
  execution_id: string | null;
}

export interface ExecutionRequest {
  agent_id: string;
  agent_config: AgentConfig;
  input_data: Record<string, any>;
  protocol?: string;
  stream?: boolean;
}

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Test if the API is reachable
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of supported protocols
   */
  async getSupportedProtocols(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/protocols`);
      if (!response.ok) {
        // Fallback to known protocols if endpoint doesn't exist yet
        return ['mcp', 'crewai', 'langchain', 'langgraph'];
      }
      const data = await response.json();
      return data.protocols || [];
    } catch {
      return ['mcp', 'crewai', 'langchain', 'langgraph'];
    }
  }

  /**
   * Parse agent definition from text
   */
  async parseAgent(content: string, format?: string): Promise<AgentConfig> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format }),
    });

    if (!response.ok) {
      throw new Error(`Failed to parse agent: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute agent with streaming events
   */
  async executeAgentStreaming(
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Event type line (we can use this if needed)
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              onEvent(eventData as ExecutionEvent);
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/executions/${executionId}/cancel`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel execution: ${response.statusText}`);
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get execution status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List active executions
   */
  async listActiveExecutions(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/executions/active/list`);

    if (!response.ok) {
      throw new Error(`Failed to list executions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create agent (save to database - future)
   */
  async createAgent(agent: AgentConfig): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agent: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List agents (from database - future)
   */
  async listAgents(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents`);

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get agent by ID (from database - future)
   */
  async getAgent(agentId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/agents/${agentId}`);

    if (!response.ok) {
      throw new Error(`Failed to get agent: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const apiClient = new APIClient();

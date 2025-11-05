/**
 * SOTA Tools Integration Layer
 * 
 * Central state management and API integration for all SOTA tools
 * 
 * Features:
 * - Unified API client
 * - Shared state management (React Context + Zustand)
 * - Real-time updates (WebSocket support)
 * - Error handling and retry logic
 * - Caching and optimization
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// API Client Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ============================================================================
// API Client
// ============================================================================

class SOTAToolsAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Evaluation APIs
  // ============================================================================

  // Dataset Generation
  async generateDatasetFromGitHub(params: {
    repoUrl: string;
    branch?: string;
    testPattern?: string;
  }) {
    return this.request('/api/v1/evaluation/datasets/generate/github', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async generateDatasetFromLogs(params: {
    logFiles: string[];
    format?: 'json' | 'csv' | 'text';
  }) {
    return this.request('/api/v1/evaluation/datasets/generate/logs', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Memory-Augmented Evaluation
  async evaluateWithMemory(params: {
    interaction_id: string;
    user_input: string;
    agent_output: string;
    standard?: 'strict' | 'lenient' | 'both';
  }) {
    return this.request('/api/v1/evaluation/memory/evaluate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async bulkEvaluateWithMemory(params: {
    interactions: Array<{
      interaction_id: string;
      user_input: string;
      agent_output: string;
    }>;
    standard?: 'strict' | 'lenient' | 'both';
  }) {
    return this.request('/api/v1/evaluation/memory/evaluate/bulk', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getMemoryStats() {
    return this.request('/api/v1/evaluation/memory/memory/stats');
  }

  // OOD Robustness Testing
  async testOODRobustness(params: {
    interactions: any[];
    features: number[][];
    test_fraction?: number;
  }) {
    return this.request('/api/v1/evaluation/ood/test', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getOODReport() {
    return this.request('/api/v1/evaluation/ood/report');
  }

  async profileDomains(params: {
    interactions: any[];
    features: number[][];
  }) {
    return this.request('/api/v1/evaluation/ood/profile-domains', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============================================================================
  // Optimization APIs
  // ============================================================================

  // Meta-Prompt Optimization
  async optimizePrompt(params: {
    base_prompt: string;
    target_task: string;
    evaluation_dataset: any[];
    num_generations?: number;
    population_size?: number;
  }) {
    return this.request('/api/v1/optimization/prompts/optimize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getPromptEvolutionHistory(runId: string) {
    return this.request(`/api/v1/optimization/prompts/history/${runId}`);
  }

  // Island Evolution
  async runIslandEvolution(params: {
    num_islands?: number;
    population_per_island?: number;
    num_generations?: number;
  }) {
    return this.request('/api/v1/evolution/island/evolve', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getIslandEvolutionStats() {
    return this.request('/api/v1/evolution/island/stats');
  }

  // ============================================================================
  // Execution APIs
  // ============================================================================

  async executeWithArtifacts(params: {
    agent_code: string;
    test_inputs: any[];
  }) {
    return this.request('/api/v1/execution/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async executeFeedbackLoop(params: {
    agent_code: string;
    test_inputs: any[];
    max_iterations?: number;
  }) {
    return this.request('/api/v1/execution/execute/feedback-loop', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async critiqueExecution(params: {
    artifacts: any;
  }) {
    return this.request('/api/v1/execution/critique', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Singleton instance
export const sotaAPI = new SOTAToolsAPI();

// ============================================================================
// Zustand State Management
// ============================================================================

interface EvaluationState {
  // Memory Evaluation
  currentEvaluation: any | null;
  evaluationHistory: any[];
  memoryStats: any | null;
  
  // Actions
  setCurrentEvaluation: (evaluation: any) => void;
  addToHistory: (evaluation: any) => void;
  setMemoryStats: (stats: any) => void;
  clearEvaluationHistory: () => void;
}

export const useEvaluationStore = create<EvaluationState>()(
  devtools(
    persist(
      (set) => ({
        currentEvaluation: null,
        evaluationHistory: [],
        memoryStats: null,

        setCurrentEvaluation: (evaluation) =>
          set({ currentEvaluation: evaluation }),

        addToHistory: (evaluation) =>
          set((state) => ({
            evaluationHistory: [evaluation, ...state.evaluationHistory].slice(0, 50),
          })),

        setMemoryStats: (stats) =>
          set({ memoryStats: stats }),

        clearEvaluationHistory: () =>
          set({ evaluationHistory: [] }),
      }),
      {
        name: 'evaluation-storage',
      }
    )
  )
);

interface OptimizationState {
  // Prompt Evolution
  currentEvolution: any | null;
  evolutionHistory: Record<string, any>;
  isOptimizing: boolean;

  // Island Evolution
  islandData: any | null;
  isIslandRunning: boolean;

  // Actions
  setCurrentEvolution: (evolution: any) => void;
  saveEvolutionRun: (runId: string, data: any) => void;
  setIsOptimizing: (status: boolean) => void;
  setIslandData: (data: any) => void;
  setIsIslandRunning: (status: boolean) => void;
}

export const useOptimizationStore = create<OptimizationState>()(
  devtools(
    persist(
      (set) => ({
        currentEvolution: null,
        evolutionHistory: {},
        isOptimizing: false,
        islandData: null,
        isIslandRunning: false,

        setCurrentEvolution: (evolution) =>
          set({ currentEvolution: evolution }),

        saveEvolutionRun: (runId, data) =>
          set((state) => ({
            evolutionHistory: {
              ...state.evolutionHistory,
              [runId]: data,
            },
          })),

        setIsOptimizing: (status) =>
          set({ isOptimizing: status }),

        setIslandData: (data) =>
          set({ islandData: data }),

        setIsIslandRunning: (status) =>
          set({ isIslandRunning: status }),
      }),
      {
        name: 'optimization-storage',
      }
    )
  )
);

interface OODState {
  // OOD Testing
  currentReport: any | null;
  testHistory: any[];
  domainProfiles: Record<string, any>;
  isTesting: boolean;

  // Actions
  setCurrentReport: (report: any) => void;
  addTestResult: (result: any) => void;
  setDomainProfiles: (profiles: Record<string, any>) => void;
  setIsTesting: (status: boolean) => void;
}

export const useOODStore = create<OODState>()(
  devtools(
    persist(
      (set) => ({
        currentReport: null,
        testHistory: [],
        domainProfiles: {},
        isTesting: false,

        setCurrentReport: (report) =>
          set({ currentReport: report }),

        addTestResult: (result) =>
          set((state) => ({
            testHistory: [result, ...state.testHistory].slice(0, 20),
          })),

        setDomainProfiles: (profiles) =>
          set({ domainProfiles: profiles }),

        setIsTesting: (status) =>
          set({ isTesting: status }),
      }),
      {
        name: 'ood-storage',
      }
    )
  )
);

// ============================================================================
// Custom Hooks for Integration
// ============================================================================

export const useMemoryEvaluation = () => {
  const store = useEvaluationStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const evaluate = async (params: {
    interaction_id: string;
    user_input: string;
    agent_output: string;
    standard?: 'strict' | 'lenient' | 'both';
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sotaAPI.evaluateWithMemory(params);
      store.setCurrentEvaluation(result);
      store.addToHistory(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await sotaAPI.getMemoryStats();
      store.setMemoryStats(stats);
      return stats;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    ...store,
    loading,
    error,
    evaluate,
    loadStats,
  };
};

export const usePromptOptimization = () => {
  const store = useOptimizationStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startOptimization = async (params: {
    base_prompt: string;
    target_task: string;
    evaluation_dataset: any[];
    num_generations?: number;
    population_size?: number;
  }) => {
    setLoading(true);
    setError(null);
    store.setIsOptimizing(true);

    try {
  const result: any = await sotaAPI.optimizePrompt(params);
  store.setCurrentEvolution(result);
  store.saveEvolutionRun(result.run_id, result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      store.setIsOptimizing(false);
    }
  };

  const loadHistory = async (runId: string) => {
    try {
      const history = await sotaAPI.getPromptEvolutionHistory(runId);
      store.setCurrentEvolution(history);
      return history;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    ...store,
    loading,
    error,
    startOptimization,
    loadHistory,
  };
};

export const useOODTesting = () => {
  const store = useOODStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runTest = async (params: {
    interactions: any[];
    features: number[][];
    test_fraction?: number;
  }) => {
    setLoading(true);
    setError(null);
    store.setIsTesting(true);

    try {
      const result = await sotaAPI.testOODRobustness(params);
      store.setCurrentReport(result);
      store.addTestResult(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      store.setIsTesting(false);
    }
  };

  const loadReport = async () => {
    try {
      const report = await sotaAPI.getOODReport();
      store.setCurrentReport(report);
      return report;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    ...store,
    loading,
    error,
    runTest,
    loadReport,
  };
};

export const useIslandEvolution = () => {
  const store = useOptimizationStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startEvolution = async (params: {
    num_islands?: number;
    population_per_island?: number;
    num_generations?: number;
  }) => {
    setLoading(true);
    setError(null);
    store.setIsIslandRunning(true);

    try {
      const result = await sotaAPI.runIslandEvolution(params);
      store.setIslandData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      store.setIsIslandRunning(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await sotaAPI.getIslandEvolutionStats();
      store.setIslandData(stats);
      return stats;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    ...store,
    loading,
    error,
    startEvolution,
    loadStats,
  };
};

// ============================================================================
// WebSocket Support (for real-time updates)
// ============================================================================

export class SOTAWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(url: string = 'ws://localhost:8000/ws') {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(url), 5000);
    };
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    this.ws?.close();
  }
}

export const sotaWS = new SOTAWebSocket();

// ============================================================================
// Error Boundary for SOTA Tools
// ============================================================================

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SOTAErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SOTA Tools Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default {
  sotaAPI,
  useMemoryEvaluation,
  usePromptOptimization,
  useOODTesting,
  useIslandEvolution,
  sotaWS,
  SOTAErrorBoundary,
};

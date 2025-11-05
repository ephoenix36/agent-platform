// API client for the AI Agent Marketplace backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Agents
export async function getAgents(category?: string, limit?: number) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (limit) params.append("limit", limit.toString());
  
  const query = params.toString();
  return fetchAPI(`/agents${query ? `?${query}` : ""}`);
}

export async function getAgent(id: string) {
  return fetchAPI(`/agents/${id}`);
}

export async function getLeaderboard(category?: string, limit: number = 10) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  params.append("limit", limit.toString());
  
  return fetchAPI(`/leaderboard?${params.toString()}`);
}

// Tasks
export async function submitTask(data: {
  user_id: string;
  description: string;
  category?: string;
  max_agents?: number;
}) {
  return fetchAPI("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTaskResult(taskId: string) {
  return fetchAPI(`/tasks/${taskId}`);
}

export async function getTasks(userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.append("user_id", userId);
  
  const query = params.toString();
  return fetchAPI(`/tasks${query ? `?${query}` : ""}`);
}

// Stats
export async function getMarketplaceStats() {
  return fetchAPI("/stats");
}

// Evolution
export async function getEvolutionHistory(agentId: string) {
  return fetchAPI(`/agents/${agentId}/evolution`);
}

// Mock data for development (remove when backend is ready)
export const MOCK_ENABLED = true;

export async function getMockAgents() {
  return {
    agents: [
      {
        id: "1",
        name: "Academic Scholar",
        description: "Expert researcher with access to academic databases and citation tools",
        creator: "research_team",
        category: "research",
        version: "2.1.0",
        performance_score: 92.5,
        tasks_completed: 247,
        success_rate: 0.94,
        avg_response_time: 3.2,
        user_rating: 4.8,
        price_per_execution: 0.15,
        total_earnings: 37.05,
        revenue_30d: 12.50,
        generation: 5,
        model: "gpt-4o",
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      },
      {
        id: "2",
        name: "Code Architect",
        description: "Senior-level code generation and architecture design specialist",
        creator: "dev_labs",
        category: "coding",
        version: "3.0.1",
        performance_score: 88.3,
        tasks_completed: 512,
        success_rate: 0.91,
        avg_response_time: 2.8,
        user_rating: 4.7,
        price_per_execution: 0.12,
        total_earnings: 61.44,
        revenue_30d: 18.30,
        generation: 8,
        model: "gpt-4o",
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      },
      {
        id: "3",
        name: "Data Analyst Pro",
        description: "Professional data analysis with visualization and insights",
        creator: "analytics_inc",
        category: "analysis",
        version: "1.5.2",
        performance_score: 85.7,
        tasks_completed: 189,
        success_rate: 0.89,
        avg_response_time: 4.1,
        user_rating: 4.6,
        price_per_execution: 0.10,
        total_earnings: 18.90,
        revenue_30d: 8.40,
        generation: 3,
        model: "gpt-4o-mini",
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      },
    ],
  };
}

export async function getMockLeaderboard() {
  return {
    leaderboard: [
      {
        rank: 1,
        name: "Academic Scholar",
        category: "research",
        performance_score: "92.5",
        tasks_completed: 247,
        success_rate: "94.0%",
        total_earnings: "$37.05",
        avg_response_time: "3.2s",
      },
      {
        rank: 2,
        name: "Code Architect",
        category: "coding",
        performance_score: "88.3",
        tasks_completed: 512,
        success_rate: "91.0%",
        total_earnings: "$61.44",
        avg_response_time: "2.8s",
      },
      {
        rank: 3,
        name: "Data Analyst Pro",
        category: "analysis",
        performance_score: "85.7",
        tasks_completed: 189,
        success_rate: "89.0%",
        total_earnings: "$18.90",
        avg_response_time: "4.1s",
      },
    ],
  };
}

export async function getMockStats() {
  return {
    total_agents: 47,
    active_agents: 42,
    total_tasks_executed: 1523,
    total_revenue: 234.56,
    total_earnings_paid: 164.19,
    evolution_runs: 23,
    avg_agent_performance: 78.4,
    top_performer: "Academic Scholar",
    categories: {
      research: 12,
      coding: 8,
      analysis: 6,
      writing: 5,
      design: 4,
      marketing: 3,
      other: 9,
    },
  };
}

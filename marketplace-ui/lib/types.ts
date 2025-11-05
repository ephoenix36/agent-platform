// Type definitions for the AI Agent Marketplace

export enum AgentCategory {
  RESEARCH = "research",
  CODING = "coding",
  DESIGN = "design",
  MARKETING = "marketing",
  WRITING = "writing",
  ANALYSIS = "analysis",
  CUSTOMER_SERVICE = "customer-service",
  PERSONAL_ASSISTANT = "personal-assistant",
  EDUCATION = "education",
  IMAGE_PROCESSING = "image-processing",
  OTHER = "other",
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  creator: string;
  category: AgentCategory;
  version: string;
  
  // Performance metrics
  performance_score: number; // 0-100
  tasks_completed: number;
  success_rate: number; // 0-1
  avg_response_time: number; // seconds
  user_rating: number; // 1-5 stars
  
  // Economics
  price_per_execution: number; // USD
  total_earnings: number;
  revenue_30d: number;
  
  // Evolution
  generation: number;
  parent_agents: string[];
  mutations: string[];
  
  // Implementation
  system_prompt: string;
  tools: string[];
  model: string;
  parameters: Record<string, any>;
  
  // Metadata
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  description: string;
  category: AgentCategory;
  status: TaskStatus;
  selected_agents: string[];
  created_at: string;
  completed_at?: string;
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface TaskResult {
  task_id: string;
  category: string;
  description: string;
  agents_executed: number;
  successful_executions: number;
  winner?: {
    agent_id: string;
    agent_name: string;
    fitness_score: number;
    output: string;
  };
  all_results: AgentResult[];
  payment?: PaymentInfo;
  total_cost: number;
  total_time: number;
  timestamp: string;
}

export interface AgentResult {
  agent_name: string;
  success: boolean;
  fitness: number;
  quality: number;
  time: number;
  cost: number;
}

export interface PaymentInfo {
  base_price: number;
  llm_cost: number;
  total_charge: number;
  platform_fee: number;
  creator_payout: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  category: string;
  performance_score: string;
  tasks_completed: number;
  success_rate: string;
  total_earnings: string;
  avg_response_time: string;
}

export interface MarketplaceStats {
  total_agents: number;
  active_agents: number;
  total_tasks_executed: number;
  total_revenue: number;
  total_earnings_paid: number;
  evolution_runs: number;
  avg_agent_performance: number;
  top_performer: string | null;
  categories: Record<string, number>;
}

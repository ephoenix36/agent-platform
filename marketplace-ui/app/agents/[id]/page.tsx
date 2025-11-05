"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Zap,
  Award,
  Code,
  BarChart3
} from "lucide-react";
import { formatCurrency, formatPercentage, formatRelativeTime } from "@/lib/utils";

// Mock agent detail fetcher
async function getAgentDetail(id: string) {
  // In production, this would call the API
  return {
    id,
    name: "Academic Scholar",
    description: "Expert researcher with access to academic databases and citation tools. Specializes in comprehensive literature reviews, data synthesis, and evidence-based analysis.",
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
    parent_agents: ["research_bot_v1", "academic_assistant"],
    mutations: ["Enhanced citation format", "Improved source verification"],
    model: "gpt-4o",
    parameters: {
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 0.9
    },
    system_prompt: `You are an expert academic researcher with deep knowledge across multiple domains.

Your capabilities:
- Comprehensive literature reviews
- Evidence synthesis
- Citation management
- Data analysis
- Critical evaluation

Always provide well-sourced, accurate, and objective analysis.`,
    tools: ["web_search", "citation_formatter", "database_access"],
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    recent_tasks: [
      {
        id: "1",
        description: "Research quantum computing applications",
        score: 95.2,
        time: 2.8,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "2",
        description: "Analyze climate change research trends",
        score: 91.7,
        time: 3.5,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "3",
        description: "Review AI ethics literature",
        score: 93.4,
        time: 3.1,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    performance_history: [
      { date: "Week 1", score: 88.5 },
      { date: "Week 2", score: 90.2 },
      { date: "Week 3", score: 91.8 },
      { date: "Week 4", score: 92.5 }
    ]
  };
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: agent, error, isLoading } = useSWR(`agent-${id}`, () => getAgentDetail(id));

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="stat-card text-center py-12">
          <p className="text-destructive">Agent not found</p>
          <Link href="/agents" className="text-primary hover:underline mt-4 inline-block">
            ← Back to agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Link
        href="/agents"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to agents
      </Link>

      {/* Header */}
      <div className="stat-card mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <span className="badge-primary">{agent.category}</span>
              {agent.is_active && (
                <span className="flex items-center space-x-1 text-xs text-green-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>Active</span>
                </span>
              )}
            </div>
            <p className="text-muted-foreground mb-4">by {agent.creator} • v{agent.version}</p>
            <p className="text-lg">{agent.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-4xl font-bold text-primary">
              {agent.performance_score.toFixed(1)}
              <span className="text-xl text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.floor(agent.user_rating) ? "fill-current" : ""}`}
                />
              ))}
              <span className="ml-2 text-foreground font-semibold">{agent.user_rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Metrics */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tasks Completed</span>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{agent.tasks_completed}</div>
                <div className="text-xs text-green-600 mt-1">+23 this month</div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{formatPercentage(agent.success_rate)}</div>
                <div className="text-xs text-green-600 mt-1">+2% vs last month</div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{agent.avg_response_time.toFixed(1)}s</div>
                <div className="text-xs text-green-600 mt-1">-0.3s vs last month</div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Price per Task</span>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(agent.price_per_execution)}</div>
                <div className="text-xs text-muted-foreground mt-1">Competitive pricing</div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Performance</h2>
            <div className="stat-card">
              <div className="space-y-4">
                {agent.recent_tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{task.description}</p>
                      <p className="text-sm text-muted-foreground">{formatRelativeTime(task.timestamp)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary">{task.score.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">score</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{task.time.toFixed(1)}s</div>
                        <div className="text-xs text-muted-foreground">time</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <h2 className="text-2xl font-bold mb-4">System Configuration</h2>
            <div className="stat-card">
              <h3 className="font-semibold mb-2 flex items-center">
                <Code className="h-4 w-4 mr-2" />
                System Prompt
              </h3>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {agent.system_prompt}
              </pre>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Model Parameters</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{agent.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperature:</span>
                      <span className="font-medium">{agent.parameters.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Tokens:</span>
                      <span className="font-medium">{agent.parameters.max_tokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Top P:</span>
                      <span className="font-medium">{agent.parameters.top_p}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tools & Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((tool: string) => (
                      <span key={tool} className="badge-primary">{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CTA */}
          <div className="stat-card bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <h3 className="font-semibold mb-2">Use This Agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Submit a task and let this agent compete to solve it
            </p>
            <Link
              href={`/tasks/new?agent=${agent.id}`}
              className="block w-full text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Submit Task
            </Link>
          </div>

          {/* Earnings */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Creator Earnings
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(agent.total_earnings)}
                </div>
                <div className="text-xs text-muted-foreground">Total earnings</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {formatCurrency(agent.revenue_30d)}
                </div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
              </div>
            </div>
          </div>

          {/* Evolution */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              Evolution History
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">Generation {agent.generation}</div>
                <div className="text-xs text-muted-foreground">Current version</div>
              </div>
              
              {agent.parent_agents.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Parent Agents:</div>
                  <div className="space-y-1">
                    {agent.parent_agents.map((parent: string) => (
                      <div key={parent} className="text-xs text-muted-foreground">
                        • {parent}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {agent.mutations.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Recent Mutations:</div>
                  <div className="space-y-1">
                    {agent.mutations.map((mutation: string) => (
                      <div key={mutation} className="text-xs badge-success">
                        {mutation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="stat-card">
            <h3 className="font-semibold mb-3">Agent Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatRelativeTime(agent.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{formatRelativeTime(agent.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>{agent.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

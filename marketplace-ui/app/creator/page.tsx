"use client";

import { useState } from "react";
import useSWR from "swr";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  Trophy,
  Zap,
  Plus,
  BarChart3,
  Settings
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock creator dashboard data
async function getCreatorDashboard() {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    creator: {
      username: "research_team",
      joined: "2024-08-15",
      total_agents: 3,
      active_agents: 3,
    },
    earnings: {
      total: 37.05,
      this_month: 12.50,
      last_month: 9.30,
      pending: 2.15,
    },
    performance: {
      avg_score: 91.2,
      total_tasks: 489,
      success_rate: 0.93,
      avg_rating: 4.7,
    },
    agents: [
      {
        id: "1",
        name: "Academic Scholar",
        category: "research",
        performance_score: 92.5,
        tasks_completed: 247,
        earnings: 37.05,
        status: "active",
        trend: "+5.2%"
      },
      {
        id: "2",
        name: "Research Assistant Pro",
        category: "research",
        performance_score: 89.8,
        tasks_completed: 189,
        earnings: 28.35,
        status: "active",
        trend: "+3.1%"
      },
      {
        id: "3",
        name: "Citation Expert",
        category: "research",
        performance_score: 91.3,
        tasks_completed: 53,
        earnings: 7.95,
        status: "active",
        trend: "+12.4%"
      },
    ],
    earnings_history: [
      { date: "Week 1", earnings: 6.20 },
      { date: "Week 2", earnings: 7.80 },
      { date: "Week 3", earnings: 9.50 },
      { date: "Week 4", earnings: 12.50 },
    ],
    top_performing_tasks: [
      {
        task_id: "t1",
        description: "Research quantum computing applications",
        agent: "Academic Scholar",
        score: 95.2,
        earnings: 0.11,
      },
      {
        task_id: "t2",
        description: "Analyze AI research trends",
        agent: "Citation Expert",
        score: 94.7,
        earnings: 0.11,
      },
      {
        task_id: "t3",
        description: "Literature review on climate models",
        agent: "Research Assistant Pro",
        score: 93.8,
        earnings: 0.11,
      },
    ]
  };
}

export default function CreatorDashboard() {
  const { data, error, isLoading } = useSWR("creator-dashboard", getCreatorDashboard);
  const [timeRange, setTimeRange] = useState("30d");

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="stat-card text-center py-12">
          <p className="text-destructive">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold">{data.creator.username}</span>
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Link
            href="/creator/new-agent"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Link>
          <button className="inline-flex items-center px-4 py-2 rounded-lg border hover:bg-muted transition-colors font-medium">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Earnings</span>
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(data.earnings.total)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            +{formatCurrency(data.earnings.this_month)} this month
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Active Agents</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold">
            {data.creator.active_agents}
            <span className="text-lg text-muted-foreground">/{data.creator.total_agents}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            All agents performing well
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Avg Performance</span>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-primary">
            {data.performance.avg_score.toFixed(1)}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Top 10% of creators
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tasks Completed</span>
            <Activity className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-3xl font-bold">
            {data.performance.total_tasks}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatPercentage(data.performance.success_rate)} success rate
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="stat-card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Earnings Trend</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 rounded-lg border bg-background text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.earnings_history}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Your Agents */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Your Agents</h2>
          <div className="space-y-4">
            {data.agents.map((agent: any) => (
              <div key={agent.id} className="stat-card card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        {agent.name}
                      </Link>
                      <span className="badge-primary">{agent.category}</span>
                      <span className="badge-success">{agent.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Performance</div>
                        <div className="text-lg font-semibold text-primary">
                          {agent.performance_score.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Tasks</div>
                        <div className="text-lg font-semibold">
                          {agent.tasks_completed}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Earnings</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(agent.earnings)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Trend</div>
                        <div className="text-lg font-semibold text-green-600">
                          {agent.trend}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="px-3 py-1 text-sm rounded-lg border hover:bg-muted transition-colors"
                    >
                      View
                    </Link>
                    <button className="px-3 py-1 text-sm rounded-lg border hover:bg-muted transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Performing Tasks */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4 flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Top Performances
            </h3>
            <div className="space-y-3">
              {data.top_performing_tasks.map((task: any) => (
                <div key={task.task_id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-1 line-clamp-1">
                    {task.description}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{task.agent}</span>
                    <span className="font-semibold text-primary">{task.score.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Earned {formatCurrency(task.earnings)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Earnings */}
          <div className="stat-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <h3 className="font-semibold mb-2">Pending Payout</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(data.earnings.pending)}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Will be paid within 7 days
            </p>
            <button className="w-full px-4 py-2 rounded-lg border-2 border-green-600 text-green-600 hover:bg-green-500/10 transition-colors font-medium">
              View Details
            </button>
          </div>

          {/* Quick Stats */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Rating:</span>
                <span className="font-semibold">{data.performance.avg_rating} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className="font-semibold text-green-600">
                  {formatPercentage(data.performance.success_rate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Month:</span>
                <span className="font-semibold">
                  {formatCurrency(data.earnings.last_month)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">This Month:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(data.earnings.this_month)}
                </span>
              </div>
            </div>
          </div>

          {/* Evolution Tip */}
          <div className="stat-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Evolution Active</h4>
                <p className="text-sm text-muted-foreground">
                  Your agents are automatically evolving to improve performance. Next evolution run in 6 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

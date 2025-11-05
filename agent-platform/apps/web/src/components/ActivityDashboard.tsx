/**
 * Activity Dashboard
 * Real-time monitoring and analytics for agents and workflows
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Clock, Zap,
  CheckCircle, XCircle, AlertTriangle, Eye, Play, Pause,
  BarChart3, LineChart, PieChart, Download, Filter, RefreshCw,
  Users, Workflow, Cpu, Database, Network
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

interface AgentActivity {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  executionsToday: number;
  avgResponseTime: number;
  successRate: number;
  cost: number;
}

interface WorkflowActivity {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  nodesCompleted: number;
  totalNodes: number;
  startTime: string;
  estimatedCompletion: string;
}

export function ActivityDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'performance' | 'quality'>('cost');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [activeAgents, setActiveAgents] = useState<AgentActivity[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowActivity[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/telemetry/dashboard/overview?hours=${timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720}`);
        const data = await response.json();
        
        // Update metrics
        setMetrics([
          {
            label: 'Total Executions',
            value: data.total_executions || 0,
            change: 12.5,
            trend: 'up',
            icon: Activity,
            color: 'blue',
          },
          {
            label: 'Total Cost',
            value: `$${(data.total_cost || 0).toFixed(2)}`,
            change: -8.3,
            trend: 'down',
            icon: DollarSign,
            color: 'green',
          },
          {
            label: 'Avg Response Time',
            value: `${(data.avg_response_time || 0).toFixed(0)}ms`,
            change: -15.2,
            trend: 'down',
            icon: Clock,
            color: 'purple',
          },
          {
            label: 'Success Rate',
            value: `${((data.avg_success_rate || 0) * 100).toFixed(1)}%`,
            change: 3.7,
            trend: 'up',
            icon: CheckCircle,
            color: 'emerald',
          },
        ]);
        
        // Mock active agents data
        setActiveAgents([
          {
            id: 'agent-1',
            name: 'Code Review Agent',
            status: 'running',
            executionsToday: 47,
            avgResponseTime: 1250,
            successRate: 98.5,
            cost: 0.43,
          },
          {
            id: 'agent-2',
            name: 'Documentation Generator',
            status: 'idle',
            executionsToday: 23,
            avgResponseTime: 2100,
            successRate: 95.2,
            cost: 0.28,
          },
          {
            id: 'agent-3',
            name: 'Data Analysis Agent',
            status: 'running',
            executionsToday: 65,
            avgResponseTime: 3400,
            successRate: 92.1,
            cost: 0.67,
          },
        ]);
        
        // Mock active workflows
        setActiveWorkflows([
          {
            id: 'wf-1',
            name: 'Full Stack App Generation',
            status: 'running',
            progress: 67,
            nodesCompleted: 4,
            totalNodes: 6,
            startTime: '10 minutes ago',
            estimatedCompletion: '5 minutes',
          },
          {
            id: 'wf-2',
            name: 'API Integration Pipeline',
            status: 'running',
            progress: 34,
            nodesCompleted: 2,
            totalNodes: 5,
            startTime: '3 minutes ago',
            estimatedCompletion: '8 minutes',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
    
    // Auto-refresh every 5 seconds if enabled
    const interval = isAutoRefresh ? setInterval(fetchDashboardData, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRange, isAutoRefresh]);

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'idle':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      case 'error':
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'completed':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Real-time monitoring and analytics</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
              {(['1h', '24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Auto Refresh */}
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`p-2.5 rounded-lg transition-all ${
                isAutoRefresh
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
              title={isAutoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <RefreshCw className={`w-5 h-5 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Filter */}
            <button className="p-2.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            
            {/* Export */}
            <button className="p-2.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;
          const changeColor = metric.label === 'Total Cost' 
            ? (metric.trend === 'down' ? 'text-green-400' : 'text-red-400')
            : (metric.trend === 'up' ? 'text-green-400' : 'text-red-400');
          
          return (
            <div
              key={index}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${metric.color}-500/20 rounded-lg`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-400`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${changeColor}`}>
                  {getTrendIcon(metric.trend)}
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{metric.value}</div>
              <div className="text-sm text-gray-400">{metric.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Active Agents
            </h2>
            <button className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {activeAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'running' ? 'bg-green-400 animate-pulse' :
                      agent.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-400">
                        {agent.executionsToday} executions today
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-gray-400">Avg Time</div>
                    <div className="font-medium">{agent.avgResponseTime}ms</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-gray-400">Success</div>
                    <div className="font-medium text-green-400">{agent.successRate}%</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2">
                    <div className="text-gray-400">Cost</div>
                    <div className="font-medium">${agent.cost.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Workflows */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Workflow className="w-5 h-5 text-purple-400" />
              Active Workflows
            </h2>
            <button className="text-sm text-purple-400 hover:text-purple-300">
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {activeWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-xs text-gray-400">
                      Started {workflow.startTime}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(workflow.status)}`}>
                    {workflow.status}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">
                      {workflow.nodesCompleted}/{workflow.totalNodes} nodes
                    </span>
                    <span className="text-purple-400">{workflow.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${workflow.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {workflow.estimatedCompletion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                      <Pause className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        {/* Cost Breakdown */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-green-400" />
            Cost by Provider
          </h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-400" />
            Response Time Trends
          </h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Success Rate by Agent
          </h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[
          { label: 'CPU Usage', value: '45%', icon: Cpu, color: 'blue' },
          { label: 'Memory', value: '2.4/8 GB', icon: Database, color: 'purple' },
          { label: 'Network', value: '1.2 MB/s', icon: Network, color: 'green' },
          { label: 'Queue Depth', value: '12 tasks', icon: Activity, color: 'yellow' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  <div className="text-xl font-bold mt-1">{stat.value}</div>
                </div>
                <Icon className={`w-8 h-8 text-${stat.color}-400 opacity-50`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityDashboard;

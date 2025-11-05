'use client';

import React, { useState } from 'react';
import {
  BarChart3, DollarSign, TrendingUp, Users, Eye, Download,
  Settings, Plus, Edit, Trash2, Copy, Share2, Lock, Unlock,
  Clock, Star, AlertCircle, CheckCircle, GitBranch, Code,
  Zap, Activity, Filter, Search, Calendar, ArrowUpRight
} from 'lucide-react';

interface CreatorAgent {
  id: string;
  name: string;
  type: 'agent' | 'workflow' | 'tool';
  status: 'published' | 'draft' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  
  analytics: {
    views: number;
    runs: number;
    favorites: number;
    revenue: number;
    rating: number;
    reviews: number;
  };
  
  performance: {
    successRate: number;
    avgResponseTime: number;
    uptime: number;
  };
  
  pricing: {
    type: 'free' | 'paid';
    amount?: number;
  };
  
  versions: number;
  lastUpdated: string;
  createdAt: string;
}

export function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'analytics' | 'revenue' | 'settings'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock data - would come from API
  const [agents] = useState<CreatorAgent[]>([
    {
      id: '1',
      name: 'Website Builder Pro',
      type: 'agent',
      status: 'published',
      visibility: 'public',
      analytics: {
        views: 15432,
        runs: 8934,
        favorites: 1245,
        revenue: 22350,
        rating: 4.9,
        reviews: 234
      },
      performance: {
        successRate: 99.2,
        avgResponseTime: 2.3,
        uptime: 99.9
      },
      pricing: {
        type: 'paid',
        amount: 2.50
      },
      versions: 12,
      lastUpdated: '2025-10-28',
      createdAt: '2025-08-15'
    },
    {
      id: '2',
      name: 'Research Assistant',
      type: 'agent',
      status: 'published',
      visibility: 'public',
      analytics: {
        views: 8932,
        runs: 12456,
        favorites: 892,
        revenue: 0,
        rating: 4.7,
        reviews: 156
      },
      performance: {
        successRate: 97.8,
        avgResponseTime: 1.8,
        uptime: 99.5
      },
      pricing: {
        type: 'free'
      },
      versions: 8,
      lastUpdated: '2025-10-25',
      createdAt: '2025-09-01'
    }
  ]);

  const totalRevenue = agents.reduce((sum, agent) => sum + agent.analytics.revenue, 0);
  const totalRuns = agents.reduce((sum, agent) => sum + agent.analytics.runs, 0);
  const totalUsers = agents.reduce((sum, agent) => sum + agent.analytics.favorites, 0);
  const avgRating = agents.reduce((sum, agent) => sum + agent.analytics.rating, 0) / agents.length;

  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
              <p className="text-gray-400">Manage your agents, track analytics, and grow your revenue</p>
            </div>

            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Agent
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {(['overview', 'agents', 'analytics', 'revenue', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Total Revenue</div>
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400 mb-1">
                  ${totalRevenue.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+23% this month</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Total Runs</div>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {totalRuns.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-blue-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+15% this month</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Active Users</div>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {totalUsers.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-purple-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+31% this month</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Avg Rating</div>
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {avgRating.toFixed(1)}/5
                </div>
                <div className="text-sm text-gray-400">
                  Across {agents.reduce((sum, a) => sum + a.analytics.reviews, 0)} reviews
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Revenue Trend
                </h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[420, 680, 890, 1120, 1580, 2240, 2890].map((value, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-500 hover:to-green-300"
                        style={{ height: `${(value / 2890) * 100}%` }}
                      />
                      <div className="text-xs text-gray-400">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Usage Analytics
                </h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[1200, 1450, 1680, 2100, 2450, 2890, 3240].map((value, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-500 hover:to-blue-300"
                        style={{ height: `${(value / 3240) * 100}%` }}
                      />
                      <div className="text-xs text-gray-400">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { type: 'revenue', text: 'Earned $12.50 from Website Builder Pro', time: '5 min ago', icon: DollarSign, color: 'text-green-400' },
                  { type: 'review', text: 'New 5-star review on Research Assistant', time: '1 hour ago', icon: Star, color: 'text-yellow-400' },
                  { type: 'run', text: '50 new runs on Website Builder Pro', time: '2 hours ago', icon: Activity, color: 'text-blue-400' },
                  { type: 'favorite', text: '23 users favorited Research Assistant', time: '4 hours ago', icon: Users, color: 'text-purple-400' }
                ].map((activity, idx) => {
                  const Icon = activity.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className={`p-2 bg-gray-800 rounded-lg ${activity.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-200">{activity.text}</div>
                        <div className="text-sm text-gray-400">{activity.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option>All Types</option>
                  <option>Agents</option>
                  <option>Workflows</option>
                  <option>Tools</option>
                </select>

                <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option>All Status</option>
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Archived</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>

            {/* Agents List */}
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-gray-800/30 rounded-xl p-6 hover:bg-gray-800/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{agent.name}</h3>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          agent.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          agent.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {agent.status}
                        </span>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          agent.type === 'agent' ? 'bg-blue-500/20 text-blue-400' :
                          agent.type === 'workflow' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {agent.type}
                        </span>

                        {agent.visibility === 'private' ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Unlock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {agent.analytics.views.toLocaleString()} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {agent.analytics.runs.toLocaleString()} runs
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          {agent.analytics.rating} ({agent.analytics.reviews} reviews)
                        </div>
                        {agent.analytics.revenue > 0 && (
                          <div className="flex items-center gap-1 text-green-400">
                            <DollarSign className="w-4 h-4" />
                            ${agent.analytics.revenue.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                      <div className="text-lg font-bold text-green-400">
                        {agent.performance.successRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Avg Response</div>
                      <div className="text-lg font-bold text-blue-400">
                        {agent.performance.avgResponseTime}s
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Uptime</div>
                      <div className="text-lg font-bold text-purple-400">
                        {agent.performance.uptime}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" />
                        {agent.versions} versions
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Updated {new Date(agent.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>

                    <button className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                      View Details
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'analytics' && (
          <div className="text-center py-20 text-gray-400">
            Advanced analytics dashboard coming soon...
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Revenue Breakdown</h3>
              <div className="text-center py-12 text-gray-400">
                Revenue analytics and payout management coming soon...
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-800/30 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Creator Settings</h3>
            <div className="text-center py-12 text-gray-400">
              Profile settings, payment methods, and preferences coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

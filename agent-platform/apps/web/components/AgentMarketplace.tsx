'use client';

import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, Clock, DollarSign, Users, Filter, Zap } from 'lucide-react';

interface AgentMetrics {
  successRate: number;
  avgResponseTime: number;
  costPerRun: number;
  totalRuns: number;
  satisfaction: number;
  activeUsers: number;
}

interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  protocol: 'mcp' | 'crewai' | 'langchain' | 'langgraph';
  creator: {
    name: string;
    verified: boolean;
    avatar?: string;
  };
  metrics: AgentMetrics;
  tags: string[];
  price: {
    type: 'free' | 'one-time' | 'subscription' | 'usage-based';
    amount?: number;
  };
  featured: boolean;
  trending: boolean;
}

export default function AgentMarketplace() {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'performance' | 'trending' | 'newest' | 'price'>('performance');

  // Mock data - will be replaced with API calls
  useEffect(() => {
    setAgents([
      {
        id: '1',
        name: 'Research Agent Pro',
        description: 'Advanced research agent with web search, document analysis, and summarization',
        category: 'Research',
        protocol: 'mcp',
        creator: {
          name: 'AI Research Lab',
          verified: true,
        },
        metrics: {
          successRate: 98.7,
          avgResponseTime: 2.3,
          costPerRun: 0.005,
          totalRuns: 1245632,
          satisfaction: 4.9,
          activeUsers: 12453,
        },
        tags: ['research', 'web-search', 'analysis'],
        price: {
          type: 'usage-based',
          amount: 0.005,
        },
        featured: true,
        trending: true,
      },
      {
        id: '2',
        name: 'Data Analyst Crew',
        description: 'Multi-agent crew for comprehensive data analysis and visualization',
        category: 'Analytics',
        protocol: 'crewai',
        creator: {
          name: 'DataViz Studio',
          verified: true,
        },
        metrics: {
          successRate: 96.2,
          avgResponseTime: 4.8,
          costPerRun: 0.012,
          totalRuns: 874123,
          satisfaction: 4.8,
          activeUsers: 8741,
        },
        tags: ['analytics', 'visualization', 'data'],
        price: {
          type: 'subscription',
          amount: 29,
        },
        featured: false,
        trending: true,
      },
      {
        id: '3',
        name: 'Customer Support Bot',
        description: 'LangChain-powered support agent with knowledge base integration',
        category: 'Support',
        protocol: 'langchain',
        creator: {
          name: 'SupportAI',
          verified: true,
        },
        metrics: {
          successRate: 94.5,
          avgResponseTime: 1.9,
          costPerRun: 0.003,
          totalRuns: 2341567,
          satisfaction: 4.7,
          activeUsers: 15234,
        },
        tags: ['support', 'chatbot', 'knowledge-base'],
        price: {
          type: 'free',
        },
        featured: true,
        trending: false,
      },
    ]);
  }, []);

  const categories = ['all', 'Research', 'Analytics', 'Support', 'Development', 'Marketing', 'Sales'];

  const filteredAgents = agents
    .filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.metrics.successRate - a.metrics.successRate;
        case 'trending':
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
        case 'newest':
          return 0; // Would sort by creation date
        case 'price':
          return (a.price.amount || 0) - (b.price.amount || 0);
        default:
          return 0;
      }
    });

  const getPerformanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-400';
    if (rate >= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="h-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold mb-2">Agent Marketplace</h1>
        <p className="text-gray-300">Discover benchmark-leading AI agents</p>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="performance">Top Performance</option>
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="price">Price</option>
          </select>

          <button className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer group"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                        {agent.name}
                      </h3>
                      {agent.trending && (
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{agent.creator.name}</span>
                      {agent.creator.verified && (
                        <span className="text-blue-400">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">
                      {agent.metrics.satisfaction.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {agent.description}
                </p>
              </div>

              {/* Metrics */}
              <div className="p-4 bg-gray-900/50">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Success Rate</div>
                    <div className={`font-semibold ${getPerformanceColor(agent.metrics.successRate)}`}>
                      {agent.metrics.successRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Avg Time</div>
                    <div className="font-semibold text-blue-400">
                      {agent.metrics.avgResponseTime}s
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Total Runs</div>
                    <div className="font-semibold text-purple-400">
                      {formatNumber(agent.metrics.totalRuns)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Active Users</div>
                    <div className="font-semibold text-green-400">
                      {formatNumber(agent.metrics.activeUsers)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-1">
                  {agent.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-800/50 flex items-center justify-between">
                <div>
                  {agent.price.type === 'free' && (
                    <span className="text-green-400 font-semibold">FREE</span>
                  )}
                  {agent.price.type === 'usage-based' && (
                    <span className="text-blue-400 font-semibold">
                      ${agent.price.amount}/run
                    </span>
                  )}
                  {agent.price.type === 'subscription' && (
                    <span className="text-purple-400 font-semibold">
                      ${agent.price.amount}/mo
                    </span>
                  )}
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Try Now
                </button>
              </div>

              {/* SLA Badge */}
              {agent.metrics.successRate >= 95 && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded font-semibold">
                  SLA ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No agents found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, Clock, DollarSign, Users, Filter, Zap, Shield, CheckCircle, Sparkles, Grid3x3, Workflow, Code2, ArrowRight, ChevronDown, Eye, Download, Play } from 'lucide-react';

interface SecurityInfo {
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  scannedAt: string;
}

interface Metrics {
  successRate: number;
  avgResponseTime: number;
  costPerRun: number;
  totalRuns: number;
  satisfaction: number;
  activeUsers: number;
}

interface Creator {
  name: string;
  verified: boolean;
  avatar?: string;
  totalCreations?: number;
}

type OfferingType = 'agent' | 'workflow' | 'tool';

interface MarketplaceOffering {
  id: string;
  type: OfferingType;
  name: string;
  description: string;
  category: string;
  protocol?: 'mcp' | 'crewai' | 'langchain' | 'langgraph';
  creator: Creator;
  metrics: Metrics;
  security: SecurityInfo;
  tags: string[];
  price: {
    type: 'free' | 'one-time' | 'subscription' | 'usage-based';
    amount?: number;
  };
  featured: boolean;
  trending: boolean;
  preview?: string;
  icon?: string;
}

export default function UnifiedMarketplace() {
  const [offerings, setOfferings] = useState<MarketplaceOffering[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<OfferingType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'performance' | 'trending' | 'newest' | 'price'>('trending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const categories = ['all', 'productivity', 'research', 'analytics', 'support', 'automation', 'creative'];
  
  const typeIcons = {
    agent: Grid3x3,
    workflow: Workflow,
    tool: Code2
  };

  useEffect(() => {
    // Premium demo data with diverse offerings
    setOfferings([
      // AGENTS
      {
        id: '1',
        type: 'agent',
        name: 'Website Builder Pro',
        description: 'Complete website creation from concept to deployment. Generates designs, writes code, optimizes SEO, and deploys automatically.',
        category: 'creative',
        protocol: 'crewai',
        creator: { name: 'BuilderAI Labs', verified: true, totalCreations: 47 },
        metrics: {
          successRate: 99.2,
          avgResponseTime: 45.3,
          costPerRun: 2.50,
          totalRuns: 15432,
          satisfaction: 4.9,
          activeUsers: 3241,
        },
        security: { score: 98.7, level: 'safe', verified: true, scannedAt: '2025-10-29T10:00:00Z' },
        tags: ['web-design', 'deployment', 'seo', 'responsive'],
        price: { type: 'usage-based', amount: 2.50 },
        featured: true,
        trending: true,
        icon: '🌐'
      },
      {
        id: '2',
        type: 'agent',
        name: 'Business Plan Generator',
        description: 'AI-powered business plan creation with market research, financial projections, and competitive analysis.',
        category: 'productivity',
        protocol: 'langchain',
        creator: { name: 'EntrepreneurAI', verified: true, totalCreations: 23 },
        metrics: {
          successRate: 97.8,
          avgResponseTime: 120.5,
          costPerRun: 5.00,
          totalRuns: 8932,
          satisfaction: 4.8,
          activeUsers: 1876,
        },
        security: { score: 96.5, level: 'safe', verified: true, scannedAt: '2025-10-28T14:30:00Z' },
        tags: ['business', 'planning', 'finance', 'market-research'],
        price: { type: 'usage-based', amount: 5.00 },
        featured: true,
        trending: true,
        icon: '📊'
      },
      {
        id: '3',
        type: 'agent',
        name: 'Research Agent Pro',
        description: 'Advanced research agent with web search, document analysis, and summarization capabilities.',
        category: 'research',
        protocol: 'mcp',
        creator: { name: 'AI Research Lab', verified: true, totalCreations: 89 },
        metrics: {
          successRate: 98.7,
          avgResponseTime: 2.3,
          costPerRun: 0.005,
          totalRuns: 1245632,
          satisfaction: 4.9,
          activeUsers: 12453,
        },
        security: { score: 98.5, level: 'safe', verified: true, scannedAt: '2025-10-29T10:00:00Z' },
        tags: ['research', 'web-search', 'analysis'],
        price: { type: 'usage-based', amount: 0.005 },
        featured: true,
        trending: true,
        icon: '🔍'
      },
      
      // WORKFLOWS
      {
        id: '4',
        type: 'workflow',
        name: 'Complete Marketing Funnel',
        description: 'End-to-end marketing automation: content creation → ad campaigns → lead nurturing → conversion tracking.',
        category: 'automation',
        creator: { name: 'MarketingAI Co', verified: true, totalCreations: 34 },
        metrics: {
          successRate: 96.3,
          avgResponseTime: 180.2,
          costPerRun: 15.00,
          totalRuns: 5621,
          satisfaction: 4.7,
          activeUsers: 892,
        },
        security: { score: 95.8, level: 'safe', verified: true, scannedAt: '2025-10-27T09:15:00Z' },
        tags: ['marketing', 'automation', 'conversion', 'analytics'],
        price: { type: 'subscription', amount: 199 },
        featured: true,
        trending: true,
        icon: '📈'
      },
      {
        id: '5',
        type: 'workflow',
        name: 'Customer Service Automation',
        description: 'Complete customer support flow: ticket intake → AI response → escalation → satisfaction survey.',
        category: 'support',
        creator: { name: 'SupportFlow AI', verified: true, totalCreations: 18 },
        metrics: {
          successRate: 94.2,
          avgResponseTime: 5.8,
          costPerRun: 0.50,
          totalRuns: 89234,
          satisfaction: 4.6,
          activeUsers: 2341,
        },
        security: { score: 97.1, level: 'safe', verified: true, scannedAt: '2025-10-26T16:20:00Z' },
        tags: ['support', 'automation', 'tickets', 'satisfaction'],
        price: { type: 'subscription', amount: 99 },
        featured: false,
        trending: true,
        icon: '💬'
      },
      
      // TOOLS (MCP)
      {
        id: '6',
        type: 'tool',
        name: 'Stripe Payment Connector',
        description: 'Secure Stripe integration for processing payments, subscriptions, and invoices.',
        category: 'productivity',
        protocol: 'mcp',
        creator: { name: 'PaymentTools Inc', verified: true, totalCreations: 12 },
        metrics: {
          successRate: 99.8,
          avgResponseTime: 0.8,
          costPerRun: 0.01,
          totalRuns: 456789,
          satisfaction: 5.0,
          activeUsers: 8934,
        },
        security: { score: 99.5, level: 'safe', verified: true, scannedAt: '2025-10-29T08:00:00Z' },
        tags: ['payments', 'stripe', 'billing', 'subscriptions'],
        price: { type: 'free' },
        featured: true,
        trending: false,
        icon: '💳'
      },
      {
        id: '7',
        type: 'tool',
        name: 'Database Query Tool',
        description: 'Safe SQL query builder with natural language interface and automatic query optimization.',
        category: 'analytics',
        protocol: 'mcp',
        creator: { name: 'DataTools Pro', verified: true, totalCreations: 28 },
        metrics: {
          successRate: 98.1,
          avgResponseTime: 1.2,
          costPerRun: 0.02,
          totalRuns: 234567,
          satisfaction: 4.8,
          activeUsers: 5432,
        },
        security: { score: 97.9, level: 'safe', verified: true, scannedAt: '2025-10-28T11:45:00Z' },
        tags: ['database', 'sql', 'queries', 'analytics'],
        price: { type: 'usage-based', amount: 0.02 },
        featured: false,
        trending: false,
        icon: '🗄️'
      },
    ]);
  }, []);

  const filteredOfferings = offerings.filter(offering => {
    const matchesSearch = offering.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offering.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offering.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || offering.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || offering.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const sortedOfferings = [...filteredOfferings].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b.metrics.successRate - a.metrics.successRate;
      case 'trending':
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
      case 'price':
        return (a.price.amount || 0) - (b.price.amount || 0);
      default:
        return 0;
    }
  });

  const getTypeColor = (type: OfferingType) => {
    const colors = {
      agent: 'from-blue-500 to-cyan-500',
      workflow: 'from-purple-500 to-pink-500',
      tool: 'from-green-500 to-emerald-500'
    };
    return colors[type];
  };

  const getTypeLabel = (type: OfferingType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden flex flex-col relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '10%', left: '10%' }} />
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '60%', right: '10%', animationDelay: '2s' }} />
        <div className="absolute w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ bottom: '10%', left: '50%', animationDelay: '4s' }} />
      </div>

      {/* Header with glassmorphism */}
      <div className="relative bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl border-b border-white/10 p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
                Unified Marketplace
              </h1>
              <p className="text-gray-400 text-lg">Discover Agents, Workflows, and Tools that transform your business</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'hover:bg-gray-700'}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'hover:bg-gray-700'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar with Premium Style */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents, workflows, tools... (try 'website' or 'marketing')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-lg focus:outline-none focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/20 transition-all placeholder-gray-500"
            />
          </div>

          {/* Type Filters - Premium Pills */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'agent', 'workflow', 'tool'] as const).map((type) => {
              const Icon = type === 'all' ? Sparkles : typeIcons[type as OfferingType];
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl whitespace-nowrap transition-all transform hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-r ${type === 'all' ? 'from-yellow-500 to-orange-500' : getTypeColor(type as OfferingType)} shadow-lg shadow-${type === 'agent' ? 'blue' : type === 'workflow' ? 'purple' : 'green'}-500/50`
                      : 'bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 border border-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold capitalize">{type === 'all' ? 'All' : getTypeLabel(type as OfferingType)}s</span>
                  {type !== 'all' && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {offerings.filter(o => o.type === type).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Category & Sort Controls */}
          <div className="flex gap-4 flex-wrap">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-blue-600 shadow-lg shadow-blue-500/30'
                      : 'bg-gray-800/30 backdrop-blur-sm hover:bg-gray-700/50 border border-white/5'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="trending">🔥 Trending</option>
              <option value="performance">⚡ Performance</option>
              <option value="newest">✨ Newest</option>
              <option value="price">💰 Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              {sortedOfferings.length} {sortedOfferings.length === 1 ? 'result' : 'results'} found
            </p>
          </div>

          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "flex flex-col gap-4"
          }>
            {sortedOfferings.map((offering) => {
              const TypeIcon = typeIcons[offering.type];
              const isHovered = hoveredCard === offering.id;

              return (
                <div
                  key={offering.id}
                  onMouseEnter={() => setHoveredCard(offering.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`group relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-${offering.type === 'agent' ? 'blue' : offering.type === 'workflow' ? 'purple' : 'green'}-500/20 hover:-translate-y-1 hover:border-white/20 cursor-pointer ${
                    viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
                  }`}
                >
                  {/* Gradient Top Bar */}
                  <div className={`h-2 bg-gradient-to-r ${getTypeColor(offering.type)}`} />

                  {/* Content */}
                  <div className="p-6 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getTypeColor(offering.type)} flex items-center justify-center text-2xl shadow-lg`}>
                          {offering.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all truncate">
                              {offering.name}
                            </h3>
                            {offering.trending && (
                              <TrendingUp className="w-4 h-4 text-orange-400 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{offering.creator.name}</span>
                            {offering.creator.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${getTypeColor(offering.type)} bg-opacity-20`}>
                              {getTypeLabel(offering.type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold">{offering.metrics.satisfaction}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {offering.description}
                    </p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                        <div className="text-lg font-bold text-green-400">{offering.metrics.successRate}%</div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Avg Time</div>
                        <div className="text-lg font-bold text-blue-400">{offering.metrics.avgResponseTime}s</div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Total Runs</div>
                        <div className="text-lg font-bold text-purple-400">{offering.metrics.totalRuns.toLocaleString()}</div>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Active Users</div>
                        <div className="text-lg font-bold text-orange-400">{offering.metrics.activeUsers.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-400" />
                          <div>
                            <div className="text-xs text-gray-400">Security Score</div>
                            <div className="text-sm font-bold text-green-400">{offering.security.score}/100</div>
                          </div>
                        </div>
                        {offering.security.verified && (
                          <div className="flex items-center gap-1 text-green-400 bg-green-400/20 px-2 py-1 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">VERIFIED</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {offering.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-700/50 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full border border-white/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="text-lg font-bold">
                        {offering.price.type === 'free' && (
                          <span className="text-green-400">FREE</span>
                        )}
                        {offering.price.type === 'usage-based' && (
                          <span className="text-blue-400">${offering.price.amount}/run</span>
                        )}
                        {offering.price.type === 'subscription' && (
                          <span className="text-purple-400">${offering.price.amount}/mo</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button className="bg-gray-700/50 hover:bg-gray-600/50 p-2 rounded-lg transition-all">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className={`bg-gradient-to-r ${getTypeColor(offering.type)} hover:shadow-lg hover:shadow-${offering.type === 'agent' ? 'blue' : offering.type === 'workflow' ? 'purple' : 'green'}-500/50 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 transform hover:scale-105`}>
                          <Play className="w-5 h-5" />
                          Try Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor(offering.type)} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                </div>
              );
            })}
          </div>

          {sortedOfferings.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No results found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

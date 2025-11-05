'use client';

import React, { useState } from 'react';
import { 
  Star, Download, Users, Clock, DollarSign, Shield, Play, 
  Code, Book, MessageSquare, Heart, Share2, Flag, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Zap, Award
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    rating: number;
  };
  category: string;
  type: 'agent' | 'workflow' | 'tool';
  rating: number;
  reviews: number;
  downloads: number;
  activeUsers: number;
  
  // Metrics
  metrics: {
    successRate: number;
    avgResponseTime: number; // ms
    costPerRun: number; // USD
    totalRuns: number;
    satisfaction: number; // 0-100
  };
  
  // Security
  security: {
    score: number; // 0-100
    level: 'safe' | 'low' | 'medium' | 'high';
    verified: boolean;
    lastScanned: Date;
    vulnerabilities: Array<{
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  
  // Pricing
  pricing: {
    type: 'free' | 'one-time' | 'subscription' | 'usage-based';
    amount?: number;
    tiers?: Array<{
      name: string;
      price: number;
      features: string[];
    }>;
  };
  
  // Documentation
  docs: {
    features: string[];
    requirements: string[];
    installation: string;
    usage: Array<{
      title: string;
      code: string;
      language: string;
    }>;
  };
  
  // Screenshots
  screenshots: string[];
  
  // Related
  relatedAgents: string[];
}

interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

export function MarketplaceDetailPage({ agentId }: { agentId: string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'docs' | 'reviews'>('overview');
  const [demoOpen, setDemoOpen] = useState(false);
  
  // Mock data - replace with API call
  const agent: Agent = {
    id: agentId,
    name: 'Website Builder Pro',
    description: 'Build complete, professional websites from a simple description',
    longDescription: `Website Builder Pro is an advanced AI agent that creates production-ready websites from your business description. It handles everything from design to deployment, including SEO optimization, responsive layouts, and performance optimization.`,
    icon: '🌐',
    creator: {
      id: 'creator-1',
      name: 'AI Innovations Inc',
      avatar: '/avatars/creator-1.jpg',
      verified: true,
      rating: 4.9
    },
    category: 'creative',
    type: 'agent',
    rating: 4.8,
    reviews: 1247,
    downloads: 15420,
    activeUsers: 3200,
    metrics: {
      successRate: 96.5,
      avgResponseTime: 2400,
      costPerRun: 2.50,
      totalRuns: 45230,
      satisfaction: 94
    },
    security: {
      score: 98,
      level: 'safe',
      verified: true,
      lastScanned: new Date(),
      vulnerabilities: []
    },
    pricing: {
      type: 'usage-based',
      amount: 2.50
    },
    docs: {
      features: [
        'AI-powered design generation',
        'Responsive layouts (mobile, tablet, desktop)',
        'SEO optimization included',
        'Performance optimization (Lighthouse 90+)',
        'One-click deployment',
        'Custom domain support'
      ],
      requirements: [
        'Business description',
        'Basic requirements (optional)',
        'Color preferences (optional)'
      ],
      installation: 'npm install @agents/website-builder',
      usage: [
        {
          title: 'Basic Usage',
          code: `const builder = new WebsiteBuilder();
const result = await builder.build({
  businessName: 'My Coffee Shop',
  businessType: 'Restaurant',
  targetAudience: 'Coffee lovers in Seattle'
});`,
          language: 'javascript'
        }
      ]
    },
    screenshots: [
      '/screenshots/1.jpg',
      '/screenshots/2.jpg',
      '/screenshots/3.jpg'
    ],
    relatedAgents: ['brand-identity', 'seo-optimizer', 'content-writer']
  };
  
  const reviews: Review[] = [
    {
      id: '1',
      user: { name: 'Sarah M.', avatar: '/avatars/user1.jpg' },
      rating: 5,
      comment: 'Incredible! Built a professional website for my bakery in minutes. The design is beautiful and it actually converts!',
      date: new Date('2025-10-15'),
      helpful: 42
    },
    {
      id: '2',
      user: { name: 'John D.', avatar: '/avatars/user2.jpg' },
      rating: 5,
      comment: 'Saved me $10K and weeks of work. The SEO optimization is legit - already ranking on Google.',
      date: new Date('2025-10-10'),
      helpful: 38
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className="text-6xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl">
              {agent.icon}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{agent.name}</h1>
                {agent.security.verified && (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>
              
              <p className="text-xl text-gray-300 mb-4">{agent.description}</p>
              
              {/* Creator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {agent.creator.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{agent.creator.name}</span>
                    {agent.creator.verified && (
                      <Award className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{agent.creator.rating}</span>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{agent.rating}</span>
                  <span className="text-gray-400">({agent.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span>{agent.downloads.toLocaleString()} downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{agent.activeUsers.toLocaleString()} active users</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setDemoOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                <Play className="w-5 h-5" />
                Try Demo
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-lg font-semibold transition-all">
                {agent.pricing.type === 'free' ? 'Install Free' : `$${agent.pricing.amount} per use`}
              </button>
              <div className="flex gap-2">
                <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Metrics Dashboard */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-5 gap-4">
            <MetricCard
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              label="Success Rate"
              value={`${agent.metrics.successRate}%`}
              trend="+2.3%"
            />
            <MetricCard
              icon={<Clock className="w-5 h-5 text-blue-400" />}
              label="Avg Response"
              value={`${(agent.metrics.avgResponseTime / 1000).toFixed(1)}s`}
              trend="-0.5s"
            />
            <MetricCard
              icon={<DollarSign className="w-5 h-5 text-yellow-400" />}
              label="Cost Per Run"
              value={`$${agent.metrics.costPerRun}`}
              trend="stable"
            />
            <MetricCard
              icon={<Zap className="w-5 h-5 text-purple-400" />}
              label="Total Runs"
              value={agent.metrics.totalRuns.toLocaleString()}
              trend="+15K"
            />
            <MetricCard
              icon={<Star className="w-5 h-5 text-pink-400" />}
              label="Satisfaction"
              value={`${agent.metrics.satisfaction}%`}
              trend="+3%"
            />
          </div>
        </div>
      </div>
      
      {/* Security Badge */}
      <div className="border-b border-gray-800 bg-gradient-to-r from-green-900/20 to-blue-900/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6 text-green-400" />
            <div className="flex-1">
              <div className="font-semibold text-green-400">Security Score: {agent.security.score}/100</div>
              <div className="text-sm text-gray-300">Verified safe • Last scanned {new Date(agent.security.lastScanned).toLocaleDateString()}</div>
            </div>
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 font-semibold">
              {agent.security.level.toUpperCase()} RISK
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['overview', 'docs', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="col-span-2 space-y-8">
              {/* About */}
              <section>
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-gray-300 leading-relaxed">{agent.longDescription}</p>
              </section>
              
              {/* Features */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Features</h2>
                <div className="grid grid-cols-2 gap-3">
                  {agent.docs.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
              
              {/* Screenshots */}
              {agent.screenshots.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {agent.screenshots.map((img, i) => (
                      <div key={i} className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                        Screenshot {i + 1}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="capitalize">{agent.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="capitalize">{agent.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated</span>
                    <span>2 days ago</span>
                  </div>
                </div>
              </div>
              
              {/* Related Agents */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Related Agents</h3>
                <div className="space-y-3">
                  {agent.relatedAgents.map((id, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                      <div className="text-2xl">🎨</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Related Agent {i + 1}</div>
                        <div className="text-xs text-gray-400">By Creator</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'docs' && (
          <div className="prose prose-invert max-w-none">
            <h2>Documentation</h2>
            <h3>Installation</h3>
            <pre className="bg-gray-900 p-4 rounded-lg">
              <code>{agent.docs.installation}</code>
            </pre>
            
            <h3>Usage Examples</h3>
            {agent.docs.usage.map((example, i) => (
              <div key={i} className="mb-6">
                <h4>{example.title}</h4>
                <pre className="bg-gray-900 p-4 rounded-lg">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">{agent.rating}</div>
                  <div className="flex items-center gap-1 justify-center mb-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">{agent.reviews} reviews</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map(rating => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm w-3">{rating}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-full rounded-full"
                          style={{ width: `${rating === 5 ? 85 : rating === 4 ? 12 : 2}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">
                        {rating === 5 ? '85%' : rating === 4 ? '12%' : '2%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{review.user.name}</span>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3">{review.comment}</p>
                      <button className="text-sm text-gray-400 hover:text-gray-300">
                        {review.helpful} people found this helpful
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Demo Modal */}
      {demoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Try {agent.name}</h2>
              <button 
                onClick={() => setDemoOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-400 mb-4">Interactive demo coming soon...</p>
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                Demo Preview
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-green-400">{trend}</div>
    </div>
  );
}

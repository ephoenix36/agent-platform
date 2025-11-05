'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, Star, Download, Play, Share2, Heart, Flag, 
  TrendingUp, Clock, DollarSign, Users, Shield, CheckCircle,
  Code, Settings, BarChart3, Zap, MessageSquare, BookOpen,
  Github, Globe, Twitter, Copy, Check
} from 'lucide-react';
import { SharingControls } from './sharing/SharingControls';
import { MonetizationConfiguration } from './monetization/MonetizationConfig';
import type { SharingConfig, MonetizationConfig, PrivacyLevel } from '@/types/platform';

interface AgentDetail {
  id: string;
  type: 'agent' | 'workflow' | 'tool';
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: string;
  category: string;
  protocol: 'mcp' | 'crewai' | 'langchain' | 'langgraph' | 'autogen';
  
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
    bio: string;
    totalCreations: number;
    followers: number;
  };
  
  metrics: {
    successRate: number;
    avgResponseTime: number;
    costPerRun: number;
    totalRuns: number;
    satisfaction: number;
    activeUsers: number;
  };
  
  security: {
    score: number;
    level: 'safe' | 'low' | 'medium' | 'high';
    verified: boolean;
    lastScanned: string;
    vulnerabilities: number;
  };
  
  pricing: {
    type: 'free' | 'one-time' | 'subscription' | 'usage-based';
    amount?: number;
    trial?: boolean;
  };
  
  features: string[];
  useCases: string[];
  screenshots: string[];
  
  reviews: Array<{
    id: string;
    user: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
  }>;
  
  changelog: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
  
  documentation: {
    quickStart: string;
    apiReference: string;
    examples: Array<{
      title: string;
      code: string;
    }>;
  };
  
  stats: {
    views: number;
    favorites: number;
    forks: number;
    revenue: number;
  };
}

interface MarketplaceDetailPageProps {
  agent: AgentDetail;
  onBack: () => void;
  onTry: () => void;
  onPurchase: () => void;
}

export function MarketplaceDetailPage({ agent, onBack, onTry, onPurchase }: MarketplaceDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'docs' | 'changelog'>('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharingConfig, setSharingConfig] = useState<SharingConfig | undefined>();
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('public');
  const [monetizationConfig, setMonetizationConfig] = useState<MonetizationConfig | undefined>();

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(`npm install @agent-platform/${agent.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const averageRating = agent.reviews.reduce((acc, r) => acc + r.rating, 0) / agent.reviews.length;

  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-6xl">{agent.icon}</div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{agent.name}</h1>
                <p className="text-xl text-gray-400 mb-3">{agent.tagline}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-400">({agent.reviews.length} reviews)</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-gray-400" />
                    <span>{agent.metrics.totalRuns.toLocaleString()} runs</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{agent.metrics.activeUsers.toLocaleString()} users</span>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    agent.type === 'agent' ? 'bg-blue-500/20 text-blue-400' :
                    agent.type === 'workflow' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {agent.type.toUpperCase()}
                  </div>

                  <div className="px-3 py-1 bg-gray-800 rounded-full text-xs">
                    {agent.protocol.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-3 rounded-lg transition-all ${
                  isFavorited 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              
              <SharingControls
                itemId={agent.id}
                itemType={agent.type === 'tool' ? 'app' : agent.type}
                itemName={agent.name}
                currentConfig={sharingConfig}
                currentPrivacy={privacyLevel}
                onUpdate={(config, privacy) => {
                  setSharingConfig(config);
                  setPrivacyLevel(privacy);
                  console.log('Sharing updated:', config, privacy);
                }}
              />
              
              <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all">
                <Flag className="w-5 h-5" />
              </button>

              <button
                onClick={onTry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Try Now
              </button>

              {agent.pricing.type !== 'free' && (
                <button
                  onClick={onPurchase}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all"
                >
                  {agent.pricing.type === 'subscription' && `Subscribe $${agent.pricing.amount}/mo`}
                  {agent.pricing.type === 'one-time' && `Buy for $${agent.pricing.amount}`}
                  {agent.pricing.type === 'usage-based' && `$${agent.pricing.amount}/run`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-green-400">{agent.metrics.successRate}%</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Response Time</div>
                <div className="text-2xl font-bold text-blue-400">{agent.metrics.avgResponseTime}s</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Satisfaction</div>
                <div className="text-2xl font-bold text-purple-400">{agent.metrics.satisfaction}/5</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="text-sm text-gray-400 mb-1">Cost/Run</div>
                <div className="text-2xl font-bold text-orange-400">${agent.metrics.costPerRun}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
              {(['overview', 'reviews', 'docs', 'changelog'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold transition-all ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4">About</h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {agent.longDescription}
                  </p>
                </div>

                {/* Features */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Key Features
                  </h2>
                  <ul className="grid grid-cols-2 gap-3">
                    {agent.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Use Cases */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4">Perfect For</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {agent.useCases.map((useCase, idx) => (
                      <div key={idx} className="bg-gray-700/30 rounded-lg p-4">
                        <p className="text-gray-300">{useCase}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screenshots */}
                {agent.screenshots.length > 0 && (
                  <div className="bg-gray-800/30 rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {agent.screenshots.map((screenshot, idx) => (
                        <div key={idx} className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            Screenshot {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {agent.reviews.map((review) => (
                  <div key={review.id} className="bg-gray-800/30 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{review.user}</span>
                          {review.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-400">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                    Quick Start
                  </h2>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
                      {agent.documentation.quickStart}
                    </pre>
                  </div>
                </div>

                {agent.documentation.examples.map((example, idx) => (
                  <div key={idx} className="bg-gray-800/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-3">{example.title}</h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-gray-300 text-sm overflow-x-auto">
                        {example.code}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'changelog' && (
              <div className="space-y-4">
                {agent.changelog.map((version, idx) => (
                  <div key={idx} className="bg-gray-800/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold">Version {version.version}</h3>
                      <span className="text-sm text-gray-400">{version.date}</span>
                    </div>
                    <ul className="space-y-2">
                      {version.changes.map((change, changeIdx) => (
                        <li key={changeIdx} className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span className="text-gray-300">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Security Badge */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-green-400" />
                <div>
                  <div className="font-bold text-lg">Security Score</div>
                  <div className="text-3xl font-bold text-green-400">{agent.security.score}/100</div>
                </div>
              </div>
              {agent.security.verified && (
                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Verified Secure</span>
                </div>
              )}
              <div className="mt-3 text-sm text-gray-400">
                Last scanned: {new Date(agent.security.lastScanned).toLocaleDateString()}
              </div>
            </div>

            {/* Creator Info */}
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="font-bold mb-4">Created By</h3>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold">
                  {agent.creator.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{agent.creator.name}</span>
                    {agent.creator.verified && (
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{agent.creator.followers} followers</div>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-4">{agent.creator.bio}</p>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                  Follow
                </button>
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                  Message
                </button>
              </div>
            </div>

            {/* Install */}
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="font-bold mb-3">Installation</h3>
              <div className="relative">
                <div className="bg-gray-900 rounded-lg p-3 pr-12 font-mono text-sm text-gray-300 overflow-x-auto">
                  npm install @agent-platform/{agent.id}
                </div>
                <button
                  onClick={handleCopyInstall}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="font-bold mb-3">Links</h3>
              <div className="space-y-2">
                <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Github className="w-4 h-4" />
                  <span className="text-sm">View on GitHub</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Documentation</span>
                </a>
                <a href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm">Follow Updates</span>
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-800/30 rounded-xl p-6">
              <h3 className="font-bold mb-3">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Views</span>
                  <span className="font-semibold">{agent.stats.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Favorites</span>
                  <span className="font-semibold">{agent.stats.favorites.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Forks</span>
                  <span className="font-semibold">{agent.stats.forks.toLocaleString()}</span>
                </div>
                {agent.stats.revenue > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-sm text-gray-400">Total Revenue</span>
                    <span className="font-semibold text-green-400">
                      ${agent.stats.revenue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

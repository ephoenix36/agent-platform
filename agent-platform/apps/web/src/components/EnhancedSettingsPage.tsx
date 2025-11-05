/**
 * Enhanced Settings Page with xAI and OpenRouter Support
 * Comprehensive configuration for LLM providers, telemetry, and optimization
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Database, Key, Bell, Shield, Palette, Zap, Users, Globe,
  Settings as SettingsIcon, Save, RefreshCw, TrendingUp, Activity,
  DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Info,
  Eye, EyeOff, Copy, Check
} from 'lucide-react';
import { SUPPORTED_PROVIDERS, type ProviderType, type SystemSettings } from '@/types/providers';

type SettingsTab = 'providers' | 'telemetry' | 'optimization' | 'profile' | 'security' | 'appearance';

export function EnhancedSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const [settings, setSettings] = useState<SystemSettings>({
    defaultProvider: 'xai',
    defaultModel: 'grok-4-fast',
    providers: {
      openai: { name: 'OpenAI', apiKey: '', enabled: false },
      anthropic: { name: 'Anthropic', apiKey: '', enabled: false },
      google: { name: 'Google', apiKey: '', enabled: true },
      xai: { name: 'xAI', apiKey: '', baseUrl: 'https://api.x.ai/v1', enabled: true },
      openrouter: { name: 'OpenRouter', apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', enabled: false },
      custom: { name: 'Custom OpenAI API', apiKey: '', baseUrl: '', enabled: false },
    },
    telemetry: {
      enabled: true,
      retentionDays: 30,
      aggregationInterval: 'hourly',
    },
    optimization: {
      autoOptimize: false,
      targetMetrics: ['cost', 'speed'],
      optimizationInterval: 'weekly',
    },
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<ProviderType, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    xai: false,
    openrouter: false,
    custom: false,
  });
  const [copiedKey, setCopiedKey] = useState<ProviderType | null>(null);
  const [testingProvider, setTestingProvider] = useState<ProviderType | null>(null);

  // Load settings from environment/API
  useEffect(() => {
    const loadSettings = async () => {
      // Load from localStorage or API
      const savedSettings = localStorage.getItem('system-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    };
    loadSettings();
  }, []);

  const handleProviderToggle = (provider: ProviderType) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          enabled: !prev.providers[provider].enabled,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleApiKeyChange = (provider: ProviderType, apiKey: string) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          apiKey,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleTestProvider = async (provider: ProviderType) => {
    setTestingProvider(provider);
    try {
      // Test API connection
      const response = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: settings.providers[provider].apiKey,
          baseUrl: settings.providers[provider].baseUrl,
        }),
      });
      
      const result = await response.json();
      alert(result.success ? '✅ Connection successful!' : '❌ Connection failed: ' + result.error);
    } catch (error) {
      alert('❌ Error testing provider: ' + error);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = async () => {
    try {
      // Save to localStorage and API
      localStorage.setItem('system-settings', JSON.stringify(settings));
      
      // Update backend
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      setHasChanges(false);
      alert('✅ Settings saved successfully!');
    } catch (error) {
      alert('❌ Error saving settings: ' + error);
    }
  };

  const copyToClipboard = (provider: ProviderType) => {
    navigator.clipboard.writeText(settings.providers[provider].apiKey);
    setCopiedKey(provider);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs = [
    {
      id: 'providers' as SettingsTab,
      label: 'LLM Providers',
      icon: Zap,
      description: 'Configure AI model providers',
    },
    {
      id: 'telemetry' as SettingsTab,
      label: 'Telemetry',
      icon: Activity,
      description: 'Agent and workflow monitoring',
    },
    {
      id: 'optimization' as SettingsTab,
      label: 'Optimization',
      icon: TrendingUp,
      description: 'Automated optimization settings',
    },
    {
      id: 'profile' as SettingsTab,
      label: 'Profile',
      icon: Users,
      description: 'User profile and preferences',
    },
    {
      id: 'security' as SettingsTab,
      label: 'Security',
      icon: Shield,
      description: 'Security and authentication',
    },
    {
      id: 'appearance' as SettingsTab,
      label: 'Appearance',
      icon: Palette,
      description: 'Theme and display settings',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-400 text-sm mt-1">Configure your AI agent platform</p>
            </div>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all font-medium shadow-lg hover:shadow-blue-500/50"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className="text-xs opacity-75 truncate">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeTab === 'providers' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-bold mb-4">LLM Provider Configuration</h2>
                  <p className="text-gray-400 mb-6">
                    Configure API keys and settings for AI model providers. All keys are encrypted and stored securely.
                  </p>

                  <div className="space-y-4">
                    {(Object.keys(SUPPORTED_PROVIDERS) as ProviderType[]).map((providerId) => {
                      const provider = SUPPORTED_PROVIDERS[providerId];
                      const config = settings.providers[providerId];
                      const isEnabled = config.enabled;
                      
                      return (
                        <div
                          key={providerId}
                          className={`border rounded-xl p-6 transition-all ${
                            isEnabled
                              ? 'border-blue-500/50 bg-blue-500/5'
                              : 'border-gray-700 bg-gray-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{provider.name}</h3>
                                {isEnabled && (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                    Active
                                  </span>
                                )}
                                {providerId === 'xai' && (
                                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mt-1">
                                {provider.models.length} models available
                                {providerId === 'xai' && ' • Best price/performance ratio'}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => handleProviderToggle(providerId)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          {isEnabled && (
                            <div className="space-y-4">
                              {/* API Key Input */}
                              <div>
                                <label className="block text-sm font-medium mb-2">API Key</label>
                                <div className="relative flex items-center gap-2">
                                  <input
                                    type={showApiKeys[providerId] ? 'text' : 'password'}
                                    value={config.apiKey}
                                    onChange={(e) => handleApiKeyChange(providerId, e.target.value)}
                                    placeholder={`Enter ${provider.name} API key`}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                  />
                                  <button
                                    onClick={() => setShowApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }))}
                                    className="p-2.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
                                  >
                                    {showApiKeys[providerId] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(providerId)}
                                    className="p-2.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
                                  >
                                    {copiedKey === providerId ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleTestProvider(providerId)}
                                    disabled={testingProvider === providerId || !config.apiKey}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors text-sm font-medium"
                                  >
                                    {testingProvider === providerId ? 'Testing...' : 'Test'}
                                  </button>
                                </div>
                              </div>

                              {/* Base URL (for xAI, OpenRouter, and Custom) */}
                              {(providerId === 'xai' || providerId === 'openrouter' || providerId === 'custom') && (
                                <div>
                                  <label className="block text-sm font-medium mb-2">Base URL</label>
                                  <input
                                    type="text"
                                    value={config.baseUrl || provider.baseUrl}
                                    onChange={(e) => setSettings(prev => ({
                                      ...prev,
                                      providers: {
                                        ...prev.providers,
                                        [providerId]: { ...prev.providers[providerId], baseUrl: e.target.value },
                                      },
                                    }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                  />
                                </div>
                              )}

                              {/* Available Models */}
                              <div>
                                <label className="block text-sm font-medium mb-2">Available Models</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {provider.models.map((model) => (
                                    <div
                                      key={model.id}
                                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                                    >
                                      <div className="font-medium text-sm">{model.name}</div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        ${model.pricing.inputCostPer1M.toFixed(2)} / ${model.pricing.outputCostPer1M.toFixed(2)} per 1M tokens
                                      </div>
                                      {'intelligenceIndex' in model.pricing && model.pricing.intelligenceIndex && (
                                        <div className="text-xs text-blue-400 mt-1">
                                          IQ: {model.pricing.intelligenceIndex.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recommendation for Grok */}
                              {providerId === 'xai' && (
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <div className="font-medium text-purple-300 mb-1">Why xAI Grok?</div>
                                      <ul className="text-sm text-gray-300 space-y-1">
                                        <li>• <strong>96% cheaper</strong> than GPT-4o ($0.10 vs $2.50 per 1M input tokens)</li>
                                        <li>• <strong>Highest intelligence</strong> (60.25 reasoning index)</li>
                                        <li>• <strong>Very fast</strong> response times</li>
                                        <li>• <strong>Perfect for agents</strong> - cost-effective at scale</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Default Provider Selection */}
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <h3 className="text-lg font-bold mb-4">Default Provider & Model</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Provider</label>
                      <select
                        value={settings.defaultProvider}
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, defaultProvider: e.target.value as ProviderType }));
                          setHasChanges(true);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {(Object.keys(SUPPORTED_PROVIDERS) as ProviderType[]).map((id) => (
                          <option key={id} value={id} disabled={!settings.providers[id].enabled}>
                            {SUPPORTED_PROVIDERS[id].name}
                            {!settings.providers[id].enabled && ' (Disabled)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Model</label>
                      <select
                        value={settings.defaultModel}
                        onChange={(e) => {
                          setSettings(prev => ({ ...prev, defaultModel: e.target.value }));
                          setHasChanges(true);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        {SUPPORTED_PROVIDERS[settings.defaultProvider].models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-bold mb-4">Telemetry & Monitoring</h2>
                  <p className="text-gray-400 mb-6">
                    Configure automatic collection and analysis of agent and workflow performance data.
                  </p>

                  <div className="space-y-6">
                    {/* Enable Telemetry */}
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium">Enable Telemetry</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Automatically collect performance metrics for all agents and workflows
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.telemetry.enabled}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              telemetry: { ...prev.telemetry, enabled: e.target.checked },
                            }));
                            setHasChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Data Retention */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Data Retention (Days)</label>
                      <input
                        type="number"
                        value={settings.telemetry.retentionDays}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            telemetry: { ...prev.telemetry, retentionDays: parseInt(e.target.value) },
                          }));
                          setHasChanges(true);
                        }}
                        min="7"
                        max="365"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        How long to keep telemetry data (7-365 days)
                      </p>
                    </div>

                    {/* Aggregation Interval */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Aggregation Interval</label>
                      <select
                        value={settings.telemetry.aggregationInterval}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            telemetry: { ...prev.telemetry, aggregationInterval: e.target.value as 'realtime' | 'hourly' | 'daily' },
                          }));
                          setHasChanges(true);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>

                    {/* Metrics to Track */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Metrics to Track</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'execution-time', label: 'Execution Time', icon: Clock },
                          { id: 'token-usage', label: 'Token Usage', icon: Activity },
                          { id: 'cost', label: 'Cost Tracking', icon: DollarSign },
                          { id: 'success-rate', label: 'Success Rate', icon: CheckCircle },
                          { id: 'error-rate', label: 'Error Rate', icon: XCircle },
                          { id: 'quality', label: 'Output Quality', icon: TrendingUp },
                        ].map((metric) => {
                          const Icon = metric.icon;
                          return (
                            <label
                              key={metric.id}
                              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 cursor-pointer transition-all"
                            >
                              <input
                                type="checkbox"
                                defaultChecked
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                              />
                              <Icon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{metric.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'optimization' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-bold mb-4">Automated Optimization</h2>
                  <p className="text-gray-400 mb-6">
                    Configure automatic optimization of agents and workflows using evolutionary algorithms.
                  </p>

                  <div className="space-y-6">
                    {/* Auto Optimize Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <h3 className="font-medium">Enable Auto-Optimization</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Automatically optimize agents and workflows based on performance metrics
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.optimization.autoOptimize}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              optimization: { ...prev.optimization, autoOptimize: e.target.checked },
                            }));
                            setHasChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Target Metrics */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Optimization Targets</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'cost', label: 'Cost Reduction', description: 'Minimize API costs' },
                          { id: 'speed', label: 'Speed', description: 'Faster execution' },
                          { id: 'accuracy', label: 'Accuracy', description: 'Better results' },
                          { id: 'quality', label: 'Quality', description: 'Higher quality outputs' },
                        ].map((target) => (
                          <label
                            key={target.id}
                            className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-blue-500/50 cursor-pointer transition-all"
                          >
                            <input
                              type="checkbox"
                              checked={settings.optimization.targetMetrics.includes(target.id as any)}
                              onChange={(e) => {
                                setSettings(prev => ({
                                  ...prev,
                                  optimization: {
                                    ...prev.optimization,
                                    targetMetrics: e.target.checked
                                      ? [...prev.optimization.targetMetrics, target.id as any]
                                      : prev.optimization.targetMetrics.filter(m => m !== target.id),
                                  },
                                }));
                                setHasChanges(true);
                              }}
                              className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2"
                            />
                            <div>
                              <div className="font-medium text-sm">{target.label}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{target.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Optimization Interval */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Optimization Schedule</label>
                      <select
                        value={settings.optimization.optimizationInterval}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            optimization: { ...prev.optimization, optimizationInterval: e.target.value as any },
                          }));
                          setHasChanges(true);
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs to be implemented */}
            {activeTab === 'profile' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4">User Profile</h2>
                <p className="text-gray-400">Profile management coming soon...</p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4">Security Settings</h2>
                <p className="text-gray-400">Security settings coming soon...</p>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-4">Appearance</h2>
                <p className="text-gray-400">Theme customization coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedSettingsPage;

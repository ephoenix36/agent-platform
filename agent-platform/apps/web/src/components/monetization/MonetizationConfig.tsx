/**
 * Monetization Configuration
 * 
 * Allow users to configure monetization models for their apps
 */

'use client';

import React, { useState } from 'react';
import {
  DollarSign, TrendingUp, Users, Zap, Check, Info,
  Plus, X, Settings, CreditCard, Calendar, BarChart3
} from 'lucide-react';
import type { MonetizationConfig, MonetizationModel } from '@/types/platform';

interface MonetizationConfigProps {
  itemId: string;
  itemType: 'agent' | 'workflow' | 'app';
  itemName: string;
  currentConfig?: MonetizationConfig;
  onUpdate?: (config: MonetizationConfig) => void;
}

export function MonetizationConfiguration({
  itemId,
  itemType,
  itemName,
  currentConfig,
  onUpdate,
}: MonetizationConfigProps) {
  const [config, setConfig] = useState<MonetizationConfig>(
    currentConfig || {
      model: 'free',
      currency: 'USD',
      revenueShare: {
        creatorPercentage: 80,
        platformPercentage: 20,
      },
    }
  );

  const monetizationModels: Array<{
    value: MonetizationModel;
    label: string;
    description: string;
    icon: any;
    recommended?: boolean;
  }> = [
    {
      value: 'free',
      label: 'Free',
      description: 'Completely free for all users',
      icon: Users,
    },
    {
      value: 'one-time',
      label: 'One-Time Purchase',
      description: 'Single payment for lifetime access',
      icon: DollarSign,
    },
    {
      value: 'subscription',
      label: 'Subscription',
      description: 'Recurring monthly or annual payments',
      icon: Calendar,
      recommended: true,
    },
    {
      value: 'usage-based',
      label: 'Usage-Based',
      description: 'Pay per execution, token, or minute',
      icon: Zap,
    },
    {
      value: 'hybrid',
      label: 'Hybrid',
      description: 'Combination of subscription and usage',
      icon: TrendingUp,
    },
  ];

  const handleModelChange = (model: MonetizationModel) => {
    const updatedConfig: MonetizationConfig = {
      ...config,
      model,
    };

    // Set defaults based on model
    if (model === 'free') {
      delete updatedConfig.price;
      delete updatedConfig.subscriptionTiers;
      delete updatedConfig.usageRates;
      delete updatedConfig.trial;
    } else if (model === 'one-time') {
      updatedConfig.price = 9.99;
      delete updatedConfig.subscriptionTiers;
      delete updatedConfig.usageRates;
    } else if (model === 'subscription') {
      updatedConfig.subscriptionTiers = [
        {
          name: 'Basic',
          price: 9.99,
          interval: 'month',
          features: ['Basic features', 'Email support'],
          limits: {
            executionsPerMonth: 1000,
            tokensPerMonth: 100000,
          },
        },
        {
          name: 'Pro',
          price: 29.99,
          interval: 'month',
          features: ['All features', 'Priority support', 'Advanced analytics'],
          limits: {
            executionsPerMonth: 10000,
            tokensPerMonth: 1000000,
          },
        },
      ];
      updatedConfig.trial = {
        enabled: true,
        duration: 14,
      };
    } else if (model === 'usage-based') {
      updatedConfig.usageRates = {
        perExecution: 0.01,
        perToken: 0.000001,
      };
    }

    setConfig(updatedConfig);
    onUpdate?.(updatedConfig);
  };

  const addSubscriptionTier = () => {
    const tiers = config.subscriptionTiers || [];
    const updatedConfig = {
      ...config,
      subscriptionTiers: [
        ...tiers,
        {
          name: `Tier ${tiers.length + 1}`,
          price: 0,
          interval: 'month' as const,
          features: [],
        },
      ],
    };
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig);
  };

  const removeSubscriptionTier = (index: number) => {
    const updatedConfig = {
      ...config,
      subscriptionTiers: config.subscriptionTiers?.filter((_, i) => i !== index),
    };
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig);
  };

  const updateSubscriptionTier = (index: number, updates: any) => {
    const updatedConfig = {
      ...config,
      subscriptionTiers: config.subscriptionTiers?.map((tier, i) =>
        i === index ? { ...tier, ...updates } : tier
      ),
    };
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig);
  };

  const estimatedRevenue = calculateEstimatedRevenue(config);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monetization</h2>
          <p className="text-gray-600 text-sm mt-1">
            Configure how you want to monetize "{itemName}"
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <div className="text-right">
            <div className="text-xs text-green-600">Est. Monthly Revenue</div>
            <div className="font-bold text-green-700">${estimatedRevenue}</div>
          </div>
        </div>
      </div>

      {/* Monetization Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Monetization Model
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monetizationModels.map((model) => {
            const Icon = model.icon;
            return (
              <button
                key={model.value}
                onClick={() => handleModelChange(model.value)}
                className={`relative flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  config.model === model.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {model.recommended && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    Recommended
                  </div>
                )}
                <Icon className={`w-6 h-6 ${config.model === model.value ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-sm">{model.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {model.description}
                  </div>
                </div>
                {config.model === model.value && (
                  <Check className="absolute bottom-4 right-4 w-5 h-5 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Based on Model */}
      {config.model === 'one-time' && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            One-Time Pricing
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                value={config.price || 0}
                onChange={(e) => {
                  const updatedConfig = { ...config, price: parseFloat(e.target.value) };
                  setConfig(updatedConfig);
                  onUpdate?.(updatedConfig);
                }}
                min="0"
                step="0.01"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-32"
              />
              <span className="text-gray-500">{config.currency || 'USD'}</span>
            </div>
          </div>
        </div>
      )}

      {config.model === 'subscription' && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Subscription Tiers
            </h3>
            <button
              onClick={addSubscriptionTier}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Tier
            </button>
          </div>

          {config.subscriptionTiers?.map((tier, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateSubscriptionTier(index, { name: e.target.value })}
                  className="font-medium text-lg border-none focus:ring-0 p-0"
                  placeholder="Tier name"
                />
                <button
                  onClick={() => removeSubscriptionTier(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => updateSubscriptionTier(index, { price: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Billing
                  </label>
                  <select
                    value={tier.interval}
                    onChange={(e) => updateSubscriptionTier(index, { interval: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>

              {tier.limits && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Executions/Month
                    </label>
                    <input
                      type="number"
                      value={tier.limits.executionsPerMonth || 0}
                      onChange={(e) =>
                        updateSubscriptionTier(index, {
                          limits: { ...tier.limits, executionsPerMonth: parseInt(e.target.value) },
                        })
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tokens/Month
                    </label>
                    <input
                      type="number"
                      value={tier.limits.tokensPerMonth || 0}
                      onChange={(e) =>
                        updateSubscriptionTier(index, {
                          limits: { ...tier.limits, tokensPerMonth: parseInt(e.target.value) },
                        })
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Free Trial */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.trial?.enabled}
                onChange={(e) => {
                  const updatedConfig = {
                    ...config,
                    trial: e.target.checked
                      ? { enabled: true, duration: 14 }
                      : { enabled: false, duration: 0 },
                  };
                  setConfig(updatedConfig);
                  onUpdate?.(updatedConfig);
                }}
                className="rounded"
              />
              <div>
                <div className="text-sm font-medium">Offer Free Trial</div>
                {config.trial?.enabled && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={config.trial.duration}
                      onChange={(e) => {
                        const updatedConfig = {
                          ...config,
                          trial: { ...config.trial!, duration: parseInt(e.target.value) },
                        };
                        setConfig(updatedConfig);
                        onUpdate?.(updatedConfig);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                    />
                    <span className="text-xs text-gray-500">days</span>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      )}

      {config.model === 'usage-based' && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Usage Rates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Execution
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={config.usageRates?.perExecution || 0}
                  onChange={(e) => {
                    const updatedConfig = {
                      ...config,
                      usageRates: { ...config.usageRates!, perExecution: parseFloat(e.target.value) },
                    };
                    setConfig(updatedConfig);
                    onUpdate?.(updatedConfig);
                  }}
                  min="0"
                  step="0.001"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per 1K Tokens
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={(config.usageRates?.perToken || 0) * 1000}
                  onChange={(e) => {
                    const updatedConfig = {
                      ...config,
                      usageRates: { ...config.usageRates!, perToken: parseFloat(e.target.value) / 1000 },
                    };
                    setConfig(updatedConfig);
                    onUpdate?.(updatedConfig);
                  }}
                  min="0"
                  step="0.001"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Per Minute
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={config.usageRates?.perMinute || 0}
                  onChange={(e) => {
                    const updatedConfig = {
                      ...config,
                      usageRates: { ...config.usageRates!, perMinute: parseFloat(e.target.value) },
                    };
                    setConfig(updatedConfig);
                    onUpdate?.(updatedConfig);
                  }}
                  min="0"
                  step="0.01"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Share */}
      {config.model !== 'free' && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <h3 className="font-semibold">Revenue Share</h3>
            <div className="ml-auto bg-blue-50 border border-blue-200 rounded px-3 py-1 text-sm">
              You keep <span className="font-bold text-blue-600">{config.revenueShare?.creatorPercentage}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-8 flex rounded overflow-hidden">
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${config.revenueShare?.creatorPercentage}%` }}
                >
                  You: {config.revenueShare?.creatorPercentage}%
                </div>
                <div
                  className="bg-gray-400 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${config.revenueShare?.platformPercentage}%` }}
                >
                  Platform: {config.revenueShare?.platformPercentage}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              We handle all payment processing, hosting, and support. The platform fee covers
              infrastructure, payment fees, and ongoing development.
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={() => onUpdate?.(config)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Monetization Settings
        </button>
      </div>
    </div>
  );
}

function calculateEstimatedRevenue(config: MonetizationConfig): string {
  // Simple estimation - in reality would use historical data
  if (config.model === 'free') return '0';
  if (config.model === 'one-time') return ((config.price || 0) * 10).toFixed(2);
  if (config.model === 'subscription') {
    const avgPrice =
      (config.subscriptionTiers?.reduce((sum, tier) => sum + tier.price, 0) || 0) /
        (config.subscriptionTiers?.length || 1);
    return (avgPrice * 20).toFixed(2); // Assume 20 subscribers
  }
  if (config.model === 'usage-based') {
    return ((config.usageRates?.perExecution || 0) * 10000).toFixed(2);
  }
  return '0';
}

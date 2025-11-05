/**
 * Billing Dashboard - Main Component
 * 
 * Displays subscription status, usage, API keys, and billing information
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Key,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { UsageChart } from './UsageChart';
import { SubscriptionManager } from './SubscriptionManager';
import { APIKeyDisplay } from './APIKeyDisplay';
import { InvoiceList } from './InvoiceList';
import { api } from '@/lib/api';

export interface Subscription {
  has_subscription: boolean;
  tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  usage: {
    current: number;
    quota: number | 'unlimited';
    percentage: number;
  };
}

export const BillingDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'keys' | 'invoices'>('overview');

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/billing/subscriptions/current');
      setSubscription(response.data.subscription);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-500',
      pro: 'bg-blue-500',
      team: 'bg-purple-500',
      enterprise: 'bg-amber-500'
    };
    return colors[tier.toLowerCase()] || 'bg-gray-500';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      active: { color: 'bg-green-500', icon: CheckCircle, label: 'Active' },
      trialing: { color: 'bg-blue-500', icon: TrendingUp, label: 'Trial' },
      past_due: { color: 'bg-red-500', icon: AlertCircle, label: 'Past Due' },
      canceled: { color: 'bg-gray-500', icon: XCircle, label: 'Canceled' },
      none: { color: 'bg-gray-400', icon: AlertCircle, label: 'No Subscription' }
    };

    const config = statusConfig[status] || statusConfig.none;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!subscription) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and track API usage</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getTierBadgeColor(subscription.tier)}>
            {subscription.tier.toUpperCase()}
          </Badge>
          {getStatusBadge(subscription.status)}
        </div>
      </div>

      {/* Trial Warning */}
      {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
        <Alert className="bg-blue-50 border-blue-200">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your trial ends on {formatDate(subscription.trial_end)}. Add a payment method to continue service.
          </AlertDescription>
        </Alert>
      )}

      {/* Cancellation Warning */}
      {subscription.cancel_at_period_end && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your subscription will cancel on {formatDate(subscription.current_period_end)}.
            Reactivate to continue service.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'usage', label: 'Usage & Analytics', icon: TrendingUp },
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'invoices', label: 'Invoices', icon: CreditCard }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Your current plan and billing cycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Plan</span>
                <Badge className={getTierBadgeColor(subscription.tier)}>
                  {subscription.tier.toUpperCase()}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                {getStatusBadge(subscription.status)}
              </div>

              {subscription.current_period_start && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Billing Period</span>
                  <span className="text-sm font-medium">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}

              <div className="pt-4">
                <SubscriptionManager
                  subscription={subscription}
                  onUpdate={fetchSubscription}
                />
              </div>
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Period</CardTitle>
              <CardDescription>API calls in current billing cycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-bold">{subscription.usage.current.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">
                      of {subscription.usage.quota === 'unlimited' ? 'unlimited' : subscription.usage.quota.toLocaleString()} calls
                    </div>
                  </div>
                  {subscription.usage.quota !== 'unlimited' && (
                    <div className={`text-2xl font-bold ${getUsagePercentageColor(subscription.usage.percentage)}`}>
                      {subscription.usage.percentage.toFixed(1)}%
                    </div>
                  )}
                </div>

                {subscription.usage.quota !== 'unlimited' && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        subscription.usage.percentage >= 90
                          ? 'bg-red-600'
                          : subscription.usage.percentage >= 75
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(subscription.usage.percentage, 100)}%` }}
                    />
                  </div>
                )}

                {subscription.usage.quota !== 'unlimited' && subscription.usage.percentage >= 80 && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      You've used {subscription.usage.percentage.toFixed(0)}% of your quota.
                      Consider upgrading to avoid service interruption.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'usage' && <UsageChart />}
      {activeTab === 'keys' && <APIKeyDisplay onRefresh={fetchSubscription} />}
      {activeTab === 'invoices' && <InvoiceList />}
    </div>
  );
};

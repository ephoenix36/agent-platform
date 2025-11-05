/**
 * Subscription Manager Component
 * 
 * Displays current tier and provides controls for upgrading, downgrading, or canceling subscriptions
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  XCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import type { Subscription } from '@/lib/api';

interface SubscriptionManagerProps {
  subscription: Subscription;
  onUpdate: () => void;
}

interface TierInfo {
  name: string;
  displayName: string;
  price: number;
  quota: number | 'unlimited';
  features: string[];
  color: string;
  recommended?: boolean;
}

const TIER_INFO: Record<string, TierInfo> = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    quota: 100,
    features: [
      '100 API calls/month',
      'All evaluation tools',
      'Community support',
      'Public projects only'
    ],
    color: 'bg-gray-500'
  },
  pro: {
    name: 'pro',
    displayName: 'Pro',
    price: 99,
    quota: 10000,
    features: [
      '10,000 API calls/month',
      'All evaluation tools',
      'Email support',
      'Private projects',
      'Priority processing'
    ],
    color: 'bg-blue-500',
    recommended: true
  },
  team: {
    name: 'team',
    displayName: 'Team',
    price: 499,
    quota: 100000,
    features: [
      '100,000 API calls/month',
      'All evaluation tools',
      'Priority support',
      'Up to 10 team members',
      'Advanced analytics',
      'Custom integrations'
    ],
    color: 'bg-purple-500'
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 5000,
    quota: 'unlimited',
    features: [
      'Unlimited API calls',
      'All evaluation tools',
      'Dedicated support',
      'Unlimited team members',
      'Custom deployment',
      'SLA guarantee',
      'Advanced security'
    ],
    color: 'bg-amber-500'
  }
};

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ subscription, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showTierSelector, setShowTierSelector] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [prorationPreview, setProrationPreview] = useState<string | null>(null);

  const currentTier = TIER_INFO[subscription.tier.toLowerCase()] || TIER_INFO.free;
  const availableTiers = Object.values(TIER_INFO).filter(tier => tier.name !== subscription.tier.toLowerCase());

  /**
   * Calculate proration preview (simplified - actual calculation done by backend)
   */
  const calculateProration = (newTier: TierInfo): string => {
    const daysInMonth = 30;
    const currentDate = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const currentMonthlyPrice = currentTier.price;
    const newMonthlyPrice = newTier.price;
    
    const proratedCredit = (currentMonthlyPrice / daysInMonth) * daysRemaining;
    const proratedCharge = (newMonthlyPrice / daysInMonth) * daysRemaining;
    const netCharge = proratedCharge - proratedCredit;

    if (netCharge > 0) {
      return `You'll be charged $${netCharge.toFixed(2)} today (prorated for ${daysRemaining} days)`;
    } else if (netCharge < 0) {
      return `You'll receive a $${Math.abs(netCharge).toFixed(2)} credit (prorated for ${daysRemaining} days)`;
    } else {
      return 'No charge for this period';
    }
  };

  /**
   * Handle upgrade subscription
   */
  const handleUpgrade = async (tierName: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.upgradeSubscription(tierName);
      
      if (response.success) {
        onUpdate();
        setShowTierSelector(false);
        setSelectedTier(null);
      } else {
        setError(response.error || 'Failed to upgrade subscription');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle downgrade subscription
   */
  const handleDowngrade = async (tierName: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.downgradeSubscription(tierName);
      
      if (response.success) {
        onUpdate();
        setShowTierSelector(false);
        setSelectedTier(null);
      } else {
        setError(response.error || 'Failed to downgrade subscription');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle tier change (upgrade or downgrade)
   */
  const handleChangeTier = async (tierName: string) => {
    const newTier = TIER_INFO[tierName];
    if (!newTier) return;

    if (newTier.price > currentTier.price) {
      await handleUpgrade(tierName);
    } else {
      await handleDowngrade(tierName);
    }
  };

  /**
   * Handle cancel subscription
   */
  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.cancelSubscription();
      
      if (response.success) {
        onUpdate();
        setShowCancelConfirm(false);
      } else {
        setError(response.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle reactivate subscription
   */
  const handleReactivate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.reactivateSubscription();
      
      if (response.success) {
        onUpdate();
      } else {
        setError(response.error || 'Failed to reactivate subscription');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle tier selection preview
   */
  const handleTierSelect = (tierName: string) => {
    setSelectedTier(tierName);
    const tier = TIER_INFO[tierName];
    if (tier && tier.price !== currentTier.price) {
      setProrationPreview(calculateProration(tier));
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Tier Card */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={`${currentTier.color} text-white`}>
                  {currentTier.displayName}
                </Badge>
                {currentTier.recommended && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Recommended
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold">
                ${currentTier.price}
                <span className="text-base font-normal text-gray-600">/month</span>
              </div>
              <ul className="space-y-1 text-sm">
                {currentTier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {subscription.cancel_at_period_end ? (
          <Button
            onClick={handleReactivate}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Reactivate Subscription
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setShowTierSelector(!showTierSelector)}
              disabled={loading}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Change Plan
            </Button>
            {subscription.tier.toLowerCase() !== 'free' && (
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                disabled={loading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </>
        )}
      </div>

      {/* Tier Selector */}
      {showTierSelector && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium text-lg">Available Plans</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTier === tier.name ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTierSelect(tier.name)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`${tier.color} text-white`}>
                        {tier.displayName}
                      </Badge>
                      {tier.price > currentTier.price && (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                      {tier.price < currentTier.price && (
                        <TrendingDown className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="text-2xl font-bold">
                      ${tier.price}
                      <span className="text-sm font-normal text-gray-600">/mo</span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {tier.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Proration Preview */}
          {selectedTier && prorationPreview && (
            <Alert className="bg-blue-50 border-blue-200">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {prorationPreview}
              </AlertDescription>
            </Alert>
          )}

          {/* Confirm Change Button */}
          {selectedTier && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleChangeTier(selectedTier)}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Confirm Change to {TIER_INFO[selectedTier]?.displayName}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTierSelector(false);
                  setSelectedTier(null);
                  setProrationPreview(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                Cancel Subscription
              </CardTitle>
              <CardDescription>
                Are you sure you want to cancel your subscription?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Your subscription will remain active until{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}, then you'll be
                  downgraded to the Free tier.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Yes, Cancel Subscription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

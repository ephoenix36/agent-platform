/**
 * Sign-Up Flow Component
 * 
 * User sign-up with tier selection and Stripe Checkout integration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Building
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';

interface SignUpFlowProps {
  initialTier?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TIER_INFO = {
  free: {
    name: 'Free',
    price: 0,
    description: '100 API calls/month',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-500'
  },
  pro: {
    name: 'Pro',
    price: 99,
    description: '10,000 API calls/month',
    icon: Zap,
    color: 'from-blue-500 to-blue-600'
  },
  team: {
    name: 'Team',
    price: 499,
    description: '100,000 API calls/month',
    icon: Users,
    color: 'from-purple-500 to-purple-600'
  },
  enterprise: {
    name: 'Enterprise',
    price: 5000,
    description: 'Unlimited API calls',
    icon: Building,
    color: 'from-amber-500 to-amber-600'
  }
};

export const SignUpFlow: React.FC<SignUpFlowProps> = ({
  initialTier = 'pro',
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'info' | 'tier' | 'processing'>('info');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedTier, setSelectedTier] = useState(initialTier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle tier selection and proceed
   */
  const handleSelectTier = (tier: string) => {
    setSelectedTier(tier);
    if (tier === 'free') {
      // For free tier, just collect info and create account
      setStep('info');
    } else {
      // For paid tiers, proceed to Stripe Checkout
      setStep('tier');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStep('processing');

      if (selectedTier === 'free') {
        // For free tier, register directly
        const response = await api.auth.register(email, 'temporary_password', name);
        
        if (response.success) {
          onSuccess?.();
        } else {
          setError(response.error || 'Failed to create account');
          setStep('info');
        }
      } else if (selectedTier === 'enterprise') {
        // For enterprise, redirect to contact sales
        window.location.href = 'mailto:sales@sotatools.com?subject=Enterprise Plan Inquiry&body=Name: ' + encodeURIComponent(name) + '%0D%0AEmail: ' + encodeURIComponent(email);
      } else {
        // For paid tiers, create Stripe Checkout session
        const response = await api.billing.createCheckoutSession(
          selectedTier,
          window.location.origin + '/billing/success?tier=' + selectedTier,
          window.location.origin + '/signup?tier=' + selectedTier
        );

        if (response.success && response.data?.url) {
          // Redirect to Stripe Checkout
          window.location.href = response.data.url;
        } else {
          setError(response.error || 'Failed to create checkout session');
          setStep('tier');
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setStep('info');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render info collection step
   */
  const renderInfoStep = () => {
    const tierInfo = TIER_INFO[selectedTier as keyof typeof TIER_INFO];
    const Icon = tierInfo.icon;

    return (
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Get Started with SOTA Tools</CardTitle>
          <CardDescription>
            Join thousands of developers building better AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Tier Display */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tierInfo.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{tierInfo.name} Plan</div>
                  <div className="text-sm text-gray-600">{tierInfo.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">${tierInfo.price}</div>
                  <div className="text-xs text-gray-500">/month</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('tier')}
                className="text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                Change plan
              </button>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Benefits */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>14-day free trial on all paid plans</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>No credit card required for Free tier</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Cancel anytime, no questions asked</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Processing...' : selectedTier === 'free' ? 'Create Account' : 'Continue to Payment'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render tier selection step
   */
  const renderTierStep = () => {
    return (
      <Card className="max-w-4xl w-full">
        <CardHeader>
          <CardTitle>Choose Your Plan</CardTitle>
          <CardDescription>
            Select the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(TIER_INFO).map(([key, tier]) => {
              const Icon = tier.icon;
              const isSelected = selectedTier === key;
              
              return (
                <button
                  key={key}
                  onClick={() => handleSelectTier(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{tier.name}</div>
                  <div className="text-2xl font-bold mb-1">${tier.price}</div>
                  <div className="text-xs text-gray-500 mb-3">per month</div>
                  <div className="text-sm text-gray-600">{tier.description}</div>
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-blue-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('info')}>
              Back
            </Button>
            <Button onClick={() => setStep('info')}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render processing step
   */
  const renderProcessingStep = () => {
    return (
      <Card className="max-w-md w-full">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Processing...</h3>
            <p className="text-gray-600">
              {selectedTier === 'free' ? 'Creating your account' : 'Redirecting to payment'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {step === 'info' && renderInfoStep()}
      {step === 'tier' && renderTierStep()}
      {step === 'processing' && renderProcessingStep()}
    </div>
  );
};

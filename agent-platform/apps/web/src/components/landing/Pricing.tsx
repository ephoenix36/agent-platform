/**
 * Pricing Section Component
 * 
 * Pricing tiers with feature comparison and CTAs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Sparkles,
  Users,
  Building,
  Zap,
  HelpCircle
} from 'lucide-react';

interface PricingTier {
  name: string;
  displayName: string;
  price: number;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular?: boolean;
  highlight?: boolean;
  badge?: string;
  icon: any;
}

const tiers: PricingTier[] = [
  {
    name: 'free',
    displayName: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for testing and small projects',
    features: [
      { text: '100 API calls per month', included: true },
      { text: 'All 6 evaluation tools', included: true },
      { text: 'Community support', included: true },
      { text: 'Public projects only', included: true },
      { text: 'Email support', included: false },
      { text: 'Private projects', included: false },
      { text: 'Priority processing', included: false },
      { text: 'Advanced analytics', included: false },
    ],
    cta: 'Get Started',
    icon: Sparkles
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: 99,
    period: 'month',
    description: 'For individual developers and small teams',
    features: [
      { text: '10,000 API calls per month', included: true },
      { text: 'All 6 evaluation tools', included: true },
      { text: 'Email support (24h response)', included: true },
      { text: 'Private projects', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Team collaboration (10 members)', included: false },
      { text: 'Custom integrations', included: false },
    ],
    cta: 'Start 14-Day Trial',
    popular: true,
    highlight: true,
    badge: 'Most Popular',
    icon: Zap
  },
  {
    name: 'team',
    displayName: 'Team',
    price: 499,
    period: 'month',
    description: 'For growing teams and organizations',
    features: [
      { text: '100,000 API calls per month', included: true },
      { text: 'All 6 evaluation tools', included: true },
      { text: 'Priority support (4h response)', included: true },
      { text: 'Private projects', included: true },
      { text: 'Team collaboration (10 members)', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated support engineer', included: true },
    ],
    cta: 'Start 14-Day Trial',
    icon: Users
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 5000,
    period: 'month',
    description: 'For large-scale deployments',
    features: [
      { text: 'Unlimited API calls', included: true },
      { text: 'All 6 evaluation tools', included: true },
      { text: 'Dedicated support (1h response)', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Custom deployment options', included: true },
      { text: 'SLA guarantee (99.9%)', included: true },
      { text: 'Advanced security features', included: true },
      { text: 'Custom contract terms', included: true },
    ],
    cta: 'Contact Sales',
    icon: Building
  }
];

const faqs = [
  {
    question: 'What happens when I exceed my API call limit?',
    answer: 'Your requests will be rate-limited. You can upgrade your plan anytime to increase your quota.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! You can cancel anytime. Your subscription will remain active until the end of your billing period.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee on all paid plans. No questions asked.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) via Stripe.'
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! You can change your plan anytime. Upgrades are prorated, downgrades take effect at the next billing cycle.'
  },
  {
    question: 'Do you offer custom enterprise plans?',
    answer: 'Yes! Contact our sales team to discuss custom pricing for high-volume usage or special requirements.'
  }
];

interface PricingProps {
  onSelectPlan: (tier: string) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start free, scale as you grow. All plans include 14-day free trial.
          </p>

          {/* Billing Cycle Toggle (Future feature) */}
          {/* <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-green-600 font-semibold">Save 20%</span>
            </button>
          </div> */}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.highlight
                    ? 'border-2 border-blue-500 shadow-2xl scale-105'
                    : 'border-2 border-gray-200'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1">
                      ⭐ {tier.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      tier.name === 'free' ? 'from-gray-400 to-gray-500' :
                      tier.name === 'pro' ? 'from-blue-500 to-blue-600' :
                      tier.name === 'team' ? 'from-purple-500 to-purple-600' :
                      'from-amber-500 to-amber-600'
                    } flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">{tier.displayName}</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {tier.description}
                  </CardDescription>
                  <div className="mb-4">
                    <div className="text-5xl font-bold text-gray-900">
                      ${tier.price}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      per {tier.period}
                    </div>
                  </div>
                  <Button
                    onClick={() => onSelectPlan(tier.name)}
                    className={`w-full ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        : ''
                    }`}
                    variant={tier.highlight ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-medium pr-8">
                      {faq.question}
                    </CardTitle>
                    <HelpCircle
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
                {openFaqIndex === index && (
                  <CardContent className="pt-0">
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Still have questions?{' '}
            <a href="mailto:support@sotatools.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact our team
            </a>
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

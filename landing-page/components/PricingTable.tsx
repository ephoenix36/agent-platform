'use client';

import { domains } from '@/lib/domains';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { Button } from './ui/Button';
import Link from 'next/link';
import { analytics } from '@/lib/analytics';

export default function PricingTable() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Monthly subscription per domain. Cancel anytime. 25% of revenue funds breakthrough research.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {domains.map((domain) => {
            const isPopular = domain.id === 'climate' || domain.id === 'healthcare';
            
            return (
              <div
                key={domain.id}
                className={`relative rounded-2xl border-2 p-8 transition-all hover:shadow-xl ${
                  isPopular
                    ? 'border-primary-500 shadow-lg'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Popular
                    </span>
                  </div>
                )}

                {/* Domain Icon + Name */}
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">{domain.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900">{domain.name}</h3>
                  <p className="text-gray-600 mt-2 text-sm">{domain.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      {formatCurrency(domain.pricing)}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Year 1 Target: {formatCurrency(domain.stats.mrr)} MRR
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {domain.useCases.slice(0, 3).map((useCase, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{useCase.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{useCase.result}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ROI Badge */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                  <p className="text-sm text-gray-600">Expected ROI</p>
                  <p className="text-2xl font-bold text-primary-600">{domain.stats.roi}</p>
                </div>

                {/* CTA */}
                <Button
                  variant={isPopular ? 'primary' : 'outline'}
                  className="w-full"
                  asChild
                  onClick={() => analytics.clickCTA(`Get Started - ${domain.name}`, 'Pricing')}
                >
                  <Link href={`/contact?domain=${domain.id}`}>
                    Get Started
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Enterprise Solutions</h3>
          <p className="text-xl mb-8 opacity-90">
            Need multiple domains or custom optimization for your specific use case?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="default"
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100"
              asChild
            >
              <Link href="/contact?type=enterprise">Contact Sales</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/#faq">View FAQ</Link>
            </Button>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            <strong className="text-gray-900">Money-Back Guarantee:</strong> If we don't improve
            your metrics by at least 15% in the first 90 days, we'll refund your investment.
          </p>
        </div>
      </div>
    </section>
  );
}

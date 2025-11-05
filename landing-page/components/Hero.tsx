'use client';

import { Button } from './ui/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { analytics } from '@/lib/analytics';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const stats = [
    { label: 'Improvement Range', value: '15-75%', subtext: 'vs baseline' },
    { label: 'Year 1 Revenue', value: '$7.62M', subtext: 'ARR potential' },
    { label: 'To Research', value: '$1.9M+', subtext: 'philanthropic funding' },
    { label: 'Industries Served', value: '6', subtext: 'optimization domains' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-8 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Smart Automation That Learns • 25% Revenue Funds Breakthrough Research
          </div>

          {/* Main Headline */}
          <h1
            className={`text-5xl md:text-7xl font-bold text-gray-900 mb-6 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            Optimize{' '}
            <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Everything
            </span>
            <br />
            with Evolutionary AI
          </h1>

          {/* Subheadline */}
          <p
            className={`text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            AI-powered optimization agents that evolve strategies for sales, product design,
            education, healthcare, climate solutions, and governance—achieving{' '}
            <strong className="text-gray-900">15-75% improvements</strong> over baseline
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <Button
              variant="primary"
              size="lg"
              asChild
              onClick={() => analytics.clickCTA('Get Started', 'Hero')}
            >
              <Link href="/contact">
                Get Started
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              onClick={() => analytics.clickCTA('View Domains', 'Hero')}
            >
              <Link href="/#domains">
                Explore Domains
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-700 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:shadow-lg transition-all group"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-2">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.subtext}</div>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div
            className={`mt-16 text-center transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <p className="text-sm text-gray-500 mb-4">Trusted by forward-thinking organizations</p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              {/* Placeholder for client logos - replace with actual logos */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-32 h-12 bg-gray-200 rounded-lg animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
}

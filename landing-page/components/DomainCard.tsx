'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import Link from 'next/link';
import type { Domain } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

interface DomainCardProps {
  domain: Domain;
}

export default function DomainCard({ domain }: DomainCardProps) {
  const gradientClasses: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-orange-500',
    teal: 'from-teal-500 to-cyan-500',
    indigo: 'from-indigo-500 to-purple-500',
  };

  return (
    <Card 
      hover 
      className="h-full flex flex-col group"
      onClick={() => analytics.clickDomain(domain.id)}
    >
      <CardHeader>
        {/* Icon + Domain Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${gradientClasses[domain.color]} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
            {domain.icon}
          </div>
          <div>
            <CardTitle className="text-xl">{domain.title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(domain.pricing)}/month
            </p>
          </div>
        </div>
        
        <CardDescription className="text-base leading-relaxed">
          {domain.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Key Use Cases */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
            Top Results
          </h4>
          {domain.outcomes.slice(0, 3).map((outcome, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{outcome.metric}</span>
              <span className="font-semibold text-primary-600">
                {outcome.improvement}
              </span>
            </div>
          ))}
        </div>

        {/* Target Market */}
        <div className="mt-6">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-2">
            Perfect For
          </h4>
          <div className="flex flex-wrap gap-2">
            {domain.targetMarket.map((market, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
              >
                {market}
              </span>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button variant="primary" className="w-full group" asChild>
          <Link href={`/domains/${domain.id}`}>
            Learn More
            <svg
              className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
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
      </CardFooter>
    </Card>
  );
}

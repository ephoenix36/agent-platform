/**
 * Features Section Component
 * 
 * Showcase of all 6 SOTA tools with descriptions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Database,
  Brain,
  Sparkles,
  TestTube,
  Dna,
  Bug,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: Database,
    title: 'Auto Dataset Generation',
    description: 'Automatically generate comprehensive test datasets tailored to your agent\'s domain using advanced AI.',
    benefits: [
      'Save 10+ hours of manual test creation',
      'Domain-specific test cases',
      'Edge case coverage',
      'Continuous dataset expansion'
    ],
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Brain,
    title: 'Memory Evaluation',
    description: 'Rigorously test your agent\'s memory systems across different contexts and conversation lengths.',
    benefits: [
      'Long-term memory accuracy',
      'Context retention testing',
      'Multi-turn conversation analysis',
      'Memory leak detection'
    ],
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Sparkles,
    title: 'Prompt Optimization',
    description: 'Evolutionarily optimize your prompts using genetic algorithms for maximum performance.',
    benefits: [
      'Automated A/B testing',
      'Multi-objective optimization',
      'Performance boost up to 40%',
      'Cost reduction analysis'
    ],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: TestTube,
    title: 'OOD Testing',
    description: 'Test your agent\'s robustness with out-of-distribution inputs and adversarial examples.',
    benefits: [
      'Edge case discovery',
      'Adversarial robustness',
      'Failure mode identification',
      'Safety validation'
    ],
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: Dna,
    title: 'Island Evolution',
    description: 'Evolve agent configurations using multi-population evolutionary algorithms.',
    benefits: [
      'Hyperparameter optimization',
      'Architecture search',
      'Multi-objective balancing',
      'Pareto-optimal solutions'
    ],
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Bug,
    title: 'Artifact Debugging',
    description: 'Step through agent execution with visual debugging and artifact inspection tools.',
    benefits: [
      'Visual execution traces',
      'Intermediate state inspection',
      'Error root cause analysis',
      'Performance bottleneck detection'
    ],
    color: 'from-indigo-500 to-violet-500'
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Ship{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Production-Ready Agents
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Six state-of-the-art tools working together to ensure your AI agents are reliable, 
            efficient, and ready for real-world deployment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 relative overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Ready to See It in Action?</h3>
            <p className="text-blue-100 mb-6 max-w-xl">
              Join thousands of developers using SOTA tools to build better AI agents
            </p>
            <button className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg">
              Start Free Trial →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

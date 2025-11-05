/**
 * Hero Section Component
 * 
 * Landing page hero with value proposition and CTAs
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';

interface HeroProps {
  onStartTrial: () => void;
  onViewDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartTrial, onViewDemo }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-900">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div className="text-white space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>State-of-the-Art AI Agent Tools</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Evaluate, Optimize & Debug{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                AI Agents
              </span>{' '}
              with Confidence
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-blue-100 leading-relaxed">
              Ship production-ready AI agents faster with automated dataset generation, 
              memory evaluation, prompt optimization, and comprehensive debugging tools.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-300" />
                <span className="text-sm">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-300" />
                <span className="text-sm">10,000+ Developers</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={onStartTrial}
                className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-xl transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                onClick={onViewDemo}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-6 border-t border-white/20">
              <p className="text-sm text-blue-200 mb-3">Trusted by leading AI teams</p>
              <div className="flex flex-wrap items-center gap-8 opacity-60">
                {/* Placeholder logos - replace with actual logos */}
                <div className="text-white font-bold">OpenAI</div>
                <div className="text-white font-bold">Anthropic</div>
                <div className="text-white font-bold">Hugging Face</div>
                <div className="text-white font-bold">Langchain</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="hidden lg:block relative">
            <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              {/* Code Example */}
              <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2">agent_evaluation.py</span>
                </div>
                <div className="space-y-2 text-gray-300">
                  <div>
                    <span className="text-purple-400">from</span>{' '}
                    <span className="text-blue-400">sota_tools</span>{' '}
                    <span className="text-purple-400">import</span>{' '}
                    <span className="text-yellow-300">AgentEvaluator</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-500"># Evaluate your agent</span>
                  </div>
                  <div>
                    <span className="text-blue-400">evaluator</span> ={' '}
                    <span className="text-yellow-300">AgentEvaluator</span>()
                  </div>
                  <div>
                    <span className="text-blue-400">results</span> ={' '}
                    <span className="text-blue-400">evaluator</span>.<span className="text-green-400">evaluate</span>(
                  </div>
                  <div className="ml-4">
                    agent=<span className="text-orange-400">my_agent</span>,
                  </div>
                  <div className="ml-4">
                    dataset=<span className="text-green-400">"auto"</span>,{' '}
                    <span className="text-gray-500"># Auto-generated</span>
                  </div>
                  <div className="ml-4">
                    metrics=[<span className="text-green-400">"accuracy"</span>,{' '}
                    <span className="text-green-400">"latency"</span>]
                  </div>
                  <div>)</div>
                  <div className="mt-4">
                    <span className="text-gray-500"># Get insights</span>
                  </div>
                  <div>
                    <span className="text-purple-400">print</span>(
                    <span className="text-blue-400">results</span>.<span className="text-green-400">summary</span>())
                  </div>
                  <div className="mt-3 text-green-400">
                    {'>'} Accuracy: 94.2% ✓
                  </div>
                  <div className="text-green-400">
                    {'>'} Avg Latency: 1.2s ✓
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold">94.2%</div>
                <div className="text-sm opacity-90">Accuracy</div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl p-4 shadow-xl">
                <div className="text-2xl font-bold">1.2s</div>
                <div className="text-sm opacity-90">Latency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};

// Add this to your global CSS for the blob animation
const blobAnimationStyles = `
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
`;

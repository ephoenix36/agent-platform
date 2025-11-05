/**
 * Billing Success Page
 * 
 * Displayed after successful Stripe Checkout
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Mail,
  Key,
  ArrowRight,
  Download,
  Sparkles
} from 'lucide-react';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const tier = searchParams?.get('tier') || 'pro';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown to redirect
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl mb-2">
            Welcome to SOTA Tools! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Your {tier.charAt(0).toUpperCase() + tier.slice(1)} plan is now active
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Success Message */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-green-700">
              Your subscription is now active and you have full access to all features.
            </p>
          </div>

          {/* Next Steps */}
          <div>
            <h3 className="text-xl font-semibold mb-4">What's Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Check Your Email
                  </h4>
                  <p className="text-sm text-gray-600">
                    We've sent you a welcome email with your API key and getting started guide.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Get Your API Key
                  </h4>
                  <p className="text-sm text-gray-600">
                    Head to the dashboard to view and manage your API keys.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Install the SDK
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get started quickly with our Python SDK or REST API.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start Code */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="space-y-2">
                <div className="text-gray-400"># Install the SDK</div>
                <div>pip install sota-tools</div>
                <div className="mt-4 text-gray-400"># Initialize with your API key</div>
                <div>
                  <span className="text-blue-400">from</span>{' '}
                  <span className="text-yellow-300">sota_tools</span>{' '}
                  <span className="text-blue-400">import</span>{' '}
                  <span className="text-yellow-300">AgentEvaluator</span>
                </div>
                <div className="mt-2">
                  <span className="text-blue-400">evaluator</span> ={' '}
                  <span className="text-yellow-300">AgentEvaluator</span>(
                  <span className="text-orange-400">api_key</span>=<span className="text-green-400">"your_api_key"</span>)
                </div>
                <div>
                  <span className="text-blue-400">results</span> ={' '}
                  <span className="text-blue-400">evaluator</span>.<span className="text-green-400">evaluate</span>(
                  <span className="text-orange-400">agent</span>=<span className="text-orange-400">my_agent</span>)
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => window.location.href = '/docs'}
              variant="outline"
              className="flex-1"
            >
              View Documentation
            </Button>
          </div>

          {/* Auto-redirect notice */}
          <div className="text-center text-sm text-gray-500">
            Automatically redirecting to dashboard in {countdown} seconds...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

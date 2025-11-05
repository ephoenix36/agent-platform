/**
 * Landing Page
 * 
 * Main marketing landing page with all sections
 */

'use client';

import React, { useState } from 'react';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { SignUpFlow } from '@/components/landing/SignUpFlow';
import { Button } from '@/components/ui/button';
import { Menu, X, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [selectedTier, setSelectedTier] = useState('pro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleStartTrial = () => {
    setSelectedTier('pro');
    setShowSignUp(true);
  };

  const handleViewDemo = () => {
    // TODO: Add demo video modal or redirect to demo page
    window.open('https://www.youtube.com/watch?v=demo', '_blank');
  };

  const handleSelectPlan = (tier: string) => {
    setSelectedTier(tier);
    setShowSignUp(true);
  };

  const handleSignUpSuccess = () => {
    setShowSignUp(false);
    // Redirect to dashboard or success page
    window.location.href = '/dashboard';
  };

  if (showSignUp) {
    return (
      <SignUpFlow
        initialTier={selectedTier}
        onSuccess={handleSignUpSuccess}
        onCancel={() => setShowSignUp(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SOTA Tools</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </a>
              <a href="/docs" className="text-gray-600 hover:text-gray-900 font-medium">
                Docs
              </a>
              <a href="/blog" className="text-gray-600 hover:text-gray-900 font-medium">
                Blog
              </a>
              <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </a>
              <Button onClick={handleStartTrial}>
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                  Features
                </a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                  Pricing
                </a>
                <a href="/docs" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                  Docs
                </a>
                <a href="/blog" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                  Blog
                </a>
                <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium py-2">
                  Sign In
                </a>
                <Button onClick={handleStartTrial} className="w-full">
                  Start Free Trial
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        <Hero onStartTrial={handleStartTrial} onViewDemo={handleViewDemo} />
        
        <div id="features">
          <Features />
        </div>

        <Pricing onSelectPlan={handleSelectPlan} />

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Company */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold">SOTA Tools</span>
                </div>
                <p className="text-gray-400 text-sm">
                  State-of-the-art tools for evaluating, optimizing, and debugging AI agents.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#features" className="hover:text-white">Features</a></li>
                  <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                  <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                  <li><a href="/api" className="hover:text-white">API Reference</a></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/about" className="hover:text-white">About</a></li>
                  <li><a href="/blog" className="hover:text-white">Blog</a></li>
                  <li><a href="/careers" className="hover:text-white">Careers</a></li>
                  <li><a href="/contact" className="hover:text-white">Contact</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                  <li><a href="/security" className="hover:text-white">Security</a></li>
                  <li><a href="/compliance" className="hover:text-white">Compliance</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2025 SOTA Tools. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

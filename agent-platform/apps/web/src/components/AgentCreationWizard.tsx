/**
 * Agent Creation Wizard
 * 
 * Multi-step wizard for creating agents with monetization
 */

'use client';

import React, { useState } from 'react';
import {
  Sparkles, ArrowRight, ArrowLeft, Check, Zap, Brain,
  Settings, DollarSign, Share2, Rocket, X
} from 'lucide-react';
import { MonetizationConfiguration } from './monetization/MonetizationConfig';
import type { Agent, MonetizationConfig, PrivacyLevel, AgentRules, SystemPrompt } from '@/types/platform';

type WizardStep = 'basics' | 'configuration' | 'monetization' | 'publish' | 'complete';

interface AgentWizardProps {
  onComplete?: (agent: Agent) => void;
  onCancel?: () => void;
}

export function AgentCreationWizard({ onComplete, onCancel }: AgentWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [agentData, setAgentData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    category: 'productivity',
    privacy: 'private',
    model: 'gpt-4-turbo',
    temperature: 0.7,
  });

  const steps: { id: WizardStep; label: string; icon: any }[] = [
    { id: 'basics', label: 'Basics', icon: Sparkles },
    { id: 'configuration', label: 'Configuration', icon: Settings },
    { id: 'monetization', label: 'Monetization', icon: DollarSign },
    { id: 'publish', label: 'Publish', icon: Rocket },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleComplete = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: agentData.name || 'Untitled Agent',
      description: agentData.description || '',
      type: 'agent',
      version: '1.0.0',
      category: agentData.category || 'productivity',
      tags: [],
      privacy: agentData.privacy as PrivacyLevel,
      creator: {
        id: 'user-1',
        name: 'You',
        verified: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      model: agentData.model,
      temperature: agentData.temperature,
      monetization: agentData.monetization,
      systemPrompt: agentData.systemPrompt,
      rules: agentData.rules,
    };

    setCurrentStep('complete');
    setTimeout(() => {
      onComplete?.(newAgent);
    }, 2000);
  };

  const canProceed = () => {
    if (currentStep === 'basics') {
      return agentData.name && agentData.description && agentData.category;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Progress Steps */}
          {currentStep !== 'complete' && (
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = index < currentStepIndex;

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isActive ? 'text-white font-medium' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 transition-all ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-800'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'basics' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  value={agentData.name}
                  onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                  placeholder="e.g., Customer Support Agent"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={agentData.description}
                  onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                  placeholder="What does this agent do?"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={agentData.category}
                  onChange={(e) => setAgentData({ ...agentData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="productivity">Productivity</option>
                  <option value="creative">Creative</option>
                  <option value="research">Research</option>
                  <option value="coding">Coding</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="customer service, chatbot, support"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 'configuration' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Model
                </label>
                <select
                  value={agentData.model}
                  onChange={(e) => setAgentData({ ...agentData, model: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4-turbo">GPT-4 Turbo (Recommended)</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: {agentData.temperature?.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={agentData.temperature}
                  onChange={(e) =>
                    setAgentData({ ...agentData, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Precise</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Prompt (Optional)
                </label>
                <textarea
                  value={agentData.systemPrompt?.content || ''}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      systemPrompt: {
                        id: `prompt-${Date.now()}`,
                        name: `${agentData.name} Prompt`,
                        content: e.target.value,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                    })
                  }
                  placeholder="You are a helpful assistant that..."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Tokens
                </label>
                <input
                  type="number"
                  value={agentData.rules?.maxTokens || 4000}
                  onChange={(e) =>
                    setAgentData({
                      ...agentData,
                      rules: { ...agentData.rules, maxTokens: parseInt(e.target.value) },
                    })
                  }
                  min="100"
                  max="128000"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {currentStep === 'monetization' && (
            <div>
              <MonetizationConfiguration
                itemId="new-agent"
                itemType="agent"
                itemName={agentData.name || 'New Agent'}
                currentConfig={agentData.monetization}
                onUpdate={(config) => setAgentData({ ...agentData, monetization: config })}
              />
            </div>
          )}

          {currentStep === 'publish' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Privacy Level
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'private', label: 'Private', desc: 'Only you can access' },
                    { value: 'unlisted', label: 'Unlisted', desc: 'Anyone with the link' },
                    { value: 'restricted', label: 'Restricted', desc: 'Specific people' },
                    { value: 'public', label: 'Public', desc: 'Everyone can see' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setAgentData({ ...agentData, privacy: option.value as PrivacyLevel })
                      }
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        agentData.privacy === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-gray-400 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-white">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-medium">{agentData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white capitalize">{agentData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model:</span>
                    <span className="text-white">{agentData.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monetization:</span>
                    <span className="text-white capitalize">
                      {agentData.monetization?.model || 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Privacy:</span>
                    <span className="text-white capitalize">{agentData.privacy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Agent Created!</h3>
              <p className="text-gray-400 text-center">
                Your agent "{agentData.name}" has been created successfully.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'complete' && (
          <div className="border-t border-gray-800 p-6 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {currentStepIndex === steps.length - 1 ? 'Create Agent' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

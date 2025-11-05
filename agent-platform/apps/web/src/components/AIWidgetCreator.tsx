/**
 * AI Widget Creator
 * Allows users to create custom widgets using natural language
 */

'use client';

import { useState } from 'react';
import { Sparkles, Code, Eye, Save, X } from 'lucide-react';

export function AIWidgetCreator({ onClose, onSave }: { 
  onClose: () => void; 
  onSave: (widget: any) => void; 
}) {
  const [step, setStep] = useState<'describe' | 'preview' | 'customize'>('describe');
  const [description, setDescription] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [widgetConfig, setWidgetConfig] = useState({
    name: '',
    category: 'custom',
    refreshInterval: 60000,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (in production, this would call your AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate sample widget code based on description
    const code = `
export function CustomWidget({ data }: { data: any }) {
  return (
    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">${widgetConfig.name}</h3>
      <div className="text-2xl font-bold text-purple-400">
        {data?.value || '0'}
      </div>
      <p className="text-sm text-gray-400 mt-2">
        ${description}
      </p>
    </div>
  );
}`;
    
    setGeneratedCode(code);
    setIsGenerating(false);
    setStep('preview');
  };

  const handleSave = () => {
    const widget = {
      id: `custom-${Date.now()}`,
      name: widgetConfig.name,
      description,
      code: generatedCode,
      category: widgetConfig.category,
      config: widgetConfig,
    };
    onSave(widget);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-2xl font-bold">AI Widget Creator</h2>
              <p className="text-sm text-gray-400">Describe your widget and let AI build it</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            {[
              { id: 'describe', label: 'Describe' },
              { id: 'preview', label: 'Preview' },
              { id: 'customize', label: 'Customize' },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === s.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm ${
                    step === s.id ? 'text-white font-semibold' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'describe' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Widget Name</label>
                <input
                  type="text"
                  value={widgetConfig.name}
                  onChange={(e) => setWidgetConfig({ ...widgetConfig, name: e.target.value })}
                  placeholder="e.g., Revenue Tracker"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                           focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want this widget to display...
Example: Show total revenue for the last 30 days with a sparkline chart"
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                           focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={widgetConfig.category}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                             focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="metrics">Metrics</option>
                    <option value="activity">Activity</option>
                    <option value="visualization">Visualization</option>
                    <option value="ai">AI</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Refresh Interval</label>
                  <select
                    value={widgetConfig.refreshInterval}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, refreshInterval: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                             focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                    <option value={0}>Manual only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Generated Code</h3>
                  <button className="text-sm text-purple-400 hover:text-purple-300">
                    Copy Code
                  </button>
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{generatedCode}</code>
                </pre>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Preview</h3>
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">{widgetConfig.name}</h3>
                    <div className="text-2xl font-bold text-purple-400">
                      42
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'customize' && (
            <div className="text-center py-8">
              <p className="text-gray-400">Customization options coming soon!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {step !== 'describe' && (
              <button
                onClick={() => setStep('describe')}
                className="px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                Back
              </button>
            )}

            {step === 'describe' && (
              <button
                onClick={handleGenerate}
                disabled={!widgetConfig.name || !description || isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 
                         hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all 
                         flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Widget</span>
                  </>
                )}
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 
                         hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all 
                         flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Widget</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

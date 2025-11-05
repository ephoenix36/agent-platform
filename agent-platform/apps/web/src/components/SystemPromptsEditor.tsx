/**
 * System Prompts Editor
 * 
 * Template editor with variable substitution and preview
 */

'use client';

import React, { useState } from 'react';
import {
  FileText, Save, Copy, Eye, Code, Sparkles, Plus, Trash2,
  X, Check, AlertCircle
} from 'lucide-react';
import type { SystemPrompt } from '@/types/platform';

interface SystemPromptsEditorProps {
  initialPrompt?: SystemPrompt;
  onSave?: (prompt: SystemPrompt) => void;
  onCancel?: () => void;
}

interface Variable {
  name: string;
  description: string;
  defaultValue: string;
}

const templateExamples = [
  {
    name: 'Customer Support Agent',
    content: `You are a helpful customer support agent for {{company_name}}.

Your role:
- Answer customer questions professionally and empathetically
- Resolve issues when possible
- Escalate complex issues to human agents
- Always maintain a friendly and professional tone

Company Information:
- Name: {{company_name}}
- Industry: {{industry}}
- Support Hours: {{support_hours}}

Guidelines:
- Be concise but thorough
- Use the customer's name when known
- Offer alternatives when the primary solution isn't available`,
    variables: [
      { name: 'company_name', description: 'The name of the company', defaultValue: 'Acme Corp' },
      { name: 'industry', description: 'The industry sector', defaultValue: 'Technology' },
      { name: 'support_hours', description: 'Support availability', defaultValue: '24/7' },
    ],
  },
  {
    name: 'Code Review Agent',
    content: `You are an expert code reviewer specializing in {{programming_language}}.

Review Focus:
- Code quality and best practices
- Security vulnerabilities
- Performance optimizations
- Code readability and maintainability

Standards to Follow:
{{coding_standards}}

When reviewing:
1. Identify issues by severity (Critical, High, Medium, Low)
2. Provide specific examples of improvements
3. Suggest alternative approaches when applicable
4. Be constructive and educational`,
    variables: [
      { name: 'programming_language', description: 'The programming language', defaultValue: 'TypeScript' },
      { name: 'coding_standards', description: 'Coding standards to follow', defaultValue: 'ESLint, Prettier' },
    ],
  },
  {
    name: 'Research Agent',
    content: `You are a research agent specialized in {{research_domain}}.

Research Methodology:
- Gather information from multiple reliable sources
- Verify facts and cross-reference data
- Organize findings in a clear, structured format
- Cite sources when applicable

Focus Areas:
{{focus_areas}}

Output Format:
- Executive Summary
- Key Findings
- Detailed Analysis
- Recommendations
- Sources`,
    variables: [
      { name: 'research_domain', description: 'The research domain', defaultValue: 'Technology Trends' },
      { name: 'focus_areas', description: 'Specific areas to focus on', defaultValue: 'AI, Cloud Computing, Cybersecurity' },
    ],
  },
];

export function SystemPromptsEditor({ initialPrompt, onSave, onCancel }: SystemPromptsEditorProps) {
  const [promptName, setPromptName] = useState(initialPrompt?.name || '');
  const [promptContent, setPromptContent] = useState(initialPrompt?.content || '');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(!initialPrompt);
  const [copied, setCopied] = useState(false);

  // Extract variables from content
  React.useEffect(() => {
    const matches = promptContent.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      const uniqueVars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
      const newVars = uniqueVars.map(varName => {
        const existing = variables.find(v => v.name === varName);
        return existing || {
          name: varName,
          description: '',
          defaultValue: '',
        };
      });
      setVariables(newVars);
    }
  }, [promptContent]);

  const applyTemplate = (template: typeof templateExamples[0]) => {
    setPromptName(template.name);
    setPromptContent(template.content);
    setVariables(template.variables);
    setShowTemplates(false);
  };

  const generatePreview = () => {
    let preview = promptContent;
    variables.forEach(variable => {
      const value = previewValues[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
      preview = preview.replace(new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'), value);
    });
    return preview;
  };

  const handleSave = () => {
    const prompt: SystemPrompt = {
      id: initialPrompt?.id || `prompt-${Date.now()}`,
      name: promptName,
      content: promptContent,
      variables: variables.reduce((acc, v) => ({
        ...acc,
        [v.name]: v.defaultValue,
      }), {}),
      createdAt: initialPrompt?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave?.(prompt);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canSave = promptName.trim() && promptContent.trim();

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-blue-400" />
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="Prompt Name"
              className="text-xl font-bold bg-transparent border-none focus:outline-none text-white placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showPreview ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <textarea
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            placeholder="Enter your system prompt here...

Use {{variable_name}} for dynamic values that can be configured later.

Example:
You are a helpful assistant for {{company_name}}. Your role is to {{role_description}}."
            className="flex-1 w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          {/* Variables Section */}
          {variables.length > 0 && (
            <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Variables ({variables.length})
              </h3>
              <div className="space-y-3">
                {variables.map((variable, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={variable.name}
                        disabled
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={variable.description}
                        onChange={(e) => {
                          const newVars = [...variables];
                          newVars[idx].description = e.target.value;
                          setVariables(newVars);
                        }}
                        placeholder="Describe this variable..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default Value</label>
                      <input
                        type="text"
                        value={variable.defaultValue}
                        onChange={(e) => {
                          const newVars = [...variables];
                          newVars[idx].defaultValue = e.target.value;
                          setVariables(newVars);
                        }}
                        placeholder="Default value..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    Variables are automatically detected from your prompt using the <code className="bg-blue-900/50 px-1 rounded">{'{{variable_name}}'}</code> syntax.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 border-l border-gray-800 p-6 overflow-y-auto bg-gray-900/50">
            <h3 className="font-semibold text-white mb-4">Preview</h3>
            
            {variables.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Variable Values</h4>
                {variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-xs text-gray-400 mb-1">
                      {variable.name} {variable.description && `(${variable.description})`}
                    </label>
                    <input
                      type="text"
                      value={previewValues[variable.name] || variable.defaultValue}
                      onChange={(e) =>
                        setPreviewValues({ ...previewValues, [variable.name]: e.target.value })
                      }
                      placeholder={variable.defaultValue || `Enter ${variable.name}...`}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {generatePreview()}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Prompt Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {templateExamples.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                  <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{template.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Code className="w-3 h-3" />
                    {template.variables.length} variables
                  </div>
                </button>
              ))}

              <button
                onClick={() => setShowTemplates(false)}
                className="w-full p-4 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                Start from Scratch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Project & Agent Selection Modals
 * Full-featured selection with search, configuration, and management
 */

'use client';

import { useState } from 'react';
import { 
  Search, 
  Folder, 
  Plus, 
  Star, 
  Clock,
  Settings,
  X,
  ChevronRight,
  Sliders,
  FileText,
  Zap
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  lastAccessed: Date;
  starred: boolean;
  agentCount: number;
  color: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  documents: string[];
  wakeWord?: string;
}

export function ProjectSelectorModal({ onClose, onSelect }: {
  onClose: () => void;
  onSelect: (project: Project) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'AI Image Studio',
      description: 'Image generation and editing platform',
      lastAccessed: new Date(),
      starred: true,
      agentCount: 5,
      color: 'purple'
    },
    {
      id: '2',
      name: 'Code Playground',
      description: 'Interactive coding environment',
      lastAccessed: new Date(Date.now() - 86400000),
      starred: false,
      agentCount: 3,
      color: 'blue'
    },
  ]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredProjects = filteredProjects.filter(p => p.starred);
  const recentProjects = filteredProjects.filter(p => !p.starred);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] 
                    flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Select Project</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Starred Projects */}
          {starredProjects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                Starred
              </h3>
              <div className="space-y-2">
                {starredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} onClick={() => onSelect(project)} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent
            </h3>
            <div className="space-y-2">
              {recentProjects.map(project => (
                <ProjectCard key={project.id} project={project} onClick={() => onSelect(project)} />
              ))}
            </div>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No projects found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg
                     hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New Project
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition-all
               border border-gray-700 hover:border-purple-500 group text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg bg-${project.color}-500/20 
                        flex items-center justify-center flex-shrink-0`}>
            <Folder className={`w-5 h-5 text-${project.color}-400`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold group-hover:text-purple-400 transition-colors">
              {project.name}
            </h4>
            <p className="text-sm text-gray-400 truncate">{project.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>{project.agentCount} agents</span>
              <span>•</span>
              <span>{formatRelativeTime(project.lastAccessed)}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 
                                transition-colors flex-shrink-0" />
      </div>
    </button>
  );
}

export function AgentConfigModal({ onClose, onSave, initialAgent }: {
  onClose: () => void;
  onSave: (agent: Agent) => void;
  initialAgent?: Agent;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(initialAgent || null);
  const [isConfiguring, setIsConfiguring] = useState(!!initialAgent);

  // Sample agents
  const [agents] = useState<Agent[]>([
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model for complex tasks',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful assistant.',
      tools: [],
      documents: [],
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Faster and more affordable GPT-4',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 128000,
      systemPrompt: 'You are a helpful assistant.',
      tools: [],
      documents: [],
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Most powerful Claude model',
      model: 'claude-3-opus',
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful assistant.',
      tools: [],
      documents: [],
    },
  ]);

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isConfiguring && selectedAgent) {
    return <AgentConfigurationPanel agent={selectedAgent} onBack={() => setIsConfiguring(false)} onSave={onSave} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] 
                    flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Select Agent</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-2">
            {filteredAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setIsConfiguring(true);
                }}
                className="w-full p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition-all
                         border border-gray-700 hover:border-purple-500 group text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 
                                  flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold group-hover:text-purple-400 transition-colors">
                        {agent.name}
                      </h4>
                      <p className="text-sm text-gray-400">{agent.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                          {agent.model}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                          {agent.maxTokens.toLocaleString()} tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  <Settings className="w-5 h-5 text-gray-600 group-hover:text-purple-400 
                                    transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentConfigurationPanel({ agent, onBack, onSave, onClose }: {
  agent: Agent;
  onBack: () => void;
  onSave: (agent: Agent) => void;
  onClose: () => void;
}) {
  const [config, setConfig] = useState(agent);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] 
                    flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">Configure {agent.name}</h2>
                <p className="text-sm text-gray-400">Customize agent behavior</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">System Prompt</label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Model Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Temperature</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused</span>
                <span className="text-purple-400 font-semibold">{config.temperature}</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Top P</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.topP}
                onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span className="text-purple-400 font-semibold">{config.topP}</span>
                <span>1</span>
              </div>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium mb-2">Max Tokens</label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Wake Word (for voice) */}
          <div>
            <label className="block text-sm font-medium mb-2">Wake Word (Voice Mode)</label>
            <input
              type="text"
              value={config.wakeWord || ''}
              onChange={(e) => setConfig({ ...config, wakeWord: e.target.value })}
              placeholder="e.g., 'Hey Assistant'"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                       focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Agent will listen for this phrase to start processing
            </p>
          </div>

          {/* Tools */}
          <div>
            <label className="block text-sm font-medium mb-2">Available Tools</label>
            <div className="space-y-2">
              {['web-search', 'file-access', 'code-execution', 'image-generation'].map(tool => (
                <label key={tool} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg cursor-pointer
                                            hover:bg-gray-750 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.tools.includes(tool)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({ ...config, tools: [...config.tools, tool] });
                      } else {
                        setConfig({ ...config, tools: config.tools.filter(t => t !== tool) });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">{tool.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg
                     hover:shadow-lg transition-all font-medium"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

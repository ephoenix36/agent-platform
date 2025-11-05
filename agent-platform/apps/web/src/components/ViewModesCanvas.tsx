/**
 * View Modes System
 * Multi-view canvas supporting Canvas, Dev, Chat, Graph, and Sessions modes
 */

'use client';

import React, { useState } from 'react';
import {
  Layout, Code, MessageSquare, Network, History,
  ChevronRight, FileCode, Terminal, Bot
} from 'lucide-react';

type ViewMode = 'canvas' | 'dev' | 'chat' | 'graph' | 'sessions';

interface ViewModeTab {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const viewModes: ViewModeTab[] = [
  {
    id: 'canvas',
    label: 'Canvas',
    icon: Layout,
    description: 'Visual workspace for projects and files'
  },
  {
    id: 'dev',
    label: 'Dev',
    icon: Code,
    description: 'Code editor with syntax highlighting'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    description: 'Conversational interface with agents'
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: Network,
    description: 'Relationship and dependency visualization'
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: History,
    description: 'Session history and replay'
  },
];

// Canvas View Component
function CanvasView() {
  return (
    <div className="h-full bg-gray-900/50 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Layout className="w-6 h-6 text-purple-400" />
          Canvas View
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Project Cards */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Image Studio</h3>
                <p className="text-xs text-gray-400">Sub-platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Image generation and editing platform with AI-powered tools
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last edited 2 hours ago</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Code Playground</h3>
                <p className="text-xs text-gray-400">Sub-platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Interactive coding environment with real-time execution
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last edited 1 day ago</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Agent Marketplace</h3>
                <p className="text-xs text-gray-400">Core Platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Browse and deploy AI agents for various tasks
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Active now</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 border-dashed hover:border-purple-500/50 transition-all cursor-pointer group">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                <Layout className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">Create New Platform</h3>
              <p className="text-xs text-gray-400">Start from scratch or use a template</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dev View Component
function DevView() {
  const [selectedFile, setSelectedFile] = useState('app.tsx');
  
  return (
    <div className="h-full flex">
      {/* File Tree */}
      <div className="w-64 border-r border-gray-800 bg-gray-900/50 p-4 overflow-auto">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">FILES</h3>
        <div className="space-y-1">
          {['app.tsx', 'index.tsx', 'components/', 'utils/', 'styles.css'].map((file) => (
            <button
              key={file}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedFile === file
                  ? 'bg-purple-600/20 text-purple-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {file.endsWith('/') ? '📁' : '📄'} {file}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 bg-gray-950 overflow-auto">
        <div className="border-b border-gray-800 px-4 py-2 flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">{selectedFile}</span>
        </div>
        <div className="p-4 font-mono text-sm">
          <pre className="text-gray-300">
{`import React from 'react';

export default function App() {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
      <p>Building platforms within platforms 🚀</p>
    </div>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Chat View Component  
function ChatView() {
  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4">
              <p className="text-gray-200">
                Hi! I'm your AI assistant. I can help you build platforms, write code, 
                design interfaces, and manage your projects. What would you like to create today?
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <div className="flex-1 max-w-2xl">
            <div className="bg-purple-600 rounded-2xl rounded-tr-none p-4">
              <p className="text-white">
                Let's build an image editor platform with AI-powered tools!
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            U
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4">
              <p className="text-gray-200 mb-3">
                Great choice! I'll help you create an AI-powered image editor. Here's what I'll set up:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Image upload and preview</li>
                <li>✓ AI filters and effects</li>
                <li>✓ Background removal</li>
                <li>✓ Object detection and masking</li>
                <li>✓ Style transfer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Message your AI assistant..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Graph View Component
function GraphView() {
  return (
    <div className="h-full bg-gray-900/50 flex items-center justify-center">
      <div className="text-center">
        <Network className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Dependency Graph</h2>
        <p className="text-gray-400 mb-6">
          Visualize relationships between projects, files, and components
        </p>
        <div className="inline-block bg-gray-800/50 border border-gray-700 rounded-xl p-8">
          <p className="text-sm text-gray-500">Graph visualization coming soon!</p>
        </div>
      </div>
    </div>
  );
}

// Sessions View Component
function SessionsView() {
  return (
    <div className="h-full bg-gray-900/50 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <History className="w-6 h-6 text-purple-400" />
          Session History
        </h2>
        
        <div className="space-y-3">
          {[
            { title: 'Built authentication system', time: '2 hours ago', status: 'success' },
            { title: 'Created identity management', time: '1 hour ago', status: 'success' },
            { title: 'Current session', time: 'Active now', status: 'active' },
          ].map((session, i) => (
            <div
              key={i}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    session.status === 'active' ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                  <div>
                    <h3 className="font-medium text-white">{session.title}</h3>
                    <p className="text-xs text-gray-400">{session.time}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ViewModesCanvas() {
  const [activeMode, setActiveMode] = useState<ViewMode>('canvas');

  const renderView = () => {
    switch (activeMode) {
      case 'canvas':
        return <CanvasView />;
      case 'dev':
        return <DevView />;
      case 'chat':
        return <ChatView />;
      case 'graph':
        return <GraphView />;
      case 'sessions':
        return <SessionsView />;
      default:
        return <CanvasView />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* View Mode Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-1 p-2">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeMode === mode.id
                    ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
                title={mode.description}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active View */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}

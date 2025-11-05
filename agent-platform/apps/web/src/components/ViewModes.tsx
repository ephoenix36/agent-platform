/**
 * Canvas View Modes
 * Implement different workspace layouts: Canvas, Dev, Chat, Graph, Sessions
 */

"use client";

import React, { useState } from 'react';
import {
  LayoutGrid, Code, MessageSquare, Network, Clock,
  FolderTree, Terminal, FileCode, Activity
} from 'lucide-react';

export type ViewMode = 'canvas' | 'dev' | 'chat' | 'graph' | 'sessions';

interface ViewModeConfig {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const VIEW_MODES: ViewModeConfig[] = [
  {
    id: 'canvas',
    label: 'Canvas',
    icon: LayoutGrid,
    description: 'Free-form workspace with draggable nodes'
  },
  {
    id: 'dev',
    label: 'Dev Mode',
    icon: Code,
    description: 'Multi-pane layout with file tree, editor, and terminal'
  },
  {
    id: 'chat',
    label: 'Chat Mode',
    icon: MessageSquare,
    description: 'Focused chat view with history and documents'
  },
  {
    id: 'graph',
    label: 'Graph Mode',
    icon: Network,
    description: 'Network visualization of agents, docs, and concepts'
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: Clock,
    description: 'Manage active, pinned, and recent sessions'
  }
];

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({ currentMode, onModeChange }: ViewModeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Current Mode Display */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl transition-all group"
      >
        {React.createElement(VIEW_MODES.find(m => m.id === currentMode)!.icon, {
          className: "w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform"
        })}
        <span className="text-sm font-medium text-gray-300">
          {VIEW_MODES.find(m => m.id === currentMode)?.label}
        </span>
        <div className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Mode Selection Dropdown */}
      {isExpanded && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                onModeChange(mode.id);
                setIsExpanded(false);
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 transition-all ${
                currentMode === mode.id
                  ? 'bg-purple-500/20 border-l-4 border-purple-500'
                  : 'hover:bg-gray-800 border-l-4 border-transparent'
              }`}
            >
              {React.createElement(mode.icon, {
                className: `w-5 h-5 mt-0.5 ${currentMode === mode.id ? 'text-purple-400' : 'text-gray-400'}`
              })}
              <div className="flex-1 text-left">
                <div className={`text-sm font-medium ${currentMode === mode.id ? 'text-purple-300' : 'text-gray-300'}`}>
                  {mode.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {mode.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Dev Mode Layout Component
export function DevModeLayout() {
  return (
    <div className="h-full grid grid-cols-[250px_1fr_400px] grid-rows-[1fr_200px] gap-2 p-4">
      {/* File Tree */}
      <div className="row-span-2 bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <FolderTree className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-300">Project Files</h3>
        </div>
        <div className="space-y-1 text-sm text-gray-400">
          <div className="pl-2">📁 src/</div>
          <div className="pl-4">📄 main.py</div>
          <div className="pl-4">📄 app.py</div>
          <div className="pl-2">📁 tests/</div>
          <div className="pl-4">📄 test_main.py</div>
          <div className="pl-2">📄 README.md</div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">main.py</span>
          </div>
        </div>
        <div className="p-4 font-mono text-sm text-gray-300">
          <div className="text-purple-400"># Python code editor</div>
          <div className="text-blue-400">def</div> <span className="text-yellow-400">main</span>():
          <div className="pl-4">print(<span className="text-green-400">"Hello, World!"</span>)</div>
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Terminal</span>
          </div>
        </div>
        <div className="p-4 font-mono text-sm text-green-400">
          <div>$ python main.py</div>
          <div className="text-gray-500">Running...</div>
        </div>
      </div>

      {/* Logs/Output */}
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-300">Activity Log</span>
          </div>
        </div>
        <div className="p-4 text-sm text-gray-400 space-y-1">
          <div>[INFO] Application started</div>
          <div>[INFO] Connecting to database...</div>
          <div className="text-green-400">[SUCCESS] Connected</div>
        </div>
      </div>
    </div>
  );
}

// Chat Mode Layout Component
export function ChatModeLayout() {
  return (
    <div className="h-full grid grid-cols-[1fr_300px] gap-4 p-4">
      {/* Chat History */}
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-300">Conversation</h3>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[70%] bg-purple-500/20 border border-purple-500/30 rounded-2xl rounded-tr-sm px-4 py-2">
              <p className="text-sm text-gray-200">Hello! Can you help me with this project?</p>
            </div>
          </div>
          {/* AI message */}
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-gray-800/50 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-2">
              <p className="text-sm text-gray-200">Of course! I'd be happy to help. What aspect of the project would you like to work on?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Documents & Context */}
      <div className="space-y-4">
        {/* Project Files */}
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Project Files</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2 p-2 hover:bg-gray-800/50 rounded cursor-pointer">
              <FileCode className="w-4 h-4" />
              <span>README.md</span>
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-gray-800/50 rounded cursor-pointer">
              <FileCode className="w-4 h-4" />
              <span>main.py</span>
            </div>
          </div>
        </div>

        {/* Attached Documents */}
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Attached Docs</h4>
          <div className="text-sm text-gray-500">
            No documents attached
          </div>
        </div>
      </div>
    </div>
  );
}

// Sessions Layout Component
export function SessionsLayout() {
  const sessions = [
    { id: '1', name: 'API Development', type: 'canvas', lastActive: '2 minutes ago', pinned: true },
    { id: '2', name: 'Database Design', type: 'chat', lastActive: '1 hour ago', pinned: false },
    { id: '3', name: 'Feature Planning', type: 'canvas', lastActive: '3 hours ago', pinned: false },
  ];

  return (
    <div className="h-full p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Sessions</h2>

        {/* Pinned Sessions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Pinned</h3>
          <div className="grid grid-cols-3 gap-4">
            {sessions.filter(s => s.pinned).map(session => (
              <div key={session.id} className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-200 group-hover:text-purple-300">{session.name}</h4>
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xs text-gray-500">
                  {session.type} • {session.lastActive}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent</h3>
          <div className="grid grid-cols-3 gap-4">
            {sessions.filter(s => !s.pinned).map(session => (
              <div key={session.id} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/50 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-200 group-hover:text-gray-100">{session.name}</h4>
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-xs text-gray-500">
                  {session.type} • {session.lastActive}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

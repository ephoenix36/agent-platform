/**
 * Omnibar - The Universal Control Center
 * Enhanced floating chat bar with movable/resizable functionality,
 * 3-state voice toggle, and comprehensive controls
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, MicOff, Paperclip, User, FileText, 
  Plus, Settings, Minimize2, Maximize2, Move,
  Command, Brain, X
} from 'lucide-react';
import { Rnd } from 'react-rnd';

type VoiceMode = 'text' | 'voice-transcript' | 'immersive-voice';

interface Document {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface CustomButton {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

interface OmnibarProps {
  onSendMessage: (message: string, documents?: Document[]) => void;
  selectedAgent?: string;
  onAgentChange?: (agentId: string) => void;
  systemPrompt?: string;
  onSystemPromptChange?: (prompt: string) => void;
  project?: string;
  onProjectChange?: (projectId: string) => void;
  customButtons?: CustomButton[];
  onAddCustomButton?: () => void;
}

export function Omnibar({
  onSendMessage,
  selectedAgent,
  onAgentChange,
  systemPrompt,
  onSystemPromptChange,
  project,
  onProjectChange,
  customButtons = [],
  onAddCustomButton,
}: OmnibarProps) {
  const [message, setMessage] = useState('');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('text');
  const [attachedDocs, setAttachedDocs] = useState<Document[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Ctrl key for snap-to-grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Voice mode cycle
  const cycleVoiceMode = () => {
    const modes: VoiceMode[] = ['text', 'voice-transcript', 'immersive-voice'];
    const currentIndex = modes.indexOf(voiceMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setVoiceMode(modes[nextIndex]);
    
    if (modes[nextIndex] !== 'text') {
      startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    // TODO: Implement Web Speech API
    console.log('Starting voice recording...');
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    setTranscript('');
    console.log('Stopping voice recording...');
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs: Document[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setAttachedDocs([...attachedDocs, ...newDocs]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const newDocs: Document[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));
    setAttachedDocs([...attachedDocs, ...newDocs]);
  };

  const handleSend = () => {
    if (message.trim() || attachedDocs.length > 0) {
      onSendMessage(message, attachedDocs);
      setMessage('');
      setAttachedDocs([]);
      setTranscript('');
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Immersive voice mode - minimal UI
  if (voiceMode === 'immersive-voice') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl z-50 flex items-center justify-center">
        <div className="text-center space-y-8">
          {/* Pulsing microphone */}
          <div className="relative">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center ${isRecording ? 'animate-pulse' : ''}`}>
              <Mic className="w-16 h-16 text-white" />
            </div>
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping" />
            )}
          </div>
          
          {/* Live transcript */}
          {transcript && (
            <div className="max-w-2xl mx-auto">
              <p className="text-white/70 text-sm mb-2">You said:</p>
              <p className="text-white text-2xl font-light">{transcript}</p>
            </div>
          )}
          
          {/* Controls */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={cycleVoiceMode}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur transition-all"
            >
              Exit Voice Mode
            </button>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all"
            >
              {isRecording ? 'Stop' : 'Start'} Recording
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) {
    return null;
  }

  return (
    <Rnd
      default={{
        x: typeof window !== 'undefined' ? window.innerWidth / 2 - 400 : 100,
        y: typeof window !== 'undefined' ? window.innerHeight - 100 : 100,
        width: 800,
        height: isExpanded ? 400 : 80,
      }}
      minWidth={400}
      minHeight={isCollapsed ? 50 : 80}
      maxHeight={600}
      bounds="window"
      dragHandleClassName="omnibar-drag-handle"
      enableResizing={{
        top: true,
        right: true,
        bottom: false,
        left: true,
        topRight: true,
        topLeft: true,
        bottomRight: false,
        bottomLeft: false,
      }}
      onDragStart={() => setIsDragging(true)}
      onDragStop={() => setIsDragging(false)}
      dragGrid={isCtrlPressed ? [20, 20] : [1, 1]}
      className={`transition-all duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <div
        className="h-full bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Collapsed State */}
        {isCollapsed ? (
          <div className="h-full flex items-center justify-between px-4 omnibar-drag-handle cursor-move">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Omnibar</span>
            </div>
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Header / Drag Handle */}
            <div className="omnibar-drag-handle cursor-move flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500">Hold Ctrl to snap</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Project Selector (above main bar) */}
            {project && (
              <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">{project}</span>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col p-4">
              {/* Attached Documents */}
              {attachedDocs.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg group"
                    >
                      <Paperclip className="w-3 h-3 text-blue-400" />
                      <span className="text-sm text-blue-300">{doc.name}</span>
                      <button
                        onClick={() => setAttachedDocs(attachedDocs.filter(d => d.id !== doc.id))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-blue-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Control Bar */}
              <div className="flex items-end gap-2">
                {/* Agent Selector */}
                <button
                  onClick={() => setShowAgentSelector(!showAgentSelector)}
                  className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-all group"
                  title="Select Agent"
                >
                  <User className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                </button>

                {/* Rules/System Prompt */}
                <button
                  onClick={() => setShowRulesEditor(!showRulesEditor)}
                  className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all group"
                  title="Edit System Prompt"
                >
                  <Settings className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {/* Document Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl transition-all group"
                  title="Attach Documents"
                >
                  <Paperclip className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  {attachedDocs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                      {attachedDocs.length}
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </button>

                {/* Main Text Input */}
                <div className="flex-1 relative">
                  {voiceMode === 'voice-transcript' && transcript && (
                    <div className="absolute bottom-full mb-2 w-full p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <p className="text-xs text-purple-300">"{transcript}"</p>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={voiceMode === 'voice-transcript' ? transcript : message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={voiceMode === 'voice-transcript' ? 'Listening...' : 'Type your message...'}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none max-h-32 transition-all"
                    rows={1}
                    disabled={voiceMode === 'voice-transcript'}
                  />
                </div>

                {/* Voice Toggle */}
                <button
                  onClick={cycleVoiceMode}
                  className={`p-3 rounded-xl transition-all ${
                    voiceMode === 'text'
                      ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-400'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 animate-pulse'
                  }`}
                  title={voiceMode === 'text' ? 'Enable Voice' : 'Voice Active'}
                >
                  {voiceMode === 'text' ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!message.trim() && attachedDocs.length === 0}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>

                {/* Custom Buttons Area */}
                {customButtons.map(btn => (
                  <button
                    key={btn.id}
                    onClick={btn.action}
                    className="p-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl transition-all"
                    title={btn.label}
                  >
                    <Command className="w-5 h-5 text-indigo-400" />
                  </button>
                ))}
                
                {/* Add Custom Button */}
                <button
                  onClick={onAddCustomButton}
                  className="p-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-xl transition-all"
                  title="Add Custom Button"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Voice Mode Indicator */}
              {voiceMode !== 'text' && (
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  {voiceMode === 'voice-transcript' ? 'Voice + Transcript Mode' : 'Immersive Voice Mode'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Selector Popup */}
        {showAgentSelector && !isCollapsed && (
          <div className="absolute bottom-full mb-2 left-4 w-64 p-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2">Select Agent</h3>
            {/* TODO: Agent list */}
            <p className="text-xs text-gray-500">Agent selector coming soon...</p>
          </div>
        )}

        {/* Rules Editor Popup */}
        {showRulesEditor && !isCollapsed && (
          <div className="absolute bottom-full mb-2 left-20 w-96 p-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2">System Prompt</h3>
            <textarea
              value={systemPrompt || ''}
              onChange={(e) => onSystemPromptChange?.(e.target.value)}
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Enter system prompt..."
            />
          </div>
        )}
      </div>
    </Rnd>
  );
}

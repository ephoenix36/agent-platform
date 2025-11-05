/**
 * Omnibar V2 - Universal Control Center
 * Connected to global Zustand store with state persistence
 * Features: Agent selection, system prompts, document attachments, voice modes
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
  Send, Mic, MicOff, Paperclip, User, FileText, 
  Plus, Settings, Minimize2, Maximize2, X,
  Command, Brain, Zap, FolderTree
} from 'lucide-react';
import { usePlatformStore } from '@/store';

type VoiceMode = 'text' | 'voice-transcript' | 'immersive-voice';

interface Document {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface OmnibarV2Props {
  onSendMessage: (message: string, documents?: Document[]) => void;
}

export function OmnibarV2({ onSendMessage }: OmnibarV2Props) {
  const {
    omnibar,
    setOmnibarExpanded,
    setOmnibarCollapsed,
    setOmnibarPosition,
    setOmnibarSize,
    updateOmnibar,
  } = usePlatformStore();

  const [message, setMessage] = useState('');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('text');
  const [attachedDocs, setAttachedDocs] = useState<Document[]>([]);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSnapHint, setShowSnapHint] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Ctrl key for snap-to-grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
        setShowSnapHint(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
        setShowSnapHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message, attachedDocs);
    setMessage('');
    setAttachedDocs([]);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs = files.map(file => ({
      id: Math.random().toString(36),
      name: file.name,
      type: file.type,
    }));
    setAttachedDocs([...attachedDocs, ...newDocs]);
  };

  const cycleVoiceMode = () => {
    const modes: VoiceMode[] = ['text', 'voice-transcript', 'immersive-voice'];
    const currentIndex = modes.indexOf(voiceMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setVoiceMode(nextMode);
    if (nextMode !== 'text') {
      setOmnibarExpanded(true);
    }
  };

  const handleDragStop = (e: any, d: any) => {
    setOmnibarPosition({ x: d.x, y: d.y });
  };

  const handleResizeStop = (e: any, direction: any, ref: any, delta: any, position: any) => {
    setOmnibarSize({
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height),
    });
    setOmnibarPosition(position);
  };

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) {
    return null;
  }

  // Immersive Voice Mode
  if (voiceMode === 'immersive-voice') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900/95 via-gray-900/95 to-pink-900/95 backdrop-blur-md flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            {isRecording ? (
              <Mic className="w-16 h-16 text-white" />
            ) : (
              <MicOff className="w-16 h-16 text-white" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Voice Mode</h2>
          <p className="text-gray-300">Speak naturally, I'm listening...</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setVoiceMode('text')}
            className="px-8 py-4 bg-gray-800/50 hover:bg-gray-700 text-white rounded-2xl transition-all"
          >
            Exit Voice Mode
          </button>
          <button
            onClick={() => setIsRecording(!isRecording)}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl transition-all shadow-lg"
          >
            {isRecording ? 'Stop' : 'Start'} Recording
          </button>
        </div>
      </div>
    );
  }

  // Calculate snap-to-edge
  const snapToEdge = isCtrlPressed;

  return (
    <>
      {/* Snap Hint */}
      {showSnapHint && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 bg-purple-500/90 text-white text-sm rounded-full shadow-lg animate-bounce">
          Snap to edges enabled (Ctrl held)
        </div>
      )}

      <Rnd
        default={{
          x: typeof window !== 'undefined' ? window.innerWidth / 2 - 400 : 100,
          y: typeof window !== 'undefined' ? window.innerHeight - 140 : 100,
          width: 800,
          height: omnibar.isExpanded ? 400 : 140,
        }}
        position={omnibar.position}
        size={omnibar.size}
        minWidth={400}
        minHeight={omnibar.isCollapsed ? 60 : 140}
        maxHeight={600}
        bounds="window"
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        dragHandleClassName="omnibar-drag-handle"
        enableResizing={!omnibar.isCollapsed}
        disableDragging={false}
        style={{
          zIndex: 45,
        }}
      >
        <div className="h-full bg-gray-900/95 border-2 border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
          {/* Header with Icon Buttons */}
          <div className="omnibar-drag-handle px-4 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-gray-700/50 cursor-move flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Icon Buttons Row */}
              <button
                onClick={() => setShowProjectSelector(!showProjectSelector)}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group"
                title="Select Project"
              >
                <FolderTree className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
              </button>
              <button
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group"
                title="Select Agent"
              >
                <Brain className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
              </button>
              <button
                onClick={() => setShowRulesEditor(!showRulesEditor)}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group"
                title="Edit System Prompt"
              >
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
              </button>
              <button
                onClick={handleFileSelect}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group"
                title="Attach Documents"
              >
                <Paperclip className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
              </button>
              <button
                onClick={cycleVoiceMode}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors group"
                title={voiceMode === 'text' ? 'Enable Voice' : 'Change Voice Mode'}
              >
                {voiceMode === 'text' ? (
                  <MicOff className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                ) : (
                  <Mic className="w-4 h-4 text-purple-400" />
                )}
              </button>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOmnibarExpanded(!omnibar.isExpanded)}
                className="p-1.5 hover:bg-gray-700/50 rounded transition-colors"
                title={omnibar.isExpanded ? "Collapse" : "Expand"}
              >
                {omnibar.isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setOmnibarCollapsed(!omnibar.isCollapsed)}
                className="p-1.5 hover:bg-gray-700/50 rounded transition-colors"
                title={omnibar.isCollapsed ? "Restore" : "Minimize"}
              >
                <Minimize2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          {!omnibar.isCollapsed && (
            <div className="flex-1 flex flex-col p-4">
              {/* Text Input */}
              <div className="flex-1 flex items-center gap-3 mb-3">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                  rows={omnibar.isExpanded ? 8 : 2}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg"
                  title="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Attached Documents */}
              {attachedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachedDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-sm"
                    >
                      <FileText className="w-3 h-3 text-purple-400" />
                      <span className="text-gray-300">{doc.name}</span>
                      <button
                        onClick={() => setAttachedDocs(attachedDocs.filter(d => d.id !== doc.id))}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Context Info */}
              {(omnibar.selectedAgent || omnibar.currentProject) && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {omnibar.selectedAgent && (
                    <div className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      <span>{omnibar.selectedAgent}</span>
                    </div>
                  )}
                  {omnibar.currentProject && (
                    <div className="flex items-center gap-1">
                      <FolderTree className="w-3 h-3" />
                      <span>{omnibar.currentProject}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </Rnd>

      {/* Modal Overlays */}
      {showProjectSelector && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center" onClick={() => setShowProjectSelector(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Select Project</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left text-white rounded-xl transition-colors">
                Project 1
              </button>
              <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left text-white rounded-xl transition-colors">
                Project 2
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgentSelector && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center" onClick={() => setShowAgentSelector(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Select Agent</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left text-white rounded-xl transition-colors">
                Code Reviewer
              </button>
              <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left text-white rounded-xl transition-colors">
                Content Writer
              </button>
            </div>
          </div>
        </div>
      )}

      {showRulesEditor && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center" onClick={() => setShowRulesEditor(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-[600px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">System Prompt</h3>
            <textarea
              className="w-full h-48 bg-gray-800 border border-gray-700 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-purple-500/50"
              placeholder="Enter system prompt..."
              defaultValue={omnibar.systemPrompt}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRulesEditor(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRulesEditor(false)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

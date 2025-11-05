/**
 * Floating Chat Bar Component
 * A persistent, morphing chat interface that transitions across different views
 * Includes model selection, agent management, voice mode, and document upload
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, MicOff, Paperclip, Settings, Sparkles, Users,
  FolderOpen, BookOpen, X, ChevronDown, Zap, DollarSign,
  Clock, TrendingUp, Image, FileText, Video, Music, Code,
  Database, ChevronUp, Plus, Trash2, Edit3
} from 'lucide-react';
import { SUPPORTED_PROVIDERS, type ProviderType } from '@/types/providers';

interface FloatingChatBarProps {
  onSend?: (message: string, context: ChatContext) => void;
  onVoiceToggle?: (enabled: boolean) => void;
  onFileUpload?: (files: File[]) => void;
  position?: 'center' | 'bottom';
  className?: string;
}

interface ChatContext {
  selectedModel: string;
  selectedProvider: ProviderType;
  activeAgents: string[];
  systemPrompts: string[];
  attachedDocuments: AttachedDocument[];
  voiceEnabled: boolean;
}

interface AttachedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string;
}

export function FloatingChatBar({
  onSend,
  onVoiceToggle,
  onFileUpload,
  position = 'center',
  className = '',
}: FloatingChatBarProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showAgentManager, setShowAgentManager] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('xai');
  const [selectedModel, setSelectedModel] = useState('grok-4-fast');
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentHoverRef = useRef<HTMLDivElement>(null);
  const [hoveredDocument, setHoveredDocument] = useState<string | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim() && attachedDocuments.length === 0) return;
    
    const context: ChatContext = {
      selectedModel,
      selectedProvider,
      activeAgents,
      systemPrompts: [],
      attachedDocuments,
      voiceEnabled,
    };
    
    onSend?.(message, context);
    setMessage('');
    setAttachedDocuments([]);
    setIsExpanded(false);
  };

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    onVoiceToggle?.(newState);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newDocs = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    
    setAttachedDocuments(prev => [...prev, ...newDocs]);
    onFileUpload?.(files);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeDocument = (id: string) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('pdf')) return FileText;
    if (type.includes('json') || type.includes('javascript') || type.includes('typescript')) return Code;
    if (type.includes('database')) return Database;
    return FileText;
  };

  // Get current model info
  const currentModel = SUPPORTED_PROVIDERS[selectedProvider].models.find(m => m.id === selectedModel);
  const modelCost = currentModel ? `$${currentModel.pricing.inputCostPer1M}/$${currentModel.pricing.outputCostPer1M}` : '—';

  const positionStyles = position === 'center' 
    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    : 'bottom-8 left-1/2 -translate-x-1/2';

  return (
    <>
      {/* Main Floating Chat Bar */}
      <div
        className={`fixed ${positionStyles} z-50 transition-all duration-300 ${className} ${
          isExpanded ? 'w-[800px]' : 'w-[600px]'
        }`}
      >
        <div className={`bg-gray-900/95 backdrop-blur-xl border-2 rounded-2xl shadow-2xl transition-all duration-300 ${
          isFocused ? 'border-blue-500 shadow-blue-500/50' : 'border-gray-700'
        }`}>
          {/* Top Bar - Model & Agent Selection */}
          {(isExpanded || isFocused) && (
            <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2 flex-wrap">
              {/* Model Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">{currentModel?.name || selectedModel}</span>
                  <span className="text-xs text-gray-400">{modelCost}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showModelSelector && (
                  <div className="absolute top-full mt-2 left-0 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-auto">
                    {(Object.keys(SUPPORTED_PROVIDERS) as ProviderType[]).map(providerId => (
                      <div key={providerId} className="p-2 border-b border-gray-700 last:border-0">
                        <div className="text-xs font-semibold text-gray-400 px-2 py-1">
                          {SUPPORTED_PROVIDERS[providerId].name}
                        </div>
                        {SUPPORTED_PROVIDERS[providerId].models.map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedProvider(providerId);
                              setSelectedModel(model.id);
                              setShowModelSelector(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                              selectedModel === model.id && selectedProvider === providerId
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-medium">{model.name}</div>
                              <div className="text-xs text-gray-400">
                                ${model.pricing.inputCostPer1M}/${ model.pricing.outputCostPer1M} per 1M
                              </div>
                            </div>
                            {'intelligenceIndex' in model.pricing && model.pricing.intelligenceIndex && (
                              <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                IQ: {model.pricing.intelligenceIndex.toFixed(0)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Agents */}
              <button
                onClick={() => setShowAgentManager(!showAgentManager)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>{activeAgents.length} Agents</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Project Manager */}
              <button
                onClick={() => setShowProjectManager(!showProjectManager)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-green-400" />
                <span>Project</span>
              </button>

              {/* System Prompts */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Rules</span>
              </button>

              {/* Voice Mode Toggle */}
              <button
                onClick={toggleVoice}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  voiceEnabled 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {voiceEnabled ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
              </button>
            </div>
          )}

          {/* Attached Documents - Fan Out on Hover */}
          {attachedDocuments.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-800">
              <div
                ref={documentHoverRef}
                className="relative flex items-center gap-2"
                onMouseEnter={() => setShowDocuments(true)}
                onMouseLeave={() => {
                  // Delay hiding to allow clicking
                  setTimeout(() => setShowDocuments(false), 200);
                }}
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{attachedDocuments.length} files</span>
                </div>
                
                {/* Stacked Preview */}
                <div className="flex -space-x-2">
                  {attachedDocuments.slice(0, 3).map((doc, index) => {
                    const Icon = getFileIcon(doc.type);
                    return (
                      <div
                        key={doc.id}
                        className="w-8 h-8 rounded-lg bg-gray-800 border-2 border-gray-900 flex items-center justify-center transition-transform hover:scale-110 hover:z-10"
                        style={{ zIndex: 3 - index }}
                      >
                        {doc.preview ? (
                          <img src={doc.preview} alt={doc.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Icon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                  {attachedDocuments.length > 3 && (
                    <div className="w-8 h-8 rounded-lg bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-400">
                      +{attachedDocuments.length - 3}
                    </div>
                  )}
                </div>

                {/* Fanned Out Documents */}
                {showDocuments && (
                  <div className="absolute bottom-full mb-2 left-0 flex items-end gap-2 p-2">
                    {attachedDocuments.map((doc, index) => {
                      const Icon = getFileIcon(doc.type);
                      const rotation = (index - attachedDocuments.length / 2) * 5;
                      const translateY = Math.abs(rotation) * 2;
                      
                      return (
                        <div
                          key={doc.id}
                          className="relative group"
                          style={{
                            transform: `rotate(${rotation}deg) translateY(-${translateY}px)`,
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                          onMouseEnter={() => setHoveredDocument(doc.id)}
                          onMouseLeave={() => setHoveredDocument(null)}
                        >
                          <div className={`w-24 h-32 rounded-xl bg-gray-800 border-2 border-gray-700 overflow-hidden transition-all ${
                            hoveredDocument === doc.id ? 'scale-110 border-blue-500 shadow-lg shadow-blue-500/50' : ''
                          }`}>
                            {doc.preview ? (
                              <img src={doc.preview} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                <Icon className="w-8 h-8 text-gray-400 mb-2" />
                                <div className="text-xs text-gray-400 text-center line-clamp-2">
                                  {doc.name}
                                </div>
                              </div>
                            )}
                            
                            {/* Hover Actions */}
                            {hoveredDocument === doc.id && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2">
                                <button
                                  onClick={() => removeDocument(doc.id)}
                                  className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Filename Tooltip */}
                          {hoveredDocument === doc.id && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap border border-gray-700">
                              {doc.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Input Area */}
          <div className="p-4">
            <div className="flex items-end gap-3">
              {/* File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors group"
                title="Attach files"
              >
                <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.json,.csv,.md"
              />

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    setIsExpanded(true);
                  }}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={voiceEnabled ? '🎤 Listening...' : 'Ask anything or type a command...'}
                  className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[44px] max-h-[200px]"
                  rows={1}
                  disabled={voiceEnabled}
                />
                
                {/* Character Count */}
                {message.length > 0 && (
                  <div className="absolute bottom-1 right-2 text-xs text-gray-500">
                    {message.length}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!message.trim() && attachedDocuments.length === 0}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 disabled:shadow-none group"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions / Suggestions */}
          {isFocused && message.length === 0 && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-800">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs text-gray-500 mr-2">Quick actions:</div>
                {[
                  { label: 'Optimize Agents', icon: TrendingUp },
                  { label: 'Create Workflow', icon: Sparkles },
                  { label: 'Analyze Costs', icon: DollarSign },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => setMessage(action.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors"
                    >
                      <Icon className="w-3 h-3" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {(showModelSelector || showAgentManager || showProjectManager) && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => {
            setShowModelSelector(false);
            setShowAgentManager(false);
            setShowProjectManager(false);
          }}
        />
      )}
    </>
  );
}

export default FloatingChatBar;

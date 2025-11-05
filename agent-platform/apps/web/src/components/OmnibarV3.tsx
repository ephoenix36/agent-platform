/**
 * OmnibarV3 - Production-Quality Omnibar
 * 
 * Features:
 * - Minimized circle state with icon
 * - Dynamic resizing based on content
 * - Custom button support
 * - Elegant animations
 * - Voice mode with inline transcripts
 * - Document fanning previews
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Settings, 
  Mic, 
  MicOff,
  Paperclip,
  Send,
  Minimize2,
  Maximize2,
  X,
  ChevronRight,
  Zap,
  FileText,
  Image as ImageIcon,
  File,
  Plus
} from 'lucide-react';
import { usePlatformStore } from '@/store';
import { ProjectSelectorModal, AgentConfigModal } from './ProjectAgentSelectors';

type OmnibarState = 'minimized' | 'compact' | 'expanded' | 'fullscreen';
type VoiceMode = 'off' | 'listening' | 'processing';

interface CustomButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface DocumentPreview {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'image' | 'code' | 'paste';
  preview?: string;
  size?: number;
  uploadedAt: Date;
}

export function OmnibarV3() {
  const { omnibar, updateOmnibar } = usePlatformStore();
  const [state, setState] = useState<OmnibarState>('minimized');
  const [message, setMessage] = useState('');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [documents, setDocuments] = useState<DocumentPreview[]>([]);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<Array<{
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
  }>>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize based on content
  useEffect(() => {
    if (state === 'expanded' && message.length > 100) {
      // Expand vertically for long messages
    }
    if (documents.length > 0 && state === 'compact') {
      setState('expanded');
    }
  }, [message, documents, state]);

  // Voice wake word detection (configurable)
  useEffect(() => {
    if (voiceMode === 'listening') {
      // In production: integrate with Web Speech API or Whisper
      // Listen for wake word configured in agent settings
    }
  }, [voiceMode]);

  const handleMinimize = () => {
    setState('minimized');
  };

  const handleExpand = () => {
    setState(state === 'minimized' ? 'compact' : 'expanded');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = () => {
    if (!message.trim() && documents.length === 0) return;
    
    // Send message with documents
    console.log('Sending:', { message, documents });
    setMessage('');
    setDocuments([]);
    
    // Add to transcript if voice mode
    if (voiceMode !== 'off') {
      setVoiceTranscript(prev => [...prev, {
        role: 'user',
        text: message,
        timestamp: new Date()
      }]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs: DocumentPreview[] = files.map(file => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      type: getFileType(file),
      size: file.size,
      uploadedAt: new Date()
    }));
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handlePasteText = () => {
    // Open modal for pasting large text
    const text = prompt('Paste your text here:');
    if (text) {
      setDocuments(prev => [...prev, {
        id: `paste-${Date.now()}`,
        name: `Pasted text (${text.length} chars)`,
        type: 'paste',
        preview: text.slice(0, 200) + '...',
        uploadedAt: new Date()
      }]);
    }
  };

  const toggleVoice = () => {
    if (voiceMode === 'off') {
      setVoiceMode('listening');
      setState('expanded'); // Expand to show transcript
    } else {
      setVoiceMode('off');
      setVoiceTranscript([]);
    }
  };

  const addCustomButton = (button: CustomButton) => {
    setCustomButtons(prev => [...prev, button]);
  };

  // Minimized state - floating circle
  if (state === 'minimized') {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 group"
        onMouseEnter={() => setState('compact')}
      >
        <button
          onClick={handleExpand}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 
                   shadow-lg shadow-purple-500/50 flex items-center justify-center
                   hover:scale-110 transition-all duration-300 group-hover:shadow-xl
                   group-hover:shadow-purple-500/70"
        >
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm 
                      px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity
                      whitespace-nowrap pointer-events-none">
          Open Omnibar
        </div>
      </div>
    );
  }

  // Compact state - single line
  if (state === 'compact') {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 bg-gray-900 rounded-2xl shadow-2xl
                   border border-gray-800 transition-all duration-300 ease-out"
        style={{ width: '400px' }}
      >
        <div className="p-3 flex items-center gap-2">
          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <input
            ref={inputRef as any}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setState('expanded')}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent outline-none text-sm"
          />

          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-colors ${
              voiceMode !== 'off' ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-800'
            }`}
          >
            {voiceMode !== 'off' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            onClick={handleSend}
            disabled={!message.trim() && documents.length === 0}
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg
                     transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.txt,.md,.json,.csv,.png,.jpg,.jpeg,.gif,.mp4"
        />
      </div>
    );
  }

  // Expanded state - full featured
  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-gray-900 rounded-2xl shadow-2xl
                 border border-gray-800 transition-all duration-300 ease-out"
      style={{ 
        width: '600px',
        maxHeight: '80vh',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 
                        flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Omnibar</h3>
            <p className="text-xs text-gray-400">
              {omnibar.selectedAgent || 'No agent selected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          <button
            onClick={() => setShowProjectSelector(true)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Select Project"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAgentConfig(true)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Configure Agent"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Custom Buttons */}
          {customButtons.map(btn => (
            <button
              key={btn.id}
              onClick={btn.onClick}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title={btn.label}
              style={{ color: btn.color }}
            >
              {btn.icon}
            </button>
          ))}

          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setState('fullscreen')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Transcript (if active) */}
      {voiceMode !== 'off' && voiceTranscript.length > 0 && (
        <div className="max-h-40 overflow-y-auto p-4 border-b border-gray-800 bg-gray-950/50">
          <div className="space-y-2">
            {voiceTranscript.map((t, i) => (
              <div key={i} className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  t.role === 'user' 
                    ? 'bg-purple-500/20 text-purple-100' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents - Fanning Preview */}
      {documents.length > 0 && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Documents ({documents.length})</span>
            <button
              onClick={() => setDocuments([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {documents.map((doc, i) => (
              <div
                key={doc.id}
                onMouseEnter={() => setHoveredDoc(doc.id)}
                onMouseLeave={() => setHoveredDoc(null)}
                className="relative flex-shrink-0 w-24 h-32 rounded-lg border border-gray-700
                         hover:border-purple-500 transition-all cursor-pointer group"
                style={{
                  transform: hoveredDoc === doc.id ? 'scale(1.05)' : `translateX(${i * -10}px)`,
                  zIndex: hoveredDoc === doc.id ? 10 : documents.length - i,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 
                              rounded-lg p-2 flex flex-col items-center justify-center">
                  {getDocIcon(doc.type)}
                  <span className="text-xs mt-2 text-center truncate w-full px-1">
                    {doc.name}
                  </span>
                </div>
                
                <button
                  onClick={() => setDocuments(docs => docs.filter(d => d.id !== doc.id))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full
                           flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-24 h-32 rounded-lg border-2 border-dashed 
                       border-gray-700 hover:border-purple-500 transition-all
                       flex flex-col items-center justify-center gap-2 group"
            >
              <Plus className="w-6 h-6 text-gray-600 group-hover:text-purple-400" />
              <span className="text-xs text-gray-600 group-hover:text-purple-400">
                Add more
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          rows={3}
          className="w-full bg-gray-800 rounded-lg px-4 py-3 outline-none resize-none
                   focus:ring-2 focus:ring-purple-500 transition-all"
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-all ${
                voiceMode !== 'off' 
                  ? 'bg-red-500/20 text-red-400 animate-pulse' 
                  : 'hover:bg-gray-800'
              }`}
              title={voiceMode !== 'off' ? 'Stop listening' : 'Start voice mode'}
            >
              {voiceMode !== 'off' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              onClick={handlePasteText}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Paste text"
            >
              <FileText className="w-5 h-5" />
            </button>

            <span className="text-xs text-gray-500">
              {message.length} / 10,000
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() && documents.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg
                     transition-all flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="*/*"
      />

      {/* Modals */}
      {showProjectSelector && (
        <ProjectSelectorModal
          onClose={() => setShowProjectSelector(false)}
          onSelect={(project) => {
            updateOmnibar({ selectedProject: project.id });
            setShowProjectSelector(false);
          }}
        />
      )}

      {showAgentConfig && (
        <AgentConfigModal
          onClose={() => setShowAgentConfig(false)}
          initialAgent={omnibar.selectedAgent ? { 
            id: omnibar.selectedAgent, 
            name: omnibar.selectedAgent,
            description: '',
            model: 'claude-3-5-sonnet',
            temperature: omnibar.temperature || 0.7,
            topP: omnibar.topP || 1.0,
            maxTokens: omnibar.maxTokens || 4096,
            systemPrompt: omnibar.systemPrompt || '',
            tools: [],
            documents: [],
            wakeWord: omnibar.wakeWord
          } : undefined}
          onSave={(agent) => {
            updateOmnibar({ 
              selectedAgent: agent.id,
              systemPrompt: agent.systemPrompt,
              temperature: agent.temperature,
              topP: agent.topP,
              maxTokens: agent.maxTokens,
              wakeWord: agent.wakeWord
            });
          }}
        />
      )}
    </div>
  );
}

// Helper functions
function getFileType(file: File): DocumentPreview['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('text') || file.name.endsWith('.md')) return 'text';
  return 'code';
}

function getDocIcon(type: DocumentPreview['type']) {
  switch (type) {
    case 'image': return <ImageIcon className="w-8 h-8 text-blue-400" />;
    case 'pdf': return <File className="w-8 h-8 text-red-400" />;
    case 'text': return <FileText className="w-8 h-8 text-green-400" />;
    case 'paste': return <FileText className="w-8 h-8 text-yellow-400" />;
    default: return <File className="w-8 h-8 text-gray-400" />;
  }
}

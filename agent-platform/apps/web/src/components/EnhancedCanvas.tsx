'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Search, Mic, Sparkles, Plus, Play, Save, Share2, Settings, Zap, MessageSquare,
  Keyboard, FileText, Database, Sliders, Send, X, Upload, Trash2, Edit3, Check,
  AlertCircle, Info, ChevronDown, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { WidgetFactory } from './canvas/Widgets';
import type { CanvasWidget } from '@/types/platform';
import { getVoiceToolByTrigger, executeVoiceTool } from '@/lib/voiceAgentTools';

// Import custom nodes
import { AgentNode } from './canvas/nodes/AgentNode';
import { DataSourceNode } from './canvas/nodes/DataSourceNode';
import { WorkflowNode } from './canvas/nodes/WorkflowNode';

interface MarketplaceItem {
  id: string;
  type: 'agent' | 'workflow' | 'tool';
  name: string;
  description: string;
  icon: string;
  category: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
}

interface AgentPreset {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
}

interface Document {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'url' | 'code';
  content: string;
  size?: number;
  uploadedAt: Date;
}

interface DataStore {
  id: string;
  name: string;
  type: 'vector' | 'sql' | 'nosql' | 'api';
  connection: string;
  description: string;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const marketplaceItems: MarketplaceItem[] = [
  {
    id: '1',
    type: 'agent',
    name: 'Website Builder Pro',
    description: 'Build complete websites',
    icon: '🌐',
    category: 'creative',
    model: 'gpt-4',
    temperature: 0.7,
    systemPrompt: 'You are an expert web developer who creates beautiful, modern websites.'
  },
  {
    id: '2',
    type: 'agent',
    name: 'Research Agent',
    description: 'Advanced research capabilities',
    icon: '🔍',
    category: 'research',
    model: 'gpt-4',
    temperature: 0.3,
    systemPrompt: 'You are a thorough researcher who finds and synthesizes information accurately.'
  },
  {
    id: '3',
    type: 'workflow',
    name: 'Marketing Funnel',
    description: 'Complete marketing automation',
    icon: '📈',
    category: 'automation'
  },
  {
    id: '4',
    type: 'tool',
    name: 'Stripe Connector',
    description: 'Payment processing',
    icon: '💳',
    category: 'productivity'
  },
];

const defaultAgentPresets: AgentPreset[] = [
  {
    id: 'gpt-4-creative',
    name: 'GPT-4 Creative',
    model: 'gpt-4',
    temperature: 0.9,
    maxTokens: 4000,
    systemPrompt: 'You are a creative AI assistant who thinks outside the box and provides innovative solutions.',
    tools: ['web_search', 'image_generation', 'code_execution']
  },
  {
    id: 'gpt-4-analytical',
    name: 'GPT-4 Analytical',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 4000,
    systemPrompt: 'You are a precise, analytical AI assistant who provides detailed, fact-based responses.',
    tools: ['web_search', 'calculator', 'data_analysis']
  },
  {
    id: 'claude-balanced',
    name: 'Claude Balanced',
    model: 'claude-3-opus',
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: 'You are Claude, a helpful AI assistant created by Anthropic. You provide balanced, thoughtful responses.',
    tools: ['web_search', 'document_analysis']
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are a helpful AI assistant.',
    tools: []
  }
];

export function EnhancedCanvas() {
  // Node and Edge state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // UI State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePanel, setActivePanel] = useState<'text' | 'voice' | 'docs' | 'agent' | null>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceHistory, setVoiceHistory] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  // Text Input State
  const [textInput, setTextInput] = useState('');
  const [textHistory, setTextHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  // Document Management State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dataStores, setDataStores] = useState<DataStore[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  
  // Agent Configuration State
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<AgentPreset>(defaultAgentPresets[0]);
  const [agentPresets, setAgentPresets] = useState<AgentPreset[]>(defaultAgentPresets);
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  
  // Widget management
  const [widgets, setWidgets] = useState<CanvasWidget[]>([]);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);

  // Debug State
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<Array<{time: string, level: string, message: string}>>([]);

  // Memoize node types to prevent React Flow warnings
  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
    dataSource: DataSourceNode,
    workflow: WorkflowNode,
  }), []);

  // Debug logging function
  const addDebugLog = useCallback((level: 'info' | 'warn' | 'error', message: string) => {
    const log = {
      time: new Date().toLocaleTimeString(),
      level,
      message
    };
    setDebugLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
    console.log(`[${level.toUpperCase()}] ${message}`);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      addDebugLog('info', `Connected ${params.source} to ${params.target}`);
    },
    [setEdges, addDebugLog]
  );

  // Add node from marketplace
  const addNodeFromMarketplace = useCallback((item: MarketplaceItem) => {
    const nodeType = item.type === 'agent' ? 'agent' : 
                     item.type === 'workflow' ? 'workflow' : 
                     'dataSource';
    
    const newNode: Node = {
      id: `${item.type}-${Date.now()}`,
      type: nodeType,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 400 + 100 
      },
      data: { 
        name: item.name,
        description: item.description,
        icon: item.icon,
        type: item.type,
        status: 'idle',
        model: item.model || 'gpt-4',
        temperature: item.temperature || 0.7,
        systemPrompt: item.systemPrompt || '',
        preset: selectedPreset,
        documents: documents.filter(d => selectedDocs.includes(d.id)),
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setSearchOpen(false);
    setSearchQuery('');
    addDebugLog('info', `Added ${item.type}: ${item.name}`);
  }, [setNodes, selectedPreset, documents, selectedDocs, addDebugLog]);

  // Text input processing
  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim()) return;
    
    const userMessage = { role: 'user' as const, content: textInput };
    setTextHistory(prev => [...prev, userMessage]);
    addDebugLog('info', `Text input: ${textInput.substring(0, 50)}...`);
    
    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse = { 
        role: 'assistant' as const, 
        content: `I received your message: "${textInput}". This is a simulated response. Connect this to your AI backend for real responses.`
      };
      setTextHistory(prev => [...prev, aiResponse]);
      addDebugLog('info', 'AI response generated');
    }, 1000);
    
    setTextInput('');
  }, [textInput, addDebugLog]);

  // Document upload
  const handleDocumentUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDoc: Document = {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 
                file.type.includes('text') ? 'text' : 'code',
          content: e.target?.result as string,
          size: file.size,
          uploadedAt: new Date()
        };
        setDocuments(prev => [...prev, newDoc]);
        addDebugLog('info', `Uploaded document: ${file.name}`);
      };
      reader.readAsText(file);
    });
  }, [addDebugLog]);

  // Widget management functions
  const addWidget = useCallback((widget: CanvasWidget) => {
    setWidgets(prev => [...prev, widget]);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  const updateWidget = useCallback((widget: CanvasWidget) => {
    setWidgets(prev => prev.map(w => w.id === widget.id ? widget : w));
  }, []);

  // Toggle voice transcript widget
  const toggleVoiceTranscript = useCallback(() => {
    setShowVoiceTranscript(prev => !prev);
    
    if (!showVoiceTranscript) {
      // Create voice transcript widget
      const transcriptWidget: CanvasWidget = {
        id: 'voice-transcript-main',
        type: 'voice_transcript',
        config: {
          title: 'Voice Transcript',
          content: voiceHistory,
          autoDisplay: true,
        },
        position: { x: window.innerWidth - 420, y: 20 },
        size: { width: 400, height: 300 },
      };
      addWidget(transcriptWidget);
    } else {
      // Remove voice transcript widget
      removeWidget('voice-transcript-main');
    }
  }, [showVoiceTranscript, voiceHistory, addWidget, removeWidget]);

  // Voice recognition with enhanced error handling
  const startVoiceRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      const error = 'Voice recognition is not supported in your browser. Please use Chrome or Edge.';
      setVoiceError(error);
      addDebugLog('error', error);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true; // Enable interim results for better UX
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        addDebugLog('info', 'Voice recognition started');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setVoiceTranscript(transcript);
        
        // Only process on final result
        if (event.results[event.results.length - 1].isFinal) {
          addDebugLog('info', `Voice command: ${transcript}`);
          processVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        const errorMsg = `Speech recognition error: ${event.error}`;
        console.error(errorMsg);
        setIsListening(false);
        
        // Enhanced error handling with user-friendly messages
        switch (event.error) {
          case 'not-allowed':
            setVoiceError('Microphone access denied. Please allow microphone permissions.');
            addDebugLog('error', 'Microphone permission denied');
            break;
          case 'network':
            setVoiceError('Network error. Voice recognition requires HTTPS in production.');
            addDebugLog('warn', 'Network error - may need HTTPS');
            break;
          case 'no-speech':
            setVoiceError('No speech detected. Please speak clearly into your microphone.');
            addDebugLog('warn', 'No speech detected - try again');
            // Auto-clear this error after 3 seconds
            setTimeout(() => setVoiceError(null), 3000);
            break;
          case 'audio-capture':
            setVoiceError('No microphone detected. Please check your audio input device.');
            addDebugLog('error', 'No microphone found');
            break;
          case 'aborted':
            setVoiceError('Speech recognition was aborted.');
            addDebugLog('info', 'Voice recognition aborted');
            break;
          default:
            setVoiceError(`Unknown error: ${event.error}`);
            addDebugLog('error', `Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        addDebugLog('info', 'Voice recognition ended');
      };

      recognition.start();
      addDebugLog('info', 'Attempting to start voice recognition...');
    } catch (error) {
      const errorMsg = 'Failed to start voice recognition';
      console.error(errorMsg, error);
      setIsListening(false);
      setVoiceError(errorMsg + '. Please check your browser permissions.');
      addDebugLog('error', errorMsg);
    }
  }, [addDebugLog]);

  // Process voice commands
  const processVoiceCommand = async (command: string) => {
    // Add to history
    setVoiceHistory(prev => [...prev, command]);
    
    // Update voice transcript widget if enabled
    if (showVoiceTranscript) {
      const transcriptWidget = widgets.find(w => w.type === 'voice_transcript');
      if (transcriptWidget) {
        const updatedWidget = {
          ...transcriptWidget,
          config: {
            ...transcriptWidget.config,
            content: [...voiceHistory, command],
          },
        };
        setWidgets(widgets.map(w => w.id === transcriptWidget.id ? updatedWidget : w));
      }
    }
    
    // Check if command matches a voice tool
    const voiceTool = getVoiceToolByTrigger(command);
    if (voiceTool) {
      try {
        const result = await executeVoiceTool(voiceTool, command, {
          addNodeToCanvas: addNodeFromMarketplace,
          setSearchQuery,
          setSearchOpen,
        });
        console.log('Voice tool executed:', result);
        
        // Show success feedback
        if (result.success) {
          // Could add a toast notification here
          console.log(result.message || 'Command executed successfully');
        }
      } catch (error) {
        console.error('Error executing voice tool:', error);
      }
      return;
    }
    
    // Fallback to simple command processing
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('add') || lowerCommand.includes('create')) {
      if (lowerCommand.includes('website')) {
        addNodeFromMarketplace(marketplaceItems[0]);
      } else if (lowerCommand.includes('research')) {
        addNodeFromMarketplace(marketplaceItems[1]);
      } else if (lowerCommand.includes('marketing')) {
        addNodeFromMarketplace(marketplaceItems[2]);
      } else if (lowerCommand.includes('stripe') || lowerCommand.includes('payment')) {
        addNodeFromMarketplace(marketplaceItems[3]);
      } else {
        setSearchQuery(command);
        setSearchOpen(true);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setDebugMode(!debugMode);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setActivePanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchOpen, debugMode]);

  const filteredItems = marketplaceItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-gray-950 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#4B5563" gap={16} />
        <Controls />
        <MiniMap />
        
        {/* Top Toolbar */}
        <Panel position="top-left" className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-lg p-3 m-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm text-white">Search (⌘K)</span>
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'text' ? null : 'text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activePanel === 'text'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <Keyboard className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Text</span>
            </button>
            
            <button
              onClick={startVoiceRecognition}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Mic className="w-4 h-4 text-white" />
              <span className="text-sm text-white">
                {isListening ? 'Listening...' : 'Voice'}
              </span>
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'docs' ? null : 'docs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activePanel === 'docs'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Docs ({documents.length})</span>
            </button>

            <button
              onClick={toggleVoiceTranscript}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                showVoiceTranscript
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Toggle voice transcript"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Transcript</span>
            </button>

            <div className="h-6 w-px bg-gray-700 mx-2"></div>

            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`p-2 rounded-lg transition-all ${
                debugMode ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-800'
              }`}
              title="Toggle debug mode (⌘/)"
            >
              <Zap className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-all">
              <Play className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-all">
              <Save className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-all">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-all">
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </Panel>

        {/* AI Assistant - Enhanced with Voice Error Display */}
        <Panel position="bottom-right" className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-lg p-4 m-4 max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-white">Canvas AI</span>
            {debugMode && (
              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">DEBUG</span>
            )}
          </div>
          {voiceTranscript && (
            <div className="bg-gray-800 rounded-lg p-3 mb-2">
              <p className="text-xs text-gray-400 mb-1">Voice Input:</p>
              <p className="text-sm text-gray-300">{voiceTranscript}</p>
            </div>
          )}
          <p className="text-sm text-gray-400">
            {nodes.length === 0 
              ? 'Click "Text" for chat interface, "Voice" to speak, or press ⌘K to search'
              : `${nodes.length} node${nodes.length > 1 ? 's' : ''} on canvas • ${edges.length} connection${edges.length > 1 ? 's' : ''}`
            }
          </p>
          {activePanel && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
              <Info className="w-3 h-3" />
              <span>{activePanel === 'text' ? 'Text panel open' : activePanel === 'docs' ? 'Documents panel open' : 'Panel active'}</span>
            </div>
          )}
        </Panel>
      </ReactFlow>

      {/* Search Modal */}
      {searchOpen && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-32 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agents, workflows, and tools..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addNodeFromMarketplace(item)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-all text-left group"
                >
                  <div className="text-3xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                  </div>
                  <div className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300 capitalize">
                    {item.type}
                  </div>
                  <Plus className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No results found</p>
                  <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-800/50 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
              <div>Press ESC to close</div>
              <div>Click to add to canvas</div>
            </div>
          </div>
        </div>
      )}

      {/* Close search on ESC */}
      {searchOpen && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => setSearchOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
        />
      )}

      {/* Text Input Panel */}
      {activePanel === 'text' && (
        <div className="absolute left-4 bottom-4 w-96 max-h-[600px] bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Text Input</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {textHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Type a message or command below</p>
              </div>
            ) : (
              textHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                }}
                placeholder="Type a message or command..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* Voice Error Display */}
      {voiceError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-xl border border-red-400 rounded-lg p-4 shadow-xl z-50 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Voice Recognition Error</p>
              <p className="text-white/90 text-sm mt-1">{voiceError}</p>
            </div>
            <button
              onClick={() => setVoiceError(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Document Panel */}
      {activePanel === 'docs' && (
        <div className="absolute right-4 top-20 w-96 max-h-[600px] bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">Documents & Data</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <input
                type="file"
                id="doc-upload"
                multiple
                accept=".txt,.pdf,.md,.json,.csv"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Upload Documents</p>
                <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
              </label>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Uploaded Documents</p>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gray-800 rounded-lg p-3 flex items-center gap-3"
                  >
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {doc.size ? `${(doc.size / 1024).toFixed(1)}KB` : 'Unknown size'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDocuments(docs => docs.filter(d => d.id !== doc.id))}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Console */}
      {debugMode && (
        <div className="absolute bottom-4 right-4 w-[500px] max-h-[400px] bg-black/95 backdrop-blur-xl border border-green-500/50 rounded-lg shadow-2xl z-50 flex flex-col font-mono text-xs">
          <div className="p-3 border-b border-green-500/50 flex items-center justify-between bg-green-950/30">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-green-400">Debug Console</span>
            </div>
            <button
              onClick={() => setDebugMode(false)}
              className="p-1 hover:bg-green-900/50 rounded transition-colors"
            >
              <X className="w-3 h-3 text-green-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {debugLogs.length === 0 ? (
              <p className="text-green-600">No debug logs yet...</p>
            ) : (
              debugLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}
                >
                  <span className="text-gray-600">[{log.time}]</span>
                  <span className="uppercase font-bold w-12">{log.level}</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-green-500/50 bg-green-950/30">
            <p className="text-green-600">
              {debugLogs.length} logs • Press Cmd+/ to toggle
            </p>
          </div>
        </div>
      )}

      {/* Widgets Layer */}
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className="absolute z-50"
          style={{
            left: widget.position.x,
            top: widget.position.y,
          }}
        >
          <WidgetFactory
            widget={widget}
            onClose={() => removeWidget(widget.id)}
            onUpdate={updateWidget}
          />
        </div>
      ))}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  agentRecommendations?: Array<{
    name: string;
    successRate: number;
    cost: number;
    users: number;
  }>;
}

interface VoiceCommandsProps {
  onAgentCreated?: (agentConfig: any) => void;
  onAgentExecute?: (agentId: string, input: any) => void;
}

export default function VoiceCommands({ onAgentCreated, onAgentExecute }: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSubmit(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Welcome message
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your AI agent assistant. I can help you create, find, and run agents. Try saying:\n\n• \"Create a research agent\"\n• \"Find an agent for data analysis\"\n• \"Show me trending agents\"",
        timestamp: new Date(),
        suggestions: [
          'Create a research agent',
          'Find data analysis agents',
          'Show trending agents',
          'Help me automate email'
        ]
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (text?: string) => {
    const message = text || inputText;
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Simulate AI processing (replace with actual API call)
    setTimeout(() => {
      const response = processCommand(message);
      setMessages((prev) => [...prev, response]);
      setIsProcessing(false);
    }, 1000);
  };

  const processCommand = (command: string): Message => {
    const lower = command.toLowerCase();

    // Create agent
    if (lower.includes('create') && lower.includes('agent')) {
      return {
        role: 'assistant',
        content: "I'll help you create an agent. What kind of agent do you need? For example:\n\n• Research and analysis\n• Customer support\n• Data processing\n• Content generation\n• Task automation",
        timestamp: new Date(),
        suggestions: [
          'Research agent',
          'Support agent',
          'Data analyst',
          'Content writer'
        ]
      };
    }

    // Find agents
    if (lower.includes('find') || lower.includes('search') || lower.includes('show')) {
      if (lower.includes('github') && lower.includes('slack')) {
        return {
          role: 'assistant',
          content: "I found 3 pre-built agents for GitHub and Slack integration:",
          timestamp: new Date(),
          agentRecommendations: [
            { name: 'GitHub-Slack Star Notifier', successRate: 98.5, cost: 0.003, users: 12453 },
            { name: 'Repo Activity Tracker', successRate: 96.2, cost: 0.005, users: 8741 },
            { name: 'Social Code Monitor', successRate: 94.8, cost: 0.007, users: 5234 },
          ],
          suggestions: [
            'Try #1',
            'Compare all three',
            'Show me more options',
            'Create custom agent'
          ]
        };
      }

      if (lower.includes('data') || lower.includes('analytics')) {
        return {
          role: 'assistant',
          content: "Here are the top data analysis agents:",
          timestamp: new Date(),
          agentRecommendations: [
            { name: 'Data Analyst Pro', successRate: 97.3, cost: 0.012, users: 15234 },
            { name: 'Analytics Crew', successRate: 96.1, cost: 0.015, users: 11432 },
            { name: 'Business Intelligence Bot', successRate: 95.4, cost: 0.010, users: 9821 },
          ],
          suggestions: ['Try #1', 'See reviews', 'Filter by price']
        };
      }

      return {
        role: 'assistant',
        content: "I can help you find agents! What are you trying to accomplish? For example:\n\n• Monitor GitHub repos\n• Analyze data\n• Generate content\n• Automate emails\n• Process documents",
        timestamp: new Date(),
        suggestions: [
          'GitHub monitoring',
          'Data analysis',
          'Email automation',
          'Document processing'
        ]
      };
    }

    // Research agent
    if (lower.includes('research')) {
      return {
        role: 'assistant',
        content: "Perfect! I'll create a research agent for you. What should it research?\n\nI can set it up to:\n• Search the web\n• Analyze documents\n• Summarize findings\n• Generate reports\n\nWhat's your main use case?",
        timestamp: new Date(),
        suggestions: [
          'Market research',
          'Academic research',
          'Competitor analysis',
          'News monitoring'
        ]
      };
    }

    // Default response
    return {
      role: 'assistant',
      content: "I can help you with:\n\n🤖 **Creating agents** - Build custom AI agents for any task\n🔍 **Finding agents** - Discover pre-built agents from our marketplace\n⚡ **Running agents** - Execute agents with your data\n📊 **Monitoring** - Track performance and costs\n\nWhat would you like to do?",
      timestamp: new Date(),
      suggestions: [
        'Create an agent',
        'Browse marketplace',
        'Show trending agents',
        'Help with automation'
      ]
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    handleSubmit(suggestion);
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-gray-800 flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-blue-400" />
        <div className="flex-1">
          <h2 className="font-semibold">AI Assistant</h2>
          <p className="text-xs text-gray-400">Ask me anything about agents</p>
        </div>
        {isListening && (
          <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold">Listening...</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Avatar */}
              <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                }`}>
                  {message.role === 'user' ? '👤' : <Bot className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                  {/* Message bubble */}
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gray-800 border border-gray-700'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>

                  {/* Agent recommendations */}
                  {message.agentRecommendations && (
                    <div className="mt-3 space-y-2">
                      {message.agentRecommendations.map((agent, i) => (
                        <div
                          key={i}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-blue-500 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">
                              {i + 1}. {agent.name}
                            </span>
                            <span className="text-xs text-green-400">
                              {agent.successRate}% success
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>${agent.cost}/run</span>
                            <span>•</span>
                            <span>{agent.users.toLocaleString()} users</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-lg transition-all ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask me anything... (or use voice)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={() => handleSubmit()}
            disabled={!inputText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Try: "Create a research agent" or "Find GitHub monitoring agents"
        </p>
      </div>
    </div>
  );
}

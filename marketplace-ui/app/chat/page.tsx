"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Plus,
  Minimize2,
  Maximize2,
  X,
  GitBranch,
  TrendingUp,
  Zap
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Format time consistently for SSR (avoid hydration mismatch)
const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

// Mock data for agents
const AVAILABLE_AGENTS = [
  { id: "1", name: "Academic Scholar", category: "research", color: "#3B82F6", avatar: "📚" },
  { id: "2", name: "Code Expert", category: "coding", color: "#8B5CF6", avatar: "💻" },
  { id: "3", name: "Data Analyst", category: "analysis", color: "#10B981", avatar: "📊" },
];

type Message = {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  branchId?: string;
};

type Agent = {
  id: string;
  name: string;
  category: string;
  color: string;
  avatar: string;
};

export default function ChatPage() {
  const [activeAgents, setActiveAgents] = useState<Agent[]>([AVAILABLE_AGENTS[0]]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>(AVAILABLE_AGENTS[0].id);
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});

  const addAgent = (agent: Agent) => {
    if (!activeAgents.find(a => a.id === agent.id)) {
      setActiveAgents([...activeAgents, agent]);
    }
  };

  const removeAgent = (agentId: string) => {
    setActiveAgents(activeAgents.filter(a => a.id !== agentId));
    if (selectedAgent === agentId && activeAgents.length > 1) {
      setSelectedAgent(activeAgents[0].id);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    // Add user message with fixed timestamp format
    const now = new Date();
    const userMessage: Message = {
      id: now.getTime().toString(),
      agentId: "user",
      content: input,
      timestamp: now,
    };
    
    setMessages([...messages, userMessage]);

    // Simulate agent responses
    setTimeout(() => {
      activeAgents.forEach((agent, index) => {
        setTimeout(() => {
          const responseTime = new Date();
          const agentMessage: Message = {
            id: `${responseTime.getTime()}-${agent.id}`,
            agentId: agent.id,
            content: `Response from ${agent.name}: ${input}`,
            timestamp: responseTime,
          };
          setMessages(prev => [...prev, agentMessage]);
        }, index * 800);
      });
    }, 600);

    setInput("");
  };

  const togglePanel = (agentId: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Sidebar - Agent Selection */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 border-r bg-card p-6 flex flex-col"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <Bot className="h-6 w-6 mr-2 text-primary" />
            AI Agents
          </h2>
          <p className="text-sm text-muted-foreground">
            Select agents to chat with
          </p>
        </div>

        <div className="space-y-2 flex-1">
          {AVAILABLE_AGENTS.map(agent => {
            const isActive = activeAgents.find(a => a.id === agent.id);
            return (
              <motion.button
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !isActive && addAgent(agent)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.category}</div>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-green-500"
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Optimization Tracker */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-sm">Optimization Active</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Agents improving in background
          </p>
          <div className="mt-2 space-y-1">
            {activeAgents.map(agent => (
              <div key={agent.id} className="flex items-center justify-between text-xs">
                <span>{agent.avatar} {agent.name}</span>
                <span className="text-green-600">+2.3%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Multi-Agent Chat</h1>
              <p className="text-sm text-muted-foreground">
                {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} active
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center space-x-2"
            >
              <GitBranch className="h-4 w-4" />
              <span className="text-sm">View Branches</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Performance</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Active Agent Tabs */}
        <div className="border-b bg-card/30 px-4 py-2 flex items-center space-x-2 overflow-x-auto">
          <LayoutGroup>
            {activeAgents.map((agent, index) => (
              <motion.button
                key={agent.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedAgent(agent.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center space-x-2 relative ${
                  selectedAgent === agent.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-primary/50"
                }`}
              >
                <span>{agent.avatar}</span>
                <span className="font-medium">{agent.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAgent(agent.id);
                  }}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
                {selectedAgent === agent.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/5 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </LayoutGroup>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-6xl mb-4"
                >
                  💬
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Ask a question and watch multiple AI agents collaborate to give you the best answer
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message, index) => {
                  const agent = message.agentId === "user" 
                    ? { name: "You", color: "#6B7280", avatar: "👤" }
                    : activeAgents.find(a => a.id === message.agentId) || AVAILABLE_AGENTS[0];

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.agentId === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[80%] ${
                        message.agentId === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          {agent.avatar}
                        </motion.div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {agent.name} • {formatTime(message.timestamp)}
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-lg ${
                              message.agentId === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border"
                            }`}
                          >
                            {message.content}
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Input Area */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t bg-card/50 backdrop-blur-sm p-4"
        >
          <div className="max-w-4xl mx-auto flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask your question to all active agents..."
                className="w-full px-4 py-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} will respond
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-5 w-5" />
              <span>Send</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

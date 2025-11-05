"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ConversationTree } from "@/components/chat/ConversationTree";
import { OptimizationPanel } from "@/components/chat/OptimizationPanel";
import { GitBranch, Zap, MessageSquare } from "lucide-react";

// Mock data for demonstration - using fixed timestamps to avoid hydration mismatch
const MOCK_CONVERSATION = [
  {
    id: "1",
    type: "user" as const,
    content: "What's the best approach to optimize a React application?",
    timestamp: new Date("2025-10-28T17:00:00"),
    branches: [
      {
        id: "2a",
        type: "agent" as const,
        content: "Focus on code splitting and lazy loading to reduce initial bundle size.",
        agentName: "Code Expert",
        timestamp: new Date("2025-10-28T17:00:10"),
        branches: [
          {
            id: "3a",
            type: "user" as const,
            content: "How do I implement code splitting in Next.js?",
            timestamp: new Date("2025-10-28T17:00:20"),
            branches: [
              {
                id: "4a",
                type: "agent" as const,
                content: "Use dynamic imports with next/dynamic for component-level code splitting.",
                agentName: "Code Expert",
                timestamp: new Date("2025-10-28T17:00:30"),
              }
            ]
          }
        ]
      },
      {
        id: "2b",
        type: "agent" as const,
        content: "Implement React.memo and useMemo to prevent unnecessary re-renders.",
        agentName: "Academic Scholar",
        timestamp: new Date("2025-10-28T17:00:15"),
        branches: [
          {
            id: "3b",
            type: "user" as const,
            content: "What's the difference between memo and useMemo?",
            timestamp: new Date("2025-10-28T17:00:25"),
          }
        ]
      },
      {
        id: "2c",
        type: "agent" as const,
        content: "Use performance profiling tools to identify bottlenecks before optimizing.",
        agentName: "Data Analyst",
        timestamp: new Date("2025-10-28T17:00:12"),
      }
    ]
  }
];

const MOCK_OPTIMIZATIONS = [
  {
    agentId: "1",
    agentName: "Code Expert",
    avatar: "💻",
    currentScore: 0.87,
    improvement: 12.3,
    generation: 8,
    history: [
      { gen: 1, score: 0.65 },
      { gen: 2, score: 0.71 },
      { gen: 3, score: 0.74 },
      { gen: 4, score: 0.78 },
      { gen: 5, score: 0.81 },
      { gen: 6, score: 0.83 },
      { gen: 7, score: 0.85 },
      { gen: 8, score: 0.87 },
    ],
    status: "optimizing" as const,
  },
  {
    agentId: "2",
    agentName: "Academic Scholar",
    avatar: "📚",
    currentScore: 0.92,
    improvement: 15.8,
    generation: 10,
    history: [
      { gen: 1, score: 0.72 },
      { gen: 2, score: 0.76 },
      { gen: 3, score: 0.80 },
      { gen: 4, score: 0.83 },
      { gen: 5, score: 0.85 },
      { gen: 6, score: 0.87 },
      { gen: 7, score: 0.89 },
      { gen: 8, score: 0.90 },
      { gen: 9, score: 0.91 },
      { gen: 10, score: 0.92 },
    ],
    status: "complete" as const,
  },
  {
    agentId: "3",
    agentName: "Data Analyst",
    avatar: "📊",
    currentScore: 0.83,
    improvement: 9.2,
    generation: 6,
    history: [
      { gen: 1, score: 0.70 },
      { gen: 2, score: 0.74 },
      { gen: 3, score: 0.77 },
      { gen: 4, score: 0.79 },
      { gen: 5, score: 0.81 },
      { gen: 6, score: 0.83 },
    ],
    status: "optimizing" as const,
  },
];

export default function ChatDemoPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [optimizations, setOptimizations] = useState(MOCK_OPTIMIZATIONS);

  // Simulate real-time optimization updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOptimizations(prev => prev.map(agent => {
        if (agent.status !== "optimizing") return agent;
        
        const newScore = Math.min(agent.currentScore + Math.random() * 0.01, 1.0);
        const newGen = agent.generation + 1;
        
        return {
          ...agent,
          currentScore: newScore,
          generation: newGen,
          improvement: ((newScore / agent.history[0].score - 1) * 100),
          history: [
            ...agent.history,
            { gen: newGen, score: newScore }
          ].slice(-10), // Keep last 10 generations
          status: newGen >= 15 ? "complete" as const : "optimizing" as const,
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b bg-card/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <MessageSquare className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Advanced Multi-Agent Chat
              </h1>
              <p className="text-muted-foreground">
                Visualize conversations and track optimization in real-time
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Tree - 2 columns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <ConversationTree
              nodes={MOCK_CONVERSATION}
              onNodeClick={(nodeId) => setSelectedNode(nodeId)}
            />
          </motion.div>

          {/* Optimization Panel - 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <OptimizationPanel agents={optimizations} />
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <GitBranch className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Branching Conversations</h3>
            <p className="text-sm text-muted-foreground">
              Explore different conversation paths with multiple agents. Each branch represents an alternative approach.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <Zap className="h-10 w-10 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Live Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Watch agents improve in real-time. Performance gains are tracked and visualized automatically.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Intuitive Interface</h3>
            <p className="text-sm text-muted-foreground">
              Smooth animations and clear visual hierarchy make complex multi-agent interactions easy to understand.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

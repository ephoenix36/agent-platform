"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, Activity, Award, Clock, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type AgentOptimization = {
  agentId: string;
  agentName: string;
  avatar: string;
  currentScore: number;
  improvement: number;
  generation: number;
  history: { gen: number; score: number }[];
  status: "optimizing" | "complete" | "idle";
};

interface OptimizationPanelProps {
  agents: AgentOptimization[];
}

export function OptimizationPanel({ agents }: OptimizationPanelProps) {
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="h-5 w-5 text-purple-600" />
          </motion.div>
          <h3 className="font-semibold">Live Optimization</h3>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-auto px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-medium flex items-center space-x-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
            <span>Active</span>
          </motion.div>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.agentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              {/* Agent Header */}
              <div className="flex items-center space-x-3 mb-3">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl"
                >
                  {agent.avatar}
                </motion.div>
                <div className="flex-1">
                  <div className="font-medium">{agent.agentName}</div>
                  <div className="text-xs text-muted-foreground">
                    Generation {agent.generation}
                  </div>
                </div>
                <motion.div
                  animate={{ 
                    scale: agent.status === "optimizing" ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {agent.status === "optimizing" && (
                    <Activity className="h-4 w-4 text-purple-600" />
                  )}
                  {agent.status === "complete" && (
                    <Award className="h-4 w-4 text-green-600" />
                  )}
                  {agent.status === "idle" && (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </motion.div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Score</div>
                  <div className="text-lg font-bold">{agent.currentScore.toFixed(2)}</div>
                </div>
                <div className="p-2 rounded bg-green-500/10">
                  <div className="text-xs text-muted-foreground mb-1">Improvement</div>
                  <div className="text-lg font-bold text-green-600">
                    +{agent.improvement.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={agent.history}>
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Evolution Progress</span>
                  <span className="font-medium">{Math.min(agent.generation * 10, 100)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(agent.generation * 10, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Active</div>
            <div className="text-lg font-bold text-purple-600">
              {agents.filter(a => a.status === "optimizing").length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Complete</div>
            <div className="text-lg font-bold text-green-600">
              {agents.filter(a => a.status === "complete").length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Avg Gain</div>
            <div className="text-lg font-bold text-blue-600">
              +{(agents.reduce((sum, a) => sum + a.improvement, 0) / agents.length).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

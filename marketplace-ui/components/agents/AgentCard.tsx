"use client";

import { motion } from "framer-motion";
import { Star, Clock, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPercentage, getCategoryColor } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  creator: string;
  category: string;
  performance_score: number;
  tasks_completed: number;
  success_rate: number;
  avg_response_time: number;
  user_rating: number;
  price_per_execution: number;
  total_earnings: number;
  model: string;
  generation: number;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const categoryColor = getCategoryColor(agent.category);
  const isHighPerformer = agent.performance_score >= 85;
  
  return (
    <Link href={`/agents/${agent.id}`} className="block group">
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        transition={{ duration: 0.2 }}
        className="stat-card h-full space-y-4 relative overflow-hidden"
      >
        {/* High Performer Badge */}
        {isHighPerformer && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="absolute top-2 right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-1.5 rounded-full shadow-lg"
            title="High Performer"
          >
            <Sparkles className="h-4 w-4" />
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between pr-8">
          <div className="flex-1">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">by {agent.creator}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full bg-${categoryColor}-100 text-${categoryColor}-800 text-xs font-medium dark:bg-${categoryColor}-900/30 dark:text-${categoryColor}-400`}>
            {agent.category}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {agent.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Performance
            </div>
            <div className="text-lg font-semibold text-primary">
              {agent.performance_score.toFixed(1)}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1" />
              Rating
            </div>
            <div className="text-lg font-semibold">
              {agent.user_rating.toFixed(1)}
              <span className="text-sm text-muted-foreground">/5.0</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Avg Time
            </div>
            <div className="text-sm font-medium">
              {agent.avg_response_time.toFixed(1)}s
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 mr-1" />
              Price
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(agent.price_per_execution)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <div>
            {agent.tasks_completed} tasks •{" "}
            {formatPercentage(agent.success_rate)} success
          </div>
          <div className="flex items-center space-x-1">
            <span>Gen {agent.generation}</span>
            <span>•</span>
            <span>{agent.model}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

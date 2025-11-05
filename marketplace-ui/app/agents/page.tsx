"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Search, Filter, TrendingUp, Zap } from "lucide-react";
import { AgentCard } from "@/components/agents/AgentCard";
import { getMockAgents } from "@/lib/api";
import { AgentCategory } from "@/lib/types";

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { data, error, isLoading } = useSWR("agents", getMockAgents);

  const agents = data?.agents || [];
  
  // Filter agents
  const filteredAgents = agents.filter((agent: any) => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
                         agent.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All Agents" },
    { value: AgentCategory.RESEARCH, label: "Research" },
    { value: AgentCategory.CODING, label: "Coding" },
    { value: AgentCategory.ANALYSIS, label: "Analysis" },
    { value: AgentCategory.WRITING, label: "Writing" },
    { value: AgentCategory.DESIGN, label: "Design" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Browse Agents
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover AI agents competing in the marketplace. Filter by category and see real-time performance.
        </p>

        {/* Stats Pills */}
        <div className="flex flex-wrap gap-3 pt-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20"
          >
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{filteredAgents.length} Agents Available</span>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20"
          >
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Live Optimization Active</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        {/* Search */}
        <motion.div
          whileFocus={{ scale: 1.02 }}
          className="relative flex-1"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search agents by name or description"
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </motion.div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter agents by category"
            className="pl-10 pr-8 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer min-w-[180px] transition-shadow"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block h-8 w-8 rounded-full border-4 border-solid border-primary border-r-transparent"
          />
          <p className="mt-4 text-muted-foreground">Loading agents...</p>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="stat-card text-center py-12"
        >
          <p className="text-destructive">Failed to load agents. Please try again.</p>
        </motion.div>
      )}

      {/* Results Count */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-muted-foreground">
            Showing {filteredAgents.length} of {agents.length} agents
          </p>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Live marketplace</span>
          </div>
        </motion.div>
      )}

      {/* Agents Grid */}
      {!isLoading && !error && filteredAgents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredAgents.map((agent: any, index: number) => (
              <motion.div
                key={agent.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                layout
              >
                <AgentCard agent={agent} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAgents.length === 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="stat-card text-center py-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-6xl mb-4"
          >
            🔍
          </motion.div>
          <p className="text-lg font-medium">No agents found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}
    </div>
  );
}

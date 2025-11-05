"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Trophy, Medal, Award, TrendingUp, DollarSign, Crown, Star } from "lucide-react";
import { getMockLeaderboard } from "@/lib/api";
import Link from "next/link";

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { data, error, isLoading } = useSWR("leaderboard", getMockLeaderboard);

  const leaderboard = data?.leaderboard || [];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "research", label: "Research" },
    { value: "coding", label: "Coding" },
    { value: "analysis", label: "Analysis" },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return (
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Crown className="h-7 w-7 text-yellow-500" />
      </motion.div>
    );
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-4 mb-8"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Trophy className="h-10 w-10 text-yellow-500" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Leaderboard
          </h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Top performing agents ranked by performance score, success rate, and earnings
        </p>
      </motion.div>

      {/* Category Filter */}
      <div className="mb-8">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
        </div>
      )}

      {/* Leaderboard Table */}
      {!isLoading && !error && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="stat-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold">Rank</th>
                  <th className="text-left py-4 px-4 font-semibold">Agent</th>
                  <th className="text-left py-4 px-4 font-semibold hidden sm:table-cell">Category</th>
                  <th className="text-right py-4 px-4 font-semibold">
                    <div className="flex items-center justify-end space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Performance</span>
                    </div>
                  </th>
                  <th className="text-right py-4 px-4 font-semibold hidden md:table-cell">Tasks</th>
                  <th className="text-right py-4 px-4 font-semibold hidden lg:table-cell">Success Rate</th>
                  <th className="text-right py-4 px-4 font-semibold">
                    <div className="flex items-center justify-end space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Earnings</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry: any, index: number) => (
                  <motion.tr
                    key={entry.rank}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
                    whileHover={{ 
                      scale: 1.01,
                      backgroundColor: "hsl(var(--muted) / 0.5)",
                      transition: { duration: 0.2 }
                    }}
                    className={`border-b last:border-0 cursor-pointer ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-transparent to-primary/5' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center w-10">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/agents/${entry.rank}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {entry.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className="badge-primary">{entry.category}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-primary">
                        {entry.performance_score}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell">
                      {entry.tasks_completed}
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      <span className="badge-success">{entry.success_rate}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                      {entry.total_earnings}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="stat-card text-center">
          <div className="text-3xl font-bold text-primary">42</div>
          <div className="text-sm text-muted-foreground mt-1">Active Agents</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-3xl font-bold text-green-600">$164.19</div>
          <div className="text-sm text-muted-foreground mt-1">Total Paid to Creators</div>
        </div>
        <div className="stat-card text-center">
          <div className="text-3xl font-bold text-blue-600">1,523</div>
          <div className="text-sm text-muted-foreground mt-1">Tasks Completed</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Prompt Evolution Visualizer
 * 
 * Expert: React Developer (web-development/frontend)
 * 
 * Features:
 * - Generation evolution chart (fitness over time)
 * - Mutation type breakdown (pie chart)
 * - Best prompts showcase
 * - Evolution family tree
 * - Real-time updates
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  GitBranch,
  Zap,
  Award,
  RefreshCw,
  Download,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';

// Types
interface PromptVariant {
  id: string;
  text: string;
  generation: number;
  score: number;
  mutation_type: string | null;
  parent_ids: string[];
}

interface GenerationData {
  generation: number;
  best_score: number;
  avg_score: number;
  diversity: number;
}

interface EvolutionHistory {
  run_id: string;
  base_prompt: string;
  target_task: string;
  num_generations: number;
  generations: GenerationData[];
  best_overall: PromptVariant;
  improvement: number;
  duration_seconds: number;
}

interface MutationStats {
  mutation_type: string;
  count: number;
  avg_improvement: number;
}

// Color scheme - matching our gradient theme
const COLORS = {
  primary: '#3b82f6',      // blue-600
  secondary: '#8b5cf6',    // purple-600
  success: '#10b981',      // green-500
  warning: '#f59e0b',      // amber-500
  danger: '#ef4444',       // red-500
  gradient: 'url(#blueToPurple)'
};

const MUTATION_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444'  // red
];

// Custom Tooltip for Charts
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
      <p className="font-semibold text-gray-900 mb-2">Generation {label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Fitness Evolution Chart
const FitnessChart: React.FC<{ data: GenerationData[] }> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        Fitness Evolution
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="blueToPurple" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="bestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="generation"
            stroke="#6b7280"
            label={{ value: 'Generation', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            stroke="#6b7280"
            label={{ value: 'Fitness Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="best_score"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#bestGradient)"
            name="Best Score"
          />
          <Area
            type="monotone"
            dataKey="avg_score"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#avgGradient)"
            name="Avg Score"
          />
          <Line
            type="monotone"
            dataKey="diversity"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            name="Diversity"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard
          label="Initial Score"
          value={data[0]?.best_score.toFixed(3) || '0.000'}
          color="text-gray-600"
        />
        <StatCard
          label="Final Score"
          value={data[data.length - 1]?.best_score.toFixed(3) || '0.000'}
          color="text-blue-600"
        />
        <StatCard
          label="Improvement"
          value={`+${((data[data.length - 1]?.best_score - data[0]?.best_score) * 100).toFixed(1)}%`}
          color="text-green-600"
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color
}) => (
  <div className="text-center">
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

// Mutation Type Breakdown
const MutationBreakdown: React.FC<{ mutations: MutationStats[] }> = ({ mutations }) => {
  const total = mutations.reduce((sum, m) => sum + m.count, 0);

  const pieData = mutations.map((m, i) => ({
    name: m.mutation_type,
    value: m.count,
    percentage: ((m.count / total) * 100).toFixed(1),
    color: MUTATION_COLORS[i % MUTATION_COLORS.length]
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-purple-600" />
        Mutation Breakdown
      </h3>

      <div className="flex items-center gap-8">
        <div className="flex-shrink-0">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ percentage }) => `${percentage}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {pieData.map((entry, index) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-gray-900 capitalize">
                  {entry.name.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{entry.value} variants</span>
                <span className="font-bold text-gray-900">{entry.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Best Prompts Showcase
const BestPromptsShowcase: React.FC<{ prompts: PromptVariant[] }> = ({ prompts }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPrompt = prompts[selectedIndex];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Award className="h-6 w-6 text-yellow-500" />
        Top Prompts
      </h3>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {prompts.slice(0, 4).map((prompt, index) => (
          <button
            key={prompt.id}
            onClick={() => setSelectedIndex(index)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedIndex === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 mb-1">
              #{index + 1}
            </div>
            <div className="text-sm text-gray-500">Gen {prompt.generation}</div>
            <div className="text-lg font-bold text-blue-600 mt-2">
              {prompt.score.toFixed(3)}
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedPrompt && (
          <motion.div
            key={selectedPrompt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <h4 className="font-bold text-gray-900">Rank #{selectedIndex + 1}</h4>
                  <p className="text-sm text-gray-600">
                    Generation {selectedPrompt.generation} • Score: {selectedPrompt.score.toFixed(3)}
                  </p>
                </div>
              </div>
              {selectedPrompt.mutation_type && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium capitalize">
                  {selectedPrompt.mutation_type.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 font-mono text-sm text-gray-800 whitespace-pre-wrap">
              {selectedPrompt.text}
            </div>

            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Copy to Clipboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Evolution Controls
const EvolutionControls: React.FC<{
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
}> = ({ isRunning, onStart, onPause, onStep, onReset }) => {
  return (
    <div className="flex items-center gap-3">
      {!isRunning ? (
        <button
          onClick={onStart}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 font-semibold"
        >
          <Play className="h-4 w-4" />
          Start Evolution
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 font-semibold"
        >
          <Pause className="h-4 w-4" />
          Pause
        </button>
      )}

      <button
        onClick={onStep}
        disabled={isRunning}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <SkipForward className="h-4 w-4" />
        Step
      </button>

      <button
        onClick={onReset}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Reset
      </button>
    </div>
  );
};

// Main Component
export const PromptEvolutionVisualizer: React.FC = () => {
  const [history, setHistory] = useState<EvolutionHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  // Computed mutation stats
  const mutationStats = useMemo(() => {
    if (!history?.best_overall) return [];

    const stats = new Map<string, { count: number; total_improvement: number }>();

    // Mock data - in production, would come from API
    const mutations = [
      { mutation_type: 'rephrase', count: 15, avg_improvement: 0.12 },
      { mutation_type: 'expand', count: 12, avg_improvement: 0.18 },
      { mutation_type: 'simplify', count: 8, avg_improvement: 0.09 },
      { mutation_type: 'tone_shift', count: 10, avg_improvement: 0.15 },
      { mutation_type: 'stochastic', count: 7, avg_improvement: 0.22 },
      { mutation_type: 'crossover', count: 18, avg_improvement: 0.25 }
    ];

    return mutations;
  }, [history]);

  // Load evolution history
  const loadHistory = async (runId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/optimization/prompts/history/${runId}`);
      const data = await response.json();
      setHistory(data);
      setCurrentGeneration(data.num_generations);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Demo: Start new evolution
  const startEvolution = async () => {
    setIsRunning(true);
    setCurrentGeneration(0);

    // In production, this would start actual evolution
    // For demo, we'll simulate with mock data
    const mockHistory: EvolutionHistory = {
      run_id: `run_${Date.now()}`,
      base_prompt: 'You are a helpful AI assistant.',
      target_task: 'Customer Support',
      num_generations: 10,
      generations: Array.from({ length: 10 }, (_, i) => ({
        generation: i + 1,
        best_score: 0.45 + (i * 0.05) + Math.random() * 0.02,
        avg_score: 0.40 + (i * 0.04) + Math.random() * 0.015,
        diversity: 0.5 + Math.random() * 0.3
      })),
      best_overall: {
        id: 'best_1',
        text: 'You are an expert customer support specialist. When helping users, always:\n1. Acknowledge their concern immediately\n2. Provide clear step-by-step solutions\n3. Offer alternative approaches\n4. Follow up with additional resources\n\nBe empathetic, professional, and solution-focused.',
        generation: 10,
        score: 0.892,
        mutation_type: 'crossover',
        parent_ids: []
      },
      improvement: 0.442,
      duration_seconds: 180
    };

    setHistory(mockHistory);
  };

  const topPrompts = useMemo(() => {
    if (!history) return [];

    // Mock top prompts
    return [
      {
        id: '1',
        text: history.best_overall.text,
        generation: history.best_overall.generation,
        score: history.best_overall.score,
        mutation_type: history.best_overall.mutation_type,
        parent_ids: []
      },
      {
        id: '2',
        text: 'You are a customer support expert. Provide helpful, clear, and actionable responses.',
        generation: 9,
        score: 0.875,
        mutation_type: 'expand',
        parent_ids: []
      },
      {
        id: '3',
        text: 'You are an AI support assistant focused on solving customer issues efficiently.',
        generation: 8,
        score: 0.851,
        mutation_type: 'rephrase',
        parent_ids: []
      },
      {
        id: '4',
        text: 'Professional customer support AI. Clear solutions, empathetic tone.',
        generation: 7,
        score: 0.832,
        mutation_type: 'simplify',
        parent_ids: []
      }
    ];
  }, [history]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <GitBranch className="h-10 w-10 text-blue-600" />
            Prompt Evolution Visualizer
          </h1>
          <p className="text-gray-600">
            Watch prompts evolve and improve through genetic algorithms
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Evolution Control</h2>
              <p className="text-sm text-gray-600">
                {history ? `Run: ${history.run_id}` : 'No evolution running'}
              </p>
            </div>

            <EvolutionControls
              isRunning={isRunning}
              onStart={startEvolution}
              onPause={() => setIsRunning(false)}
              onStep={() => {}}
              onReset={() => {
                setHistory(null);
                setIsRunning(false);
                setCurrentGeneration(0);
              }}
            />
          </div>

          {history && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Generations</div>
                <div className="text-2xl font-bold text-blue-900">{history.num_generations}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">Improvement</div>
                <div className="text-2xl font-bold text-green-900">
                  +{(history.improvement * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">Duration</div>
                <div className="text-2xl font-bold text-purple-900">
                  {Math.floor(history.duration_seconds / 60)}m {history.duration_seconds % 60}s
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium mb-1">Best Score</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {history.best_overall.score.toFixed(3)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visualizations */}
        {history && (
          <div className="space-y-8">
            {/* Fitness Chart */}
            <FitnessChart data={history.generations} />

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mutation Breakdown */}
              <MutationBreakdown mutations={mutationStats} />

              {/* Best Prompts */}
              <div className="lg:col-span-1">
                <BestPromptsShowcase prompts={topPrompts} />
              </div>
            </div>
          </div>
        )}

        {!history && !loading && (
          <div className="text-center py-20">
            <GitBranch className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Start Your First Evolution
            </h3>
            <p className="text-gray-600 mb-6">
              Click "Start Evolution" to begin optimizing your prompts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptEvolutionVisualizer;

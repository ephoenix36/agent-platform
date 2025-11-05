/**
 * Island Evolution Monitor with 3D MAP-Elites Visualization
 * 
 * Expert: React Developer + Data Scientist + Architect
 * 
 * Features:
 * - Live island status grid
 * - 3D MAP-Elites visualization (Three.js)
 * - Migration flow animation
 * - Diversity metrics gauges
 * - QD score evolution chart
 * - Real-time updates
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Map,
  GitBranch,
  Activity,
  TrendingUp,
  Zap,
  Repeat,
  Grid3x3,
  Eye
} from 'lucide-react';

// Types
interface IslandState {
  island_id: number;
  generation: number;
  best_fitness: number;
  avg_fitness: number;
  diversity: number;
  population_size: number;
  status: 'evolving' | 'migrating' | 'idle';
}

interface MAPElitesCell {
  coordinates: [number, number, number];
  fitness: number;
  occupied: boolean;
  prompt_preview?: string;
}

interface EvolutionStats {
  generation: number;
  global_best_fitness: number;
  avg_fitness: number;
  map_elites_coverage: number;
  qd_score: number;
  avg_diversity: number;
  entropy: number;
}

interface IslandEvolutionData {
  islands: IslandState[];
  stats: EvolutionStats[];
  map_elites_grid: MAPElitesCell[];
  current_generation: number;
  is_running: boolean;
}

// Color utilities
const getHeatmapColor = (fitness: number): string => {
  if (fitness >= 0.8) return '#10b981'; // green
  if (fitness >= 0.6) return '#3b82f6'; // blue
  if (fitness >= 0.4) return '#f59e0b'; // amber
  if (fitness >= 0.2) return '#ef4444'; // red
  return '#6b7280'; // gray
};

// Island Status Card
const IslandCard: React.FC<{ island: IslandState; index: number }> = ({ island, index }) => {
  const statusColors = {
    evolving: 'bg-blue-100 text-blue-800 border-blue-300',
    migrating: 'bg-purple-100 text-purple-800 border-purple-300',
    idle: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const statusIcons = {
    evolving: <Activity className="h-4 w-4 animate-pulse" />,
    migrating: <Repeat className="h-4 w-4 animate-spin" />,
    idle: <Map className="h-4 w-4" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">Island {island.island_id}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusColors[island.status]}`}>
          {statusIcons[island.status]}
          {island.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Generation</span>
          <span className="font-semibold text-gray-900">{island.generation}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Best Fitness</span>
          <span className="font-semibold text-blue-600">{island.best_fitness.toFixed(3)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Avg Fitness</span>
          <span className="font-semibold text-gray-900">{island.avg_fitness.toFixed(3)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Diversity</span>
          <span className="font-semibold text-green-600">{island.diversity.toFixed(3)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Population</span>
          <span className="font-semibold text-gray-900">{island.population_size}</span>
        </div>
      </div>

      {/* Fitness bar */}
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${island.best_fitness * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

// MAP-Elites 3D Grid Visualization (Simplified 2D view)
const MAPElitesGrid3D: React.FC<{ cells: MAPElitesCell[]; gridSize: number }> = ({
  cells,
  gridSize = 10
}) => {
  const [selectedCell, setSelectedCell] = useState<MAPElitesCell | null>(null);
  const [viewAngle, setViewAngle] = useState(45);

  // Create grid layers (z-axis slices)
  const layers = useMemo(() => {
    const layerMap: Record<number, MAPElitesCell[]> = {};
    
    cells.forEach(cell => {
      const z = cell.coordinates[2];
      if (!layerMap[z]) layerMap[z] = [];
      layerMap[z].push(cell);
    });

    return Object.entries(layerMap).map(([z, cells]) => ({
      z: parseInt(z),
      cells
    })).sort((a, b) => a.z - b.z);
  }, [cells]);

  const [selectedLayer, setSelectedLayer] = useState(layers.length > 0 ? layers[0].z : 0);

  const currentLayer = layers.find(l => l.z === selectedLayer);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Grid3x3 className="h-6 w-6 text-purple-600" />
          MAP-Elites Grid (3D)
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Layer (Formality):</span>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              {layers.map(layer => (
                <option key={layer.z} value={layer.z}>
                  {layer.z} / {gridSize - 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="90"
              value={viewAngle}
              onChange={(e) => setViewAngle(parseInt(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* Grid View */}
      <div className="mb-4">
        <div className="grid gap-1" style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            
            const cell = currentLayer?.cells.find(
              c => c.coordinates[0] === x && c.coordinates[1] === y
            );

            return (
              <motion.div
                key={`${x}-${y}`}
                className="aspect-square rounded cursor-pointer relative group"
                style={{
                  backgroundColor: cell ? getHeatmapColor(cell.fitness) : '#f3f4f6',
                  border: '1px solid #e5e7eb'
                }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                onClick={() => cell && setSelectedCell(cell)}
              >
                {cell && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {cell.fitness.toFixed(2)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Axis Labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>← Response Length →</span>
        </div>
        <div className="text-center mt-1 text-xs text-gray-500">
          ↑ Technical Depth ↓
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <span className="text-gray-600">Empty</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-gray-600">0.2-0.4</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-amber-500 rounded" />
          <span className="text-gray-600">0.4-0.6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-gray-600">0.6-0.8</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-gray-600">0.8-1.0</span>
        </div>
      </div>

      {/* Selected Cell Details */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200"
          >
            <h4 className="font-bold text-gray-900 mb-2">
              Cell [{selectedCell.coordinates.join(', ')}]
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Fitness:</strong> {selectedCell.fitness.toFixed(3)}
            </p>
            {selectedCell.prompt_preview && (
              <p className="text-sm text-gray-600 font-mono">
                {selectedCell.prompt_preview}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// QD Score Evolution Chart
const QDScoreChart: React.FC<{ stats: EvolutionStats[] }> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        Quality-Diversity Evolution
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={stats}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="generation"
            stroke="#6b7280"
            label={{ value: 'Generation', position: 'insideBottom', offset: -5 }}
          />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="qd_score"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 4 }}
            name="QD Score"
          />
          <Line
            type="monotone"
            dataKey="map_elites_coverage"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 3 }}
            name="Coverage"
          />
          <Line
            type="monotone"
            dataKey="global_best_fitness"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            name="Best Fitness"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Diversity Metrics Radar
const DiversityRadar: React.FC<{ currentStats: EvolutionStats }> = ({ currentStats }) => {
  const radarData = [
    {
      metric: 'Coverage',
      value: currentStats.map_elites_coverage * 100,
      fullMark: 100
    },
    {
      metric: 'Diversity',
      value: currentStats.avg_diversity * 100,
      fullMark: 100
    },
    {
      metric: 'Entropy',
      value: currentStats.entropy * 50, // Scale to 0-100
      fullMark: 100
    },
    {
      metric: 'QD Score',
      value: currentStats.qd_score * 100,
      fullMark: 100
    },
    {
      metric: 'Best Fitness',
      value: currentStats.global_best_fitness * 100,
      fullMark: 100
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-yellow-500" />
        Diversity Metrics
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="metric" stroke="#6b7280" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
          <Radar
            name="Current"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-gray-600 mb-1">Coverage</div>
          <div className="text-xl font-bold text-blue-600">
            {(currentStats.map_elites_coverage * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-gray-600 mb-1">QD Score</div>
          <div className="text-xl font-bold text-purple-600">
            {currentStats.qd_score.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Migration Flow Visualization
const MigrationFlow: React.FC<{ islands: IslandState[] }> = ({ islands }) => {
  const migrating = islands.some(i => i.status === 'migrating');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <GitBranch className="h-6 w-6 text-purple-600" />
        Migration Topology
      </h3>

      <div className="relative" style={{ height: '200px' }}>
        {/* Ring topology visualization */}
        <svg width="100%" height="100%" viewBox="0 0 400 200">
          {/* Draw islands in a circle */}
          {islands.map((island, i) => {
            const angle = (i / islands.length) * 2 * Math.PI - Math.PI / 2;
            const cx = 200 + Math.cos(angle) * 80;
            const cy = 100 + Math.sin(angle) * 60;

            // Next island for migration arrow
            const nextI = (i + 1) % islands.length;
            const nextAngle = (nextI / islands.length) * 2 * Math.PI - Math.PI / 2;
            const nextCx = 200 + Math.cos(nextAngle) * 80;
            const nextCy = 100 + Math.sin(nextAngle) * 60;

            return (
              <g key={island.island_id}>
                {/* Migration arrow */}
                <motion.path
                  d={`M ${cx} ${cy} Q ${(cx + nextCx) / 2} ${(cy + nextCy) / 2 - 20} ${nextCx} ${nextCy}`}
                  fill="none"
                  stroke={migrating ? '#8b5cf6' : '#e5e7eb'}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                  animate={{
                    strokeDashoffset: migrating ? [0, -10] : 0
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />

                {/* Island circle */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r="20"
                  fill={island.status === 'migrating' ? '#8b5cf6' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="2"
                  animate={{
                    scale: island.status === 'migrating' ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: island.status === 'migrating' ? Infinity : 0
                  }}
                />

                {/* Island label */}
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {island.island_id}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill={migrating ? '#8b5cf6' : '#e5e7eb'}
              />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-600">
          Ring Topology: Unidirectional Migration Every 5 Generations
        </span>
      </div>
    </div>
  );
};

// Main Component
export const IslandEvolutionMonitor: React.FC = () => {
  const [data, setData] = useState<IslandEvolutionData | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = () => {
    // Mock data
    const mockData: IslandEvolutionData = {
      current_generation: 12,
      is_running: false,
      islands: Array.from({ length: 5 }, (_, i) => ({
        island_id: i,
        generation: 12,
        best_fitness: 0.65 + i * 0.05 + Math.random() * 0.1,
        avg_fitness: 0.55 + i * 0.04 + Math.random() * 0.08,
        diversity: 0.35 + Math.random() * 0.2,
        population_size: 30,
        status: 'idle' as const
      })),
      stats: Array.from({ length: 13 }, (_, i) => ({
        generation: i,
        global_best_fitness: 0.45 + i * 0.03 + Math.random() * 0.02,
        avg_fitness: 0.40 + i * 0.025 + Math.random() * 0.015,
        map_elites_coverage: 0.12 + i * 0.045,
        qd_score: 0.05 + i * 0.045,
        avg_diversity: 0.35 + Math.random() * 0.15,
        entropy: 0.8 + Math.random() * 0.4
      })),
      map_elites_grid: []
    };

    // Generate MAP-Elites grid
    const gridSize = 10;
    for (let z = 0; z < gridSize; z++) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (Math.random() > 0.3) { // 70% occupancy
            mockData.map_elites_grid.push({
              coordinates: [x, y, z],
              fitness: Math.random() * 0.5 + 0.3,
              occupied: true,
              prompt_preview: `Variant at [${x},${y},${z}]`
            });
          }
        }
      }
    }

    setData(mockData);
  };

  const currentStats = data?.stats[data.stats.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Map className="h-10 w-10 text-blue-600" />
            Island Evolution Monitor
          </h1>
          <p className="text-gray-600">
            Quality-Diversity optimization with multi-population islands
          </p>
        </div>

        {data && (
          <>
            {/* Control Panel */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Generation {data.current_generation}
                  </h2>
                  <p className="text-gray-600">
                    {isRunning ? '🔄 Evolution in progress...' : '⏸️ Paused'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isRunning
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    {isRunning ? '⏸ Pause' : '▶ Start'}
                  </button>

                  <button
                    onClick={loadDemoData}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Island Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Island Status</h2>
              <div className="grid grid-cols-5 gap-4">
                {data.islands.map((island, i) => (
                  <IslandCard key={island.island_id} island={island} index={i} />
                ))}
              </div>
            </div>

            {/* Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* MAP-Elites */}
              <MAPElitesGrid3D cells={data.map_elites_grid} gridSize={10} />

              {/* Migration Flow */}
              <MigrationFlow islands={data.islands} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* QD Score Chart */}
              <QDScoreChart stats={data.stats} />

              {/* Diversity Radar */}
              {currentStats && <DiversityRadar currentStats={currentStats} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IslandEvolutionMonitor;

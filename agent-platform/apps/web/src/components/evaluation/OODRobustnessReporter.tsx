/**
 * OOD Robustness Reporter Dashboard
 * 
 * Expert: React Developer + Data Scientist
 * 
 * Features:
 * - Domain profile cards
 * - Degradation heatmap
 * - Feature transferability gauge
 * - Statistical significance indicators
 * - Cross-domain comparison matrix
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingDown,
  Target,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Database,
  Zap
} from 'lucide-react';

// Types
interface DomainProfile {
  domain_name: string;
  num_examples: number;
  num_clusters: number;
  feature_distribution: {
    mean: number[];
    std: number[];
  };
}

interface OODResult {
  test_domain: string;
  training_domains: string[];
  performance: {
    in_domain: number;
    ood: number;
    degradation_pct: number;
  };
  transfer_metrics: {
    feature_transferability: number;
    domain_similarity: number;
  };
  statistical: {
    significant: boolean;
    p_value: number;
  };
  metadata: {
    num_examples: number;
    confidence: number;
  };
}

interface OODReport {
  domain_profiles: Record<string, DomainProfile>;
  ood_results: OODResult[];
  summary: {
    num_domains: number;
    avg_degradation_pct: number;
    max_degradation_pct: number;
    avg_transferability: number;
    target_met: boolean;
  };
}

// Gauge Component for Transferability
const TransferabilityGauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const percentage = value * 100;
  const rotation = (value * 180) - 90; // -90 to 90 degrees

  const getColor = (val: number) => {
    if (val >= 0.7) return '#10b981'; // green
    if (val >= 0.5) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const color = getColor(value);

  return (
    <div className="relative">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
          className="transition-all duration-1000"
        />
        
        {/* Needle */}
        <g transform="translate(100, 100)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-70"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${rotation})`}
            className="transition-transform duration-1000"
          />
          <circle cx="0" cy="0" r="6" fill={color} />
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <div className="text-3xl font-bold" style={{ color }}>
          {percentage.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
      </div>
    </div>
  );
};

// Domain Profile Card
const DomainCard: React.FC<{ profile: DomainProfile }> = ({ profile }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{profile.domain_name}</h3>
        <Database className="h-5 w-5 text-blue-600" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Examples</span>
          <span className="font-semibold text-gray-900">{profile.num_examples}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Clusters</span>
          <span className="font-semibold text-gray-900">{profile.num_clusters}</span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Feature Distribution</div>
          <div className="flex gap-2">
            {profile.feature_distribution.mean.slice(0, 4).map((val, i) => (
              <div
                key={i}
                className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden"
                title={`Feature ${i + 1}: ${val.toFixed(3)}`}
              >
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${val * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Degradation Heatmap
const DegradationHeatmap: React.FC<{ results: OODResult[] }> = ({ results }) => {
  const getColor = (degradation: number) => {
    if (degradation <= 5) return 'bg-green-500';
    if (degradation <= 10) return 'bg-yellow-500';
    if (degradation <= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getIntensity = (degradation: number) => {
    const opacity = Math.min(degradation / 30, 1);
    return opacity;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-orange-600" />
        Performance Degradation Heatmap
      </h3>

      <div className="space-y-3">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="w-40 font-medium text-gray-900 truncate">
              {result.test_domain}
            </div>

            <div className="flex-1 relative h-10 bg-gray-100 rounded-lg overflow-hidden">
              {/* Background grid */}
              <div className="absolute inset-0 flex">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-200" />
                ))}
              </div>

              {/* Degradation bar */}
              <div
                className={`absolute inset-y-0 left-0 ${getColor(result.performance.degradation_pct)} transition-all duration-1000`}
                style={{
                  width: `${Math.min(result.performance.degradation_pct * 2, 100)}%`,
                  opacity: getIntensity(result.performance.degradation_pct)
                }}
              />

              {/* Value label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-gray-900 text-sm">
                  {result.performance.degradation_pct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Statistical significance */}
            <div className="w-20">
              {result.statistical.significant ? (
                <span className="flex items-center gap-1 text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Sig.
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  OK
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-gray-600">≤5% (Excellent)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-gray-600">5-10% (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-gray-600">10-20% (Fair)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-gray-600">&gt;20% (Poor)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// OOD Result Detail Card
const OODResultCard: React.FC<{ result: OODResult }> = ({ result }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-900">
          {result.test_domain}
        </h4>
        {result.performance.degradation_pct <= 5 ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Target Met
          </span>
        ) : (
          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Below Target
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">In-Domain</div>
          <div className="text-2xl font-bold text-blue-600">
            {result.performance.in_domain.toFixed(3)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">OOD Performance</div>
          <div className="text-2xl font-bold text-purple-600">
            {result.performance.ood.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Degradation</div>
          <div className="text-xl font-bold text-orange-600">
            {result.performance.degradation_pct.toFixed(1)}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Transferability</div>
          <div className="text-xl font-bold text-green-600">
            {(result.transfer_metrics.feature_transferability * 100).toFixed(1)}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Similarity</div>
          <div className="text-xl font-bold text-blue-600">
            {(result.transfer_metrics.domain_similarity * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Training Domains:</span>
          <span className="font-medium text-gray-900">
            {result.training_domains.join(', ')}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Test Examples:</span>
          <span className="font-medium text-gray-900">
            {result.metadata.num_examples}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Statistical Significance:</span>
          <span className={`font-medium ${result.statistical.significant ? 'text-orange-600' : 'text-green-600'}`}>
            {result.statistical.significant ? 'Yes' : 'No'} (p={result.statistical.p_value.toFixed(4)})
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export const OODRobustnessReporter: React.FC = () => {
  const [report, setReport] = useState<OODReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<number>(0);

  useEffect(() => {
    loadDemoReport();
  }, []);

  const loadDemoReport = async () => {
    // Mock data for demonstration
    const mockReport: OODReport = {
      domain_profiles: {
        'e-commerce': {
          domain_name: 'e-commerce',
          num_examples: 1250,
          num_clusters: 5,
          feature_distribution: {
            mean: [0.65, 0.42, 0.78, 0.33],
            std: [0.12, 0.18, 0.09, 0.21]
          }
        },
        'customer_support': {
          domain_name: 'customer_support',
          num_examples: 980,
          num_clusters: 4,
          feature_distribution: {
            mean: [0.58, 0.71, 0.45, 0.62],
            std: [0.15, 0.11, 0.19, 0.14]
          }
        },
        'healthcare': {
          domain_name: 'healthcare',
          num_examples: 750,
          num_clusters: 6,
          feature_distribution: {
            mean: [0.72, 0.55, 0.89, 0.41],
            std: [0.08, 0.16, 0.07, 0.22]
          }
        }
      },
      ood_results: [
        {
          test_domain: 'e-commerce',
          training_domains: ['customer_support', 'healthcare'],
          performance: {
            in_domain: 0.892,
            ood: 0.847,
            degradation_pct: 5.0
          },
          transfer_metrics: {
            feature_transferability: 0.756,
            domain_similarity: 0.682
          },
          statistical: {
            significant: true,
            p_value: 0.0213
          },
          metadata: {
            num_examples: 250,
            confidence: 0.91
          }
        },
        {
          test_domain: 'customer_support',
          training_domains: ['e-commerce', 'healthcare'],
          performance: {
            in_domain: 0.915,
            ood: 0.878,
            degradation_pct: 4.0
          },
          transfer_metrics: {
            feature_transferability: 0.821,
            domain_similarity: 0.745
          },
          statistical: {
            significant: false,
            p_value: 0.0876
          },
          metadata: {
            num_examples: 196,
            confidence: 0.94
          }
        },
        {
          test_domain: 'healthcare',
          training_domains: ['e-commerce', 'customer_support'],
          performance: {
            in_domain: 0.878,
            ood: 0.841,
            degradation_pct: 4.2
          },
          transfer_metrics: {
            feature_transferability: 0.752,
            domain_similarity: 0.698
          },
          statistical: {
            significant: false,
            p_value: 0.1124
          },
          metadata: {
            num_examples: 150,
            confidence: 0.89
          }
        }
      ],
      summary: {
        num_domains: 3,
        avg_degradation_pct: 4.4,
        max_degradation_pct: 5.0,
        avg_transferability: 0.776,
        target_met: true
      }
    };

    setReport(mockReport);
  };

  const runOODTest = async () => {
    setLoading(true);
    try {
      // In production, call actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadDemoReport();
    } catch (error) {
      console.error('OOD test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Target className="h-10 w-10 text-orange-600" />
            OOD Robustness Reporter
          </h1>
          <p className="text-gray-600">
            Cross-domain performance validation and statistical analysis
          </p>
        </div>

        {/* Summary Cards */}
        {report && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl shadow-lg border-2 p-6 ${
                report.summary.target_met ? 'border-green-500' : 'border-orange-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Target Status</span>
                {report.summary.target_met ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                )}
              </div>
              <div className={`text-2xl font-bold ${
                report.summary.target_met ? 'text-green-600' : 'text-orange-600'
              }`}>
                {report.summary.target_met ? 'MET' : 'NOT MET'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                &lt;5% degradation
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Avg Degradation</span>
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {report.summary.avg_degradation_pct.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Max: {report.summary.max_degradation_pct.toFixed(1)}%
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Transferability</span>
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {(report.summary.avg_transferability * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Target: &gt;70%
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Domains Tested</span>
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {report.summary.num_domains}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Cross-validated
              </div>
            </motion.div>
          </div>
        )}

        {/* Domain Profiles */}
        {report && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Domain Profiles</h2>
            <div className="grid grid-cols-3 gap-4">
              {Object.values(report.domain_profiles).map((profile, index) => (
                <DomainCard key={index} profile={profile} />
              ))}
            </div>
          </div>
        )}

        {/* Degradation Heatmap */}
        {report && (
          <div className="mb-8">
            <DegradationHeatmap results={report.ood_results} />
          </div>
        )}

        {/* Transferability Gauges & Details */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gauges */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Feature Transferability
              </h3>
              
              <div className="space-y-6">
                {report.ood_results.map((result, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 font-medium text-gray-900">
                      {result.test_domain}
                    </div>
                    <TransferabilityGauge
                      value={result.transfer_metrics.feature_transferability}
                      label="Transferability"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Result Details */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Detailed Results
              </h3>
              
              <div className="space-y-4">
                {report.ood_results.map((result, index) => (
                  <OODResultCard key={index} result={result} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={runOODTest}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg shadow-lg"
          >
            {loading ? 'Running OOD Tests...' : '🔬 Run New OOD Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OODRobustnessReporter;

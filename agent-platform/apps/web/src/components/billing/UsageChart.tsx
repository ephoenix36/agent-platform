/**
 * Usage Chart Component
 * 
 * Displays API usage analytics with charts, quota visualization, and export functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Download,
  RefreshCw,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import type { UsageData } from '@/lib/api';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

type TimeRange = '7d' | '30d' | '90d';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FEATURE_LABELS: Record<string, string> = {
  evaluation: 'Agent Evaluation',
  optimization: 'Prompt Optimization',
  memory: 'Memory Testing',
  dataset: 'Dataset Generation',
  debugging: 'Artifact Debugging',
  ood_testing: 'OOD Testing'
};

export const UsageChart: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  /**
   * Fetch usage data from API
   */
  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.getCurrentUsage();
      
      if (response.success && response.data) {
        setUsageData(response.data);
      } else {
        setError(response.error || 'Failed to load usage data');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsageData();
  };

  /**
   * Export usage data as CSV
   */
  const exportToCSV = () => {
    if (!usageData) return;

    // Create CSV header
    let csv = 'Date,API Calls\n';

    // Add daily data
    usageData.daily_breakdown.forEach(day => {
      csv += `${day.date},${day.count}\n`;
    });

    // Add feature breakdown
    csv += '\nFeature,Count\n';
    Object.entries(usageData.by_feature).forEach(([feature, count]) => {
      csv += `${FEATURE_LABELS[feature] || feature},${count}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Get quota percentage color
   */
  const getQuotaColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-green-600';
  };

  /**
   * Get quota bar color
   */
  const getQuotaBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  /**
   * Format daily data for chart
   */
  const formatDailyData = () => {
    if (!usageData?.daily_breakdown) return [];
    return usageData.daily_breakdown.map(day => ({
      date: format(new Date(day.date), 'MMM dd'),
      calls: day.count
    }));
  };

  /**
   * Format feature data for chart
   */
  const formatFeatureData = () => {
    if (!usageData?.by_feature) return [];
    return Object.entries(usageData.by_feature).map(([feature, count]) => ({
      name: FEATURE_LABELS[feature] || feature,
      value: count
    }));
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!usageData) return null;

  const dailyChartData = formatDailyData();
  const featureChartData = formatFeatureData();

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Usage Analytics</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === '7d' && '7 Days'}
                {range === '30d' && '30 Days'}
                {range === '90d' && '90 Days'}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <Button variant="outline" onClick={exportToCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quota Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Period Usage</CardTitle>
          <CardDescription>
            {format(new Date(usageData.period_start), 'MMM dd')} - {format(new Date(usageData.period_end), 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold">{usageData.total_usage.toLocaleString()}</div>
              <div className="text-sm text-gray-600">
                of {usageData.quota === 'unlimited' ? 'unlimited' : usageData.quota.toLocaleString()} API calls
              </div>
            </div>
            {usageData.quota !== 'unlimited' && (
              <div className={`text-3xl font-bold ${getQuotaColor(usageData.percentage)}`}>
                {usageData.percentage.toFixed(1)}%
              </div>
            )}
          </div>

          {/* Quota Progress Bar */}
          {usageData.quota !== 'unlimited' && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getQuotaBarColor(usageData.percentage)}`}
                  style={{ width: `${Math.min(usageData.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0%</span>
                <span className="text-amber-600">75%</span>
                <span className="text-red-600">90%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Warning Alert */}
          {usageData.quota !== 'unlimited' && usageData.percentage >= 80 && (
            <Alert className={usageData.percentage >= 90 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}>
              <AlertTriangle className={`h-4 w-4 ${usageData.percentage >= 90 ? 'text-red-600' : 'text-amber-600'}`} />
              <AlertDescription className={usageData.percentage >= 90 ? 'text-red-800' : 'text-amber-800'}>
                {usageData.percentage >= 90 ? (
                  <>You're approaching your quota limit. Upgrade your plan to avoid service interruption.</>
                ) : (
                  <>You've used {usageData.percentage.toFixed(0)}% of your quota. Consider upgrading if you need more calls.</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Daily Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trend</CardTitle>
          <CardDescription>API calls per day over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="API Calls"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Feature Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Feature</CardTitle>
            <CardDescription>Breakdown of API calls by feature type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" name="Calls" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Distribution</CardTitle>
            <CardDescription>Percentage breakdown by feature</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name?.split(' ')[0] || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {featureChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feature Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Feature</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Calls</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Percentage</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Visual</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(usageData.by_feature)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feature, count], idx) => {
                    const percentage = (count / usageData.total_usage) * 100;
                    return (
                      <tr key={feature} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="font-medium">{FEATURE_LABELS[feature] || feature}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{count.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{percentage.toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: COLORS[idx % COLORS.length]
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

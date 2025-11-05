/**
 * Customizable Home Dashboard
 * Draggable, resizable widget-based interface using react-grid-layout
 * Connected to global Zustand store for state persistence
 */

"use client";

import React, { useState, useCallback } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { usePlatformStore } from '@/store';
import {
  Activity, BarChart3, Clock, Users, Zap, TrendingUp,
  Code, MessageSquare, FolderTree, Plus, Settings, X,
  Maximize2, Minimize2
} from 'lucide-react';

interface DashboardWidgetProps {
  widget: {
    id: string;
    title: string;
    type: string;
    collapsed: boolean;
  };
  onRemove: (id: string) => void;
  onCollapse: (id: string) => void;
}

// Helper function to get icon for widget type
function getIconForType(type: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    metrics: BarChart3,
    activity: Activity,
    agents: Users,
    performance: Zap,
    chart: TrendingUp,
    iframe: Code,
    custom: Settings,
  };
  return iconMap[type] || Settings;
}

function DashboardWidget({ widget, onRemove, onCollapse }: DashboardWidgetProps) {
  const IconComponent = getIconForType(widget.type);

  return (
    <div className="h-full bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-300">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCollapse(widget.id)}
            className="p-1 hover:bg-gray-700/50 rounded transition-colors"
            title={widget.collapsed ? "Expand" : "Collapse"}
          >
            {widget.collapsed ? (
              <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
            title="Remove widget"
          >
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      {!widget.collapsed && (
        <div className="flex-1 p-4 overflow-auto">
          {renderWidgetContent(widget)}
        </div>
      )}
    </div>
  );
}

// Helper function to render widget content based on type
function renderWidgetContent(widget: any) {
  switch (widget.type) {
    case 'metrics':
      return <MetricsWidget />;
    case 'activity':
      return <ActivityWidget />;
    case 'agents':
      return <AgentsWidget />;
    case 'performance':
      return <PerformanceWidget />;
    default:
      return <div className="text-gray-400">Widget content</div>;
  }
}

// Sample widget content components
function MetricsWidget() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
        <div className="text-2xl font-bold text-purple-300">24</div>
        <div className="text-xs text-gray-400">Active Agents</div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <div className="text-2xl font-bold text-blue-300">147</div>
        <div className="text-xs text-gray-400">Tasks Completed</div>
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
        <div className="text-2xl font-bold text-green-300">98%</div>
        <div className="text-xs text-gray-400">Success Rate</div>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
        <div className="text-2xl font-bold text-orange-300">12.4s</div>
        <div className="text-xs text-gray-400">Avg Response</div>
      </div>
    </div>
  );
}

function ActivityWidget() {
  const activities = [
    { id: 1, icon: Code, text: "Agent 'Code Reviewer' completed task", time: "2m ago" },
    { id: 2, icon: MessageSquare, text: "New message in 'API Development'", time: "5m ago" },
    { id: 3, icon: Zap, text: "Workflow 'Deploy Pipeline' finished", time: "12m ago" },
    { id: 4, icon: FolderTree, text: "Project 'Mobile App' updated", time: "18m ago" },
  ];

  return (
    <div className="space-y-3">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-start gap-3 text-sm">
          {React.createElement(activity.icon, { className: "w-4 h-4 mt-0.5 text-purple-400" })}
          <div className="flex-1">
            <div className="text-gray-300">{activity.text}</div>
            <div className="text-xs text-gray-500">{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentsWidget() {
  const agents = [
    { id: 1, name: "Code Reviewer", status: "active", tasks: 3 },
    { id: 2, name: "Content Writer", status: "idle", tasks: 0 },
    { id: 3, name: "Data Analyst", status: "active", tasks: 5 },
    { id: 4, name: "UI Designer", status: "active", tasks: 2 },
  ];

  return (
    <div className="space-y-2">
      {agents.map(agent => (
        <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-300">{agent.name}</span>
          </div>
          <div className="text-xs text-gray-500">{agent.tasks} tasks</div>
        </div>
      ))}
    </div>
  );
}

function ChartWidget() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-gray-500">
        <BarChart3 className="w-16 h-16 mx-auto mb-2 opacity-50" />
        <div className="text-sm">Chart visualization coming soon</div>
      </div>
    </div>
  );
}

// Main Dashboard Component
export function CustomizableDashboard() {
  const [widgets, setWidgets] = useState<WidgetData[]>([
    {
      id: 'metrics-1',
      title: 'Key Metrics',
      type: 'metrics',
      icon: TrendingUp,
      content: <MetricsWidget />
    },
    {
      id: 'activity-1',
      title: 'Recent Activity',
      type: 'activity',
      icon: Activity,
      content: <ActivityWidget />
    },
    {
      id: 'agents-1',
      title: 'Active Agents',
      type: 'agents',
      icon: Users,
      content: <AgentsWidget />
    },
    {
      id: 'chart-1',
      title: 'Performance',
      type: 'chart',
      icon: BarChart3,
      content: <ChartWidget />
    },
  ]);

  const [layout, setLayout] = useState<Layout[]>([
    { i: 'metrics-1', x: 0, y: 0, w: 6, h: 2 },
    { i: 'activity-1', x: 6, y: 0, w: 6, h: 4 },
    { i: 'agents-1', x: 0, y: 2, w: 6, h: 4 },
    { i: 'chart-1', x: 0, y: 6, w: 12, h: 3 },
  ]);

  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayout(prev => prev.filter(l => l.i !== widgetId));
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  const handleAddWidget = (type: WidgetData['type']) => {
    const newId = `${type}-${Date.now()}`;
    const widgetTemplates: Record<WidgetData['type'], Omit<WidgetData, 'id'>> = {
      metrics: {
        title: 'Key Metrics',
        type: 'metrics',
        icon: TrendingUp,
        content: <MetricsWidget />
      },
      activity: {
        title: 'Recent Activity',
        type: 'activity',
        icon: Activity,
        content: <ActivityWidget />
      },
      agents: {
        title: 'Active Agents',
        type: 'agents',
        icon: Users,
        content: <AgentsWidget />
      },
      chart: {
        title: 'Performance Chart',
        type: 'chart',
        icon: BarChart3,
        content: <ChartWidget />
      },
      iframe: {
        title: 'Web View',
        type: 'iframe',
        icon: Code,
        content: <div className="text-gray-500">iframe widget</div>
      },
      custom: {
        title: 'Custom Widget',
        type: 'custom',
        icon: Settings,
        content: <div className="text-gray-500">Custom content</div>
      },
    };

    const newWidget = {
      id: newId,
      ...widgetTemplates[type],
    };

    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => [
      ...prev,
      { i: newId, x: 0, y: Infinity, w: 6, h: 3 }
    ]);
    setShowWidgetPicker(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={() => setShowWidgetPicker(!showWidgetPicker)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Widget
        </button>
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="absolute top-20 right-4 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Add Widget</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['metrics', 'activity', 'agents', 'chart'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleAddWidget(type)}
                className="p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-colors text-left"
              >
                <div className="text-sm font-medium text-gray-300 capitalize">{type}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowWidgetPicker(false)}
            className="mt-3 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="h-[calc(100vh-8rem)] overflow-auto">
        <GridLayout
          className="layout"
          layout={layout}
          onLayoutChange={handleLayoutChange}
          cols={12}
          rowHeight={60}
          width={window.innerWidth - 32}
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
        >
          {widgets.map(widget => (
            <div key={widget.id}>
              <DashboardWidget
                widget={widget}
                onRemove={handleRemoveWidget}
              />
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}

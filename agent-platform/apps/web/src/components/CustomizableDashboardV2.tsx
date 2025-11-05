/**
 * Customizable Home Dashboard - Zustand Edition
 * Draggable, resizable widget-based interface with global state persistence
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { usePlatformStore, Widget } from '@/store';
import {
  Activity, BarChart3, Users, Zap, TrendingUp,
  Code, MessageSquare, FolderTree, Plus, Settings, X,
  Maximize2, Minimize2
} from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

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

// Widget content components
function MetricsWidget() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <div className="text-3xl font-bold text-purple-300">24</div>
        <div className="text-sm text-gray-400 mt-1">Active Agents</div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="text-3xl font-bold text-blue-300">147</div>
        <div className="text-sm text-gray-400 mt-1">Tasks Completed</div>
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="text-3xl font-bold text-green-300">98%</div>
        <div className="text-sm text-gray-400 mt-1">Success Rate</div>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="text-3xl font-bold text-orange-300">12.4s</div>
        <div className="text-sm text-gray-400 mt-1">Avg Response</div>
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
      {activities.map(activity => {
        const Icon = activity.icon;
        return (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <Icon className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-gray-300 truncate">{activity.text}</div>
              <div className="text-xs text-gray-500">{activity.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgentsWidget() {
  const agents = [
    { id: 1, name: 'Code Reviewer', tasks: 3, status: 'active' },
    { id: 2, name: 'Content Writer', tasks: 0, status: 'idle' },
    { id: 3, name: 'Data Analyst', tasks: 5, status: 'active' },
    { id: 4, name: 'UI Designer', tasks: 2, status: 'active' },
  ];

  return (
    <div className="space-y-3">
      {agents.map(agent => (
        <div key={agent.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className="text-sm text-gray-300">{agent.name}</span>
          </div>
          <span className="text-xs text-gray-500">{agent.tasks} tasks</span>
        </div>
      ))}
    </div>
  );
}

function PerformanceWidget() {
  return (
    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
      Chart visualization coming soon
    </div>
  );
}

// Helper function to render widget content
function renderWidgetContent(widget: Widget) {
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

// Individual widget component
interface DashboardWidgetProps {
  widget: Widget;
}

function DashboardWidget({ widget }: DashboardWidgetProps) {
  const { removeWidget, collapseWidget } = usePlatformStore();
  const IconComponent = getIconForType(widget.type);

  return (
    <div className="h-full bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50 cursor-move">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-300">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              collapseWidget(widget.id);
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(widget.id);
            }}
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

// Main dashboard component
export function CustomizableDashboard() {
  const { widgets, addWidget, updateWidget } = usePlatformStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Convert widgets to layout format
  const layouts = {
    lg: widgets.map(w => ({
      i: w.id,
      x: w.position.x / 100,
      y: w.position.y / 100,
      w: Math.max(3, w.size.width / 100),
      h: Math.max(2, w.size.height / 100),
    })),
  };

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    layout.forEach(item => {
      const widget = widgets.find(w => w.id === item.i);
      if (widget) {
        updateWidget(item.i, {
          position: { x: item.x * 100, y: item.y * 100 },
          size: { width: item.w * 100, height: item.h * 100 },
        });
      }
    });
  }, [widgets, updateWidget]);

  const handleAddWidget = (type: string) => {
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: 0, y: Infinity },
      size: { width: 350, height: 250 },
      collapsed: false,
    };
    addWidget(newWidget);
    setShowWidgetPicker(false);
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <button
          onClick={() => setShowWidgetPicker(!showWidgetPicker)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/50"
        >
          <Plus className="w-4 h-4" />
          Add Widget
        </button>
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="absolute top-24 right-8 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Add Widget</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['metrics', 'activity', 'agents', 'performance'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleAddWidget(type)}
                className="p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-colors text-left group"
              >
                <div className="text-sm font-medium text-gray-300 capitalize group-hover:text-white">
                  {type}
                </div>
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
      <div className="h-[calc(100%-5rem)] overflow-auto pb-20">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
        >
          {widgets.map(widget => (
            <div key={widget.id}>
              <DashboardWidget widget={widget} />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

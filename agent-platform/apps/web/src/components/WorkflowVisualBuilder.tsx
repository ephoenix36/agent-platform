/**
 * Workflow Visual Builder
 * 
 * Drag-and-drop workflow builder with visual step configuration
 */

'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Play, Plus, Save, Settings, Trash2, Copy, GitBranch,
  Clock, Repeat, Users, Zap, X, ArrowRight, Brain
} from 'lucide-react';
import type { Workflow, WorkflowStep } from '@/types/platform';

interface StepNodeData {
  label: string;
  type: WorkflowStep['type'];
  config?: any;
}

const stepTypes = [
  { type: 'agent', label: 'AI Agent', icon: Brain, color: '#8B5CF6' },
  { type: 'tool', label: 'Tool', icon: Zap, color: '#3B82F6' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: '#F59E0B' },
  { type: 'loop', label: 'Loop', icon: Repeat, color: '#10B981' },
  { type: 'parallel', label: 'Parallel', icon: Copy, color: '#EC4899' },
  { type: 'human_input', label: 'Human Input', icon: Users, color: '#6366F1' },
];

// Custom Node Component
function StepNode({ data }: { data: StepNodeData }) {
  const stepType = stepTypes.find(t => t.type === data.type);
  const Icon = stepType?.icon || Brain;
  const color = stepType?.color || '#6B7280';

  return (
    <div
      className="px-4 py-3 rounded-lg border-2 shadow-lg min-w-[200px]"
      style={{
        backgroundColor: '#1F2937',
        borderColor: color,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <div className="text-sm font-medium text-white">{data.label}</div>
          <div className="text-xs text-gray-400 capitalize">{stepType?.label}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

const nodeTypes = {
  stepNode: StepNode,
};

interface WorkflowBuilderProps {
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  onCancel?: () => void;
}

export function WorkflowVisualBuilder({ initialWorkflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow?.steps?.map((step, idx) => ({
    id: step.id,
    type: 'stepNode',
    position: { x: 250, y: idx * 100 },
    data: {
      label: step.name,
      type: step.type,
      config: step.config,
    },
  })) || []);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '');
  const [showStepConfig, setShowStepConfig] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addStep = (stepType: WorkflowStep['type']) => {
    const newNode: Node = {
      id: `step-${Date.now()}`,
      type: 'stepNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: `New ${stepType}`,
        type: stepType,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  };

  const handleSave = () => {
    const workflow: Workflow = {
      id: initialWorkflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      version: initialWorkflow?.version || '1.0.0',
      category: 'automation',
      tags: [],
      privacy: 'private',
      creator: {
        id: 'user-1',
        name: 'You',
      },
      steps: nodes.map((node, idx) => ({
        id: node.id,
        name: node.data.label,
        type: node.data.type,
        config: node.data.config || {},
        next: edges.find((e) => e.source === node.id)?.target,
      })),
      startStep: nodes[0]?.id || '',
      createdAt: initialWorkflow?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave?.(workflow);
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-bold bg-transparent border-none focus:outline-none text-white"
              placeholder="Workflow Name"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Step Palette */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
          <h3 className="font-semibold text-white mb-4">Add Steps</h3>
          <div className="space-y-2">
            {stepTypes.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.type}
                  onClick={() => addStep(step.type as WorkflowStep['type'])}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{step.label}</div>
                    <div className="text-xs text-gray-400">Click to add</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-white mb-4">Description</h3>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {selectedNode && (
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Selected Step</h3>
              <div className="text-sm text-gray-300 mb-3">{selectedNode.data.label}</div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowStepConfig(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
                <button
                  onClick={deleteSelectedNode}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#374151" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const stepType = stepTypes.find(t => t.type === node.data.type);
                return stepType?.color || '#6B7280';
              }}
            />
            
            <Panel position="top-right" className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-lg p-3 m-4">
              <div className="flex items-center gap-2 text-sm text-white">
                <Clock className="w-4 h-4" />
                <span>{nodes.length} steps</span>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Step Configuration Modal */}
      {showStepConfig && selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div className="border-b border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white">Configure Step</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Step Name
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {selectedNode.data.type === 'agent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Agent
                  </label>
                  <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500">
                    <option>Customer Support Agent</option>
                    <option>Research Agent</option>
                    <option>Code Review Agent</option>
                  </select>
                </div>
              )}

              {selectedNode.data.type === 'condition' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Condition Expression
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., result.status === 'success'"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedNode.data.type === 'loop' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Loop Type
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500">
                      <option>For Each Item</option>
                      <option>Until Condition</option>
                      <option>Fixed Count</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Iterations
                    </label>
                    <input
                      type="number"
                      defaultValue={10}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowStepConfig(false)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowStepConfig(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

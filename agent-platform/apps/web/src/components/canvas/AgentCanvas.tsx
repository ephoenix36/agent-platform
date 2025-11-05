"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./nodes/AgentNode";
import { WorkflowNode } from "./nodes/WorkflowNode";
import { DataSourceNode } from "./nodes/DataSourceNode";
import { CanvasToolbar } from "./CanvasToolbar";
import { VoiceAssistant } from "../voice/VoiceAssistant";
import VoiceCommands from "../VoiceCommands";
import AgentMarketplace from "../AgentMarketplace";
import ExecutionPanel from "../ExecutionPanel";
import { ShoppingBag, MessageSquare, X } from "lucide-react";

const nodeTypes = {
  agent: AgentNode,
  workflow: WorkflowNode,
  datasource: DataSourceNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "agent",
    position: { x: 250, y: 100 },
    data: {
      name: "Research Agent",
      description: "Gathers and analyzes information",
      status: "idle",
    },
  },
];

const initialEdges: Edge[] = [];

export function AgentCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNewAgent = useCallback(() => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: "agent",
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: {
        name: `Agent ${nodes.length + 1}`,
        description: "New agent",
        status: "idle",
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  return (
    <div className="relative h-full w-full bg-background">
      <CanvasToolbar onAddAgent={addNewAgent} onToggleVoice={() => setIsVoiceActive(!isVoiceActive)} />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case "agent":
                return "#667eea";
              case "workflow":
                return "#00d4ff";
              case "datasource":
                return "#b794f6";
              default:
                return "#888";
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {isVoiceActive && <VoiceAssistant onClose={() => setIsVoiceActive(false)} />}
    </div>
  );
}

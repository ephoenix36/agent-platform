"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Bot, Play, Pause } from "lucide-react";
import { useState } from "react";

export function AgentNode({ data }: NodeProps) {
  const [isRunning, setIsRunning] = useState(false);
  const nodeData = data as any;

  return (
    <div className="bg-card border-2 border-primary rounded-lg shadow-lg min-w-[200px]">
      <div className="bg-primary/10 px-4 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{String(nodeData.name || '')}</span>
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 hover:bg-accent rounded transition-colors"
        >
          {isRunning ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </button>
      </div>

      <div className="p-4">
  <p className="text-xs text-muted-foreground mb-2">{String(nodeData.description || '')}</p>
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-muted-foreground">
            {isRunning ? "Running" : String(nodeData.status || '')}
          </span>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3" />
    </div>
  );
}

"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Workflow } from "lucide-react";

export function WorkflowNode({ data }: NodeProps) {
  const nodeData = data as any;
  return (
    <div className="bg-card border-2 border-accent rounded-lg shadow-lg min-w-[200px]">
      <div className="bg-accent/10 px-4 py-2 border-b border-border flex items-center gap-2">
        <Workflow className="w-4 h-4 text-accent" />
        <span className="font-semibold text-sm">{String(nodeData.name || "Workflow")}</span>
      </div>

      <div className="p-4">
        <p className="text-xs text-muted-foreground">{String(nodeData.description || "Workflow node")}</p>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-accent !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-accent !w-3 !h-3" />
    </div>
  );
}

"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";

export function DataSourceNode({ data }: NodeProps) {
  const nodeData = data as any;
  return (
    <div className="bg-card border-2 border-secondary rounded-lg shadow-lg min-w-[200px]">
      <div className="bg-secondary/10 px-4 py-2 border-b border-border flex items-center gap-2">
        <Database className="w-4 h-4 text-secondary" />
        <span className="font-semibold text-sm">{String(nodeData.name || "Data Source")}</span>
      </div>

      <div className="p-4">
        <p className="text-xs text-muted-foreground">{String(nodeData.description || "Data source node")}</p>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-secondary !w-3 !h-3" />
    </div>
  );
}

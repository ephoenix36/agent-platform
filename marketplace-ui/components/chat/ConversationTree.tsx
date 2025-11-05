"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, MessageSquare, Bot, User, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

type TreeNode = {
  id: string;
  type: "user" | "agent";
  content: string;
  agentName?: string;
  timestamp: Date;
  branches?: TreeNode[];
  selected?: boolean;
};

interface ConversationTreeProps {
  nodes: TreeNode[];
  onNodeClick?: (nodeId: string) => void;
}

const TreeNodeComponent = ({ 
  node, 
  depth = 0, 
  onNodeClick 
}: { 
  node: TreeNode; 
  depth?: number; 
  onNodeClick?: (nodeId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasBranches = node.branches && node.branches.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.1 }}
      className="relative"
      style={{ marginLeft: `${depth * 40}px` }}
    >
      {/* Connection Line */}
      {depth > 0 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute left-[-20px] top-6 w-5 h-0.5 bg-border"
        />
      )}

      {/* Node */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (hasBranches) setIsExpanded(!isExpanded);
          onNodeClick?.(node.id);
        }}
        className={`mb-3 cursor-pointer transition-all ${
          node.selected ? "ring-2 ring-primary" : ""
        }`}
      >
        <div
          className={`p-4 rounded-lg border-2 ${
            node.type === "user"
              ? "bg-primary/5 border-primary/20"
              : "bg-muted/50 border-border"
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                node.type === "user" ? "bg-primary/20" : "bg-purple-500/20"
              }`}
            >
              {node.type === "user" ? (
                <User className="h-4 w-4 text-primary" />
              ) : (
                <Bot className="h-4 w-4 text-purple-600" />
              )}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-semibold">
                  {node.type === "user" ? "You" : node.agentName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {node.timestamp.toLocaleTimeString()}
                </span>
                {hasBranches && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center space-x-1 text-xs bg-purple-500/10 px-2 py-0.5 rounded-full"
                  >
                    <GitBranch className="h-3 w-3 text-purple-600" />
                    <span className="text-purple-600">{node.branches?.length || 0}</span>
                  </motion.div>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {node.content}
              </p>
            </div>

            {/* Expand/Collapse Icon */}
            {hasBranches && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Branches */}
      <AnimatePresence>
        {hasBranches && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            {/* Vertical connection line */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"
            />

            {node.branches!.map((branch, index) => (
              <TreeNodeComponent
                key={branch.id}
                node={branch}
                depth={depth + 1}
                onNodeClick={onNodeClick}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export function ConversationTree({ nodes, onNodeClick }: ConversationTreeProps) {
  return (
    <div className="p-6 bg-card rounded-lg border">
      <div className="flex items-center space-x-2 mb-6">
        <GitBranch className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Conversation Tree</h3>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="ml-auto"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </motion.div>
      </div>

      <div className="space-y-2">
        {nodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>

      {nodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Start a conversation to see the tree</p>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { Plus, Mic, MicOff, Layout, Save } from "lucide-react";
import { useState } from "react";

interface CanvasToolbarProps {
  onAddAgent: () => void;
  onToggleVoice: () => void;
}

export function CanvasToolbar({ onAddAgent, onToggleVoice }: CanvasToolbarProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
    onToggleVoice();
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <div className="flex items-center gap-2 bg-card/80 backdrop-blur-lg border border-border rounded-lg p-2 shadow-lg">
        <button
          onClick={onAddAgent}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Add Agent"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-border" />

        <button
          onClick={handleVoiceToggle}
          className={`p-2 hover:bg-accent rounded-md transition-colors ${
            isVoiceActive ? "bg-primary text-primary-foreground" : ""
          }`}
          title={isVoiceActive ? "Disable Voice" : "Enable Voice"}
        >
          {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <div className="w-px h-6 bg-border" />

        <button
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Change Layout"
        >
          <Layout className="w-5 h-5" />
        </button>

        <button
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Save Canvas"
        >
          <Save className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-card/80 backdrop-blur-lg border border-border rounded-lg px-4 py-2 shadow-lg">
        <div className="text-sm font-medium">AI Agent Platform</div>
        <div className="text-xs text-muted-foreground">Canvas Mode</div>
      </div>
    </div>
  );
}

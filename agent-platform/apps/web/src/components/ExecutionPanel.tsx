'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ExecutionEvent, apiClient, AgentConfig } from '../lib/api-client';

interface ExecutionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  agentConfig?: AgentConfig;
  inputData?: Record<string, any>;
}

export default function ExecutionPanel({ 
  isOpen, 
  onClose, 
  agentConfig, 
  inputData 
}: ExecutionPanelProps) {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [events]);

  const handleExecute = async () => {
    if (!agentConfig || !inputData) return;

    setEvents([]);
    setIsExecuting(true);

    await apiClient.executeAgentStreaming(
      {
        agent_id: `exec-${Date.now()}`,
        agent_config: agentConfig,
        input_data: inputData,
        protocol: agentConfig.protocol,
      },
      (event: ExecutionEvent) => {
            setEvents((prev) => [...prev, event]);
            if (event.type === 'metadata') {
              setExecutionId(event.execution_id ?? null);
            }
          },
      () => {
        setIsExecuting(false);
      },
          (error: any) => {
            console.error('Execution error:', error);
        setEvents((prev) => [
          ...prev,
          {
            type: 'error',
            data: { error: error.message },
            timestamp: Date.now(),
                execution_id: executionId ?? undefined,
          },
        ]);
        setIsExecuting(false);
      }
    );
  };

  const handleCancel = async () => {
    if (executionId) {
      await apiClient.cancelExecution(executionId);
      setIsExecuting(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status':
        return '📊';
      case 'log':
        return '📝';
      case 'error':
        return '❌';
      case 'tool_call':
        return '🔧';
      case 'tool_result':
        return '✅';
      case 'ui_component':
        return '🎨';
      case 'thinking':
        return '🤔';
      case 'result':
        return '🎉';
      case 'metadata':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'tool_result':
        return 'text-green-400';
      case 'result':
        return 'text-blue-400';
      case 'thinking':
        return 'text-purple-400';
      case 'ui_component':
        return 'text-pink-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-20 bottom-4 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Agent Execution</h3>
          {executionId && (
            <p className="text-xs text-gray-400 font-mono">{executionId}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-700 flex gap-2">
        {!isExecuting ? (
          <button
            onClick={handleExecute}
            disabled={!agentConfig || !inputData}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            ▶️ Execute Agent
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ⏹️ Cancel
          </button>
        )}
        <button
          onClick={() => setEvents([])}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🗑️
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No events yet</p>
            <p className="text-sm mt-2">Click Execute to start</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${getEventColor(event.type)}`}>
                      {event.type.toUpperCase()}
                    </span>
                    {event.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">
                    {typeof event.data === 'string' ? (
                      event.data
                    ) : (
                      <pre className="whitespace-pre-wrap break-words text-xs">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={eventsEndRef} />
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-gray-700 bg-gray-850">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{events.length} events</span>
          {isExecuting && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Running...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

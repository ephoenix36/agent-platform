/**
 * DiffViewer Component
 * Side-by-side code comparison with Accept/Reject controls
 * Supports syntax highlighting and line-by-line diff display
 */

'use client';

import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronRight, Copy, Code } from 'lucide-react';

interface DiffLine {
  lineNumber: number;
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffBlock {
  id: string;
  fileName: string;
  language: string;
  lines: DiffLine[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

interface DiffViewerProps {
  diffs: DiffBlock[];
  onAccept?: (diffId: string) => void;
  onReject?: (diffId: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

function DiffLineComponent({ line }: { line: DiffLine }) {
  const getLineStyle = () => {
    switch (line.type) {
      case 'added':
        return 'bg-green-500/10 border-l-2 border-green-500';
      case 'removed':
        return 'bg-red-500/10 border-l-2 border-red-500';
      case 'modified':
        return 'bg-yellow-500/10 border-l-2 border-yellow-500';
      default:
        return 'bg-gray-900/30';
    }
  };

  const getLinePrefix = () => {
    switch (line.type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'modified':
        return '~';
      default:
        return ' ';
    }
  };

  const getTextColor = () => {
    switch (line.type) {
      case 'added':
        return 'text-green-300';
      case 'removed':
        return 'text-red-300';
      case 'modified':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className={`flex items-start font-mono text-sm ${getLineStyle()}`}>
      {/* Line Numbers */}
      <div className="flex-shrink-0 w-24 px-3 py-1 text-gray-600 select-none border-r border-gray-800">
        <span className="inline-block w-8 text-right">
          {line.oldLineNumber || ''}
        </span>
        <span className="inline-block w-8 text-right ml-2">
          {line.newLineNumber || ''}
        </span>
      </div>

      {/* Diff Prefix */}
      <div className="flex-shrink-0 w-6 px-1 py-1 text-gray-600 select-none">
        {getLinePrefix()}
      </div>

      {/* Code Content */}
      <div className={`flex-1 px-3 py-1 ${getTextColor()} overflow-x-auto`}>
        <code>{line.content}</code>
      </div>
    </div>
  );
}

function DiffBlockComponent({
  diff,
  onAccept,
  onReject,
}: {
  diff: DiffBlock;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <Code className="w-4 h-4 text-purple-400" />
          
          <div className="flex-1">
            <h3 className="font-medium text-white">{diff.fileName}</h3>
            <div className="flex items-center gap-4 mt-1 text-xs">
              <span className="text-green-400">+{diff.summary.added} added</span>
              <span className="text-red-400">-{diff.summary.removed} removed</span>
              {diff.summary.modified > 0 && (
                <span className="text-yellow-400">~{diff.summary.modified} modified</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg transition-all"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>

      {/* Diff Content */}
      {isExpanded && (
        <div className="bg-gray-950">
          {diff.lines.map((line, index) => (
            <DiffLineComponent key={index} line={line} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiffViewer({
  diffs,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}: DiffViewerProps) {
  const [acceptedDiffs, setAcceptedDiffs] = useState<Set<string>>(new Set());
  const [rejectedDiffs, setRejectedDiffs] = useState<Set<string>>(new Set());

  const handleAccept = (diffId: string) => {
    setAcceptedDiffs((prev) => new Set(prev).add(diffId));
    setRejectedDiffs((prev) => {
      const next = new Set(prev);
      next.delete(diffId);
      return next;
    });
    onAccept?.(diffId);
  };

  const handleReject = (diffId: string) => {
    setRejectedDiffs((prev) => new Set(prev).add(diffId));
    setAcceptedDiffs((prev) => {
      const next = new Set(prev);
      next.delete(diffId);
      return next;
    });
    onReject?.(diffId);
  };

  const handleAcceptAll = () => {
    setAcceptedDiffs(new Set(diffs.map((d) => d.id)));
    setRejectedDiffs(new Set());
    onAcceptAll?.();
  };

  const handleRejectAll = () => {
    setRejectedDiffs(new Set(diffs.map((d) => d.id)));
    setAcceptedDiffs(new Set());
    onRejectAll?.();
  };

  const totalChanges = diffs.reduce(
    (acc, diff) => ({
      added: acc.added + diff.summary.added,
      removed: acc.removed + diff.summary.removed,
      modified: acc.modified + diff.summary.modified,
    }),
    { added: 0, removed: 0, modified: 0 }
  );

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Code Changes Review</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">{diffs.length} files changed</span>
              <span className="text-green-400">+{totalChanges.added}</span>
              <span className="text-red-400">-{totalChanges.removed}</span>
              {totalChanges.modified > 0 && (
                <span className="text-yellow-400">~{totalChanges.modified}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRejectAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
              Reject All
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20"
            >
              <Check className="w-4 h-4" />
              Accept All
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {acceptedDiffs.size} accepted
          </span>
          <span>•</span>
          <span>
            {rejectedDiffs.size} rejected
          </span>
          <span>•</span>
          <span>
            {diffs.length - acceptedDiffs.size - rejectedDiffs.size} pending
          </span>
        </div>
      </div>

      {/* Diff Blocks */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {diffs.map((diff) => (
          <DiffBlockComponent
            key={diff.id}
            diff={diff}
            onAccept={() => handleAccept(diff.id)}
            onReject={() => handleReject(diff.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Example usage component with sample data
export function DiffViewerExample() {
  const sampleDiffs: DiffBlock[] = [
    {
      id: 'diff1',
      fileName: 'src/components/Header.tsx',
      language: 'typescript',
      summary: { added: 3, removed: 1, modified: 2 },
      lines: [
        { lineNumber: 1, oldLineNumber: 1, newLineNumber: 1, type: 'unchanged', content: "import React from 'react';" },
        { lineNumber: 2, oldLineNumber: 2, newLineNumber: 2, type: 'unchanged', content: "import { User } from '@/types';" },
        { lineNumber: 3, oldLineNumber: 3, type: 'removed', content: "import { Button } from './Button';" },
        { lineNumber: 4, newLineNumber: 3, type: 'added', content: "import { IconButton } from './IconButton';" },
        { lineNumber: 5, newLineNumber: 4, type: 'added', content: "import { Menu } from './Menu';" },
        { lineNumber: 6, oldLineNumber: 4, newLineNumber: 5, type: 'unchanged', content: '' },
        { lineNumber: 7, oldLineNumber: 5, newLineNumber: 6, type: 'modified', content: 'export default function Header({ user }: { user: User }) {' },
        { lineNumber: 8, oldLineNumber: 6, newLineNumber: 7, type: 'unchanged', content: '  return (' },
        { lineNumber: 9, newLineNumber: 8, type: 'added', content: '    <nav className="header">' },
        { lineNumber: 10, oldLineNumber: 7, newLineNumber: 9, type: 'unchanged', content: '      <h1>My App</h1>' },
      ],
    },
    {
      id: 'diff2',
      fileName: 'src/styles/globals.css',
      language: 'css',
      summary: { added: 5, removed: 0, modified: 0 },
      lines: [
        { lineNumber: 1, oldLineNumber: 1, newLineNumber: 1, type: 'unchanged', content: 'body {' },
        { lineNumber: 2, oldLineNumber: 2, newLineNumber: 2, type: 'unchanged', content: '  margin: 0;' },
        { lineNumber: 3, oldLineNumber: 3, newLineNumber: 3, type: 'unchanged', content: '  font-family: sans-serif;' },
        { lineNumber: 4, oldLineNumber: 4, newLineNumber: 4, type: 'unchanged', content: '}' },
        { lineNumber: 5, newLineNumber: 5, type: 'added', content: '' },
        { lineNumber: 6, newLineNumber: 6, type: 'added', content: '.header {' },
        { lineNumber: 7, newLineNumber: 7, type: 'added', content: '  background: linear-gradient(to right, #667eea, #764ba2);' },
        { lineNumber: 8, newLineNumber: 8, type: 'added', content: '  padding: 1rem 2rem;' },
        { lineNumber: 9, newLineNumber: 9, type: 'added', content: '}' },
      ],
    },
  ];

  const handleAccept = (diffId: string) => {
    console.log('Accepted:', diffId);
  };

  const handleReject = (diffId: string) => {
    console.log('Rejected:', diffId);
  };

  const handleAcceptAll = () => {
    console.log('Accepted all diffs');
  };

  const handleRejectAll = () => {
    console.log('Rejected all diffs');
  };

  return (
    <DiffViewer
      diffs={sampleDiffs}
      onAccept={handleAccept}
      onReject={handleReject}
      onAcceptAll={handleAcceptAll}
      onRejectAll={handleRejectAll}
    />
  );
}

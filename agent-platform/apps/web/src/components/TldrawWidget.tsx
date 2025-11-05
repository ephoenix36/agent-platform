/**
 * Tldraw Canvas Widget
 * Infinite canvas for drawing, diagramming, and visual collaboration
 * 
 * Note: This is a placeholder component. In production, install tldraw:
 * npm install tldraw
 * 
 * Then import: import { Tldraw } from 'tldraw'
 */

'use client';

import { useState } from 'react';
import { 
  Pencil, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Hand,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

export function TldrawWidget() {
  const [tool, setTool] = useState<'select' | 'pencil' | 'rectangle' | 'circle' | 'text' | 'eraser'>('select');
  const [zoom, setZoom] = useState(100);

  // In production, this would use the actual tldraw library
  // For now, we'll create a placeholder canvas
  
  const tools = [
    { id: 'select', icon: Hand, label: 'Select' },
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 300));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 25));

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="border-b border-gray-800 p-2 flex items-center justify-between">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTool(id as any)}
              className={`p-2 rounded transition-colors ${
                tool === id
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 min-w-[4rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* File Controls */}
        <div className="flex items-center gap-1">
          <button
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Export"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            title="Import"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-gray-800 rounded transition-colors text-red-400"
            title="Clear Canvas"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Placeholder canvas - Replace with actual tldraw component */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Infinite Canvas</h3>
            <p className="text-gray-400 mb-4">
              This is a placeholder for the tldraw integration.
            </p>
            <div className="text-left bg-gray-800 rounded-lg p-4 text-sm">
              <p className="text-purple-400 font-mono mb-2">To enable:</p>
              <code className="block text-gray-300">
                npm install tldraw<br/>
                npm install @tldraw/tldraw
              </code>
              <p className="text-gray-400 mt-3">
                Then replace this placeholder with the actual Tldraw component.
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Current tool: <span className="text-purple-400">{tool}</span> | 
              Zoom: <span className="text-purple-400">{zoom}%</span>
            </div>
          </div>
        </div>

        {/* Grid Background Pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div>Ready</div>
        <div className="flex items-center gap-4">
          <div>Objects: 0</div>
          <div>Selected: 0</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Production-ready Tldraw Integration Example:
 * 
 * import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw'
 * import 'tldraw/tldraw.css'
 * 
 * export function TldrawWidget() {
 *   const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }))
 * 
 *   return (
 *     <div className="h-full">
 *       <Tldraw
 *         store={store}
 *         onMount={(editor) => {
 *           // Configure editor
 *           editor.updateInstanceState({ isDebugMode: false })
 *         }}
 *       />
 *     </div>
 *   )
 * }
 */

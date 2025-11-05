/**
 * AI-Enabled Document Editor
 * Advanced document manipulation with OCR, markup, image editing, and analysis
 * Integrates with LangChain, LlamaIndex, and various AI services
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Image as ImageIcon, Video, Music, Code, Database,
  Eye, Edit3, Crop, Scissors, Maximize2, RotateCw, Type,
  Sparkles, Wand2, Search, Download, Upload, X, Check,
  ZoomIn, ZoomOut, Move, Square, Circle, ArrowRight,
  Highlighter, Eraser, Pen, MessageSquare, Brain, Layers
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
  metadata?: any;
  annotations?: Annotation[];
  extractedText?: string;
  analysis?: DocumentAnalysis;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'text' | 'shape' | 'arrow' | 'comment';
  position: { x: number; y: number; width?: number; height?: number };
  content?: string;
  color: string;
}

interface DocumentAnalysis {
  summary?: string;
  entities?: string[];
  keywords?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories?: string[];
  confidence?: number;
}

interface DocumentEditorProps {
  document: Document;
  onSave?: (document: Document) => void;
  onClose?: () => void;
}

export function DocumentEditor({ document: initialDocument, onSave, onClose }: DocumentEditorProps) {
  const [document, setDocument] = useState<Document>(initialDocument);
  const [tool, setTool] = useState<'select' | 'crop' | 'draw' | 'text' | 'shape'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // AI Processing Functions
  const performOCR = async () => {
    setIsProcessing(true);
    try {
      // Use Google Cloud Vision API or Tesseract.js
      const response = await fetch('/api/documents/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl: document.url }),
      });
      
      const { text } = await response.json();
      setDocument(prev => ({ ...prev, extractedText: text }));
      alert('✅ OCR Complete!');
    } catch (error) {
      alert('❌ OCR failed: ' + error);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeDocument = async () => {
    setIsProcessing(true);
    try {
      // Use LLM to analyze document
      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          text: document.extractedText || '',
          url: document.url,
        }),
      });
      
      const analysis = await response.json();
      setDocument(prev => ({ ...prev, analysis }));
      alert('✅ Analysis Complete!');
    } catch (error) {
      alert('❌ Analysis failed: ' + error);
    } finally {
      setIsProcessing(false);
    }
  };

  const enhanceImage = async (operation: 'upscale' | 'denoise' | 'sharpen') => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/documents/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentUrl: document.url,
          operation,
        }),
      });
      
      const { enhancedUrl } = await response.json();
      setDocument(prev => ({ ...prev, url: enhancedUrl }));
      alert(`✅ Image ${operation} complete!`);
    } catch (error) {
      alert(`❌ ${operation} failed: ` + error);
    } finally {
      setIsProcessing(false);
    }
  };

  const aiGenerateCaption = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/documents/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl: document.url }),
      });
      
      const { caption } = await response.json();
      alert(`Caption: ${caption}`);
    } catch (error) {
      alert('❌ Caption generation failed: ' + error);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveDocument = () => {
    onSave?.(document);
    alert('✅ Document saved!');
  };

  const tools = [
    { id: 'select', name: 'Select', icon: Move },
    { id: 'crop', name: 'Crop', icon: Crop },
    { id: 'draw', name: 'Draw', icon: Pen },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'shape', name: 'Shape', icon: Square },
  ];

  const aiTools = [
    { name: 'OCR', icon: Type, onClick: performOCR, description: 'Extract text' },
    { name: 'Analyze', icon: Brain, onClick: analyzeDocument, description: 'AI analysis' },
    { name: 'Enhance', icon: Wand2, onClick: () => enhanceImage('upscale'), description: 'Upscale image' },
    { name: 'Caption', icon: MessageSquare, onClick: aiGenerateCaption, description: 'Generate caption' },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex">
      {/* Sidebar - Tools */}
      <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="p-3 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="h-px w-12 bg-gray-800" />

        {/* Drawing Tools */}
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id as any)}
              className={`p-3 rounded-lg transition-all ${
                tool === t.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={t.name}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}

        <div className="h-px w-12 bg-gray-800" />

        {/* Zoom Controls */}
        <button
          onClick={() => setZoom(Math.min(zoom + 10, 200))}
          className="p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-6 h-6" />
        </button>
        <div className="text-xs text-gray-500">{zoom}%</div>
        <button
          onClick={() => setZoom(Math.max(zoom - 10, 50))}
          className="p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-6 h-6" />
        </button>

        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={saveDocument}
          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          title="Save"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 flex items-center px-6 gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <div className="font-medium">{document.name}</div>
              <div className="text-xs text-gray-400">
                {(document.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* AI Tools */}
          <div className="flex items-center gap-2">
            {aiTools.map((aiTool) => {
              const Icon = aiTool.icon;
              return (
                <button
                  key={aiTool.name}
                  onClick={aiTool.onClick}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 rounded-lg transition-colors text-sm"
                  title={aiTool.description}
                >
                  <Icon className="w-4 h-4" />
                  {aiTool.name}
                </button>
              );
            })}
          </div>

          {/* Annotations Toggle */}
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`p-2 rounded-lg transition-colors ${
              showAnnotations ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title="Toggle Annotations"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={editorRef}
          className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center p-8"
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {document.type.startsWith('image/') ? (
              <img
                src={document.url}
                alt={document.name}
                className="max-w-full max-h-full"
              />
            ) : document.type === 'application/pdf' ? (
              <iframe
                src={document.url}
                className="w-full h-full min-h-[600px]"
                title={document.name}
              />
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <div className="text-gray-600">Preview not available</div>
              </div>
            )}

            {/* Annotations Overlay */}
            {showAnnotations && document.annotations?.map((annotation) => (
              <div
                key={annotation.id}
                className={`absolute border-2 pointer-events-none ${
                  annotation.id === selectedAnnotation ? 'border-blue-500' : 'border-yellow-500'
                }`}
                style={{
                  left: annotation.position.x,
                  top: annotation.position.y,
                  width: annotation.position.width,
                  height: annotation.position.height,
                  backgroundColor: `${annotation.color}33`,
                }}
              >
                {annotation.content && (
                  <div className="absolute top-full mt-1 bg-gray-900 text-white px-2 py-1 rounded text-xs">
                    {annotation.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties & Analysis */}
      <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Document Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">DOCUMENT INFO</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span>{document.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size</span>
                <span>{(document.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>

          {/* Extracted Text */}
          {document.extractedText && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">EXTRACTED TEXT</h3>
              <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 max-h-40 overflow-y-auto">
                {document.extractedText}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {document.analysis && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">AI ANALYSIS</h3>
              <div className="space-y-3">
                {document.analysis.summary && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Summary</div>
                    <div className="text-sm">{document.analysis.summary}</div>
                  </div>
                )}
                {document.analysis.keywords && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Keywords</div>
                    <div className="flex flex-wrap gap-1">
                      {document.analysis.keywords.map((keyword, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {document.analysis.sentiment && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Sentiment</div>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      document.analysis.sentiment === 'positive' ? 'bg-green-500/20 text-green-300' :
                      document.analysis.sentiment === 'negative' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {document.analysis.sentiment}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Annotations */}
          {document.annotations && document.annotations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">ANNOTATIONS</h3>
              <div className="space-y-2">
                {document.annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    onClick={() => setSelectedAnnotation(annotation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedAnnotation === annotation.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                    } border`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{annotation.type}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocument(prev => ({
                            ...prev,
                            annotations: prev.annotations?.filter(a => a.id !== annotation.id),
                          }));
                        }}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {annotation.content && (
                      <div className="text-xs text-gray-400">{annotation.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">QUICK ACTIONS</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors flex flex-col items-center gap-1">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors flex flex-col items-center gap-1">
                <RotateCw className="w-4 h-4" />
                Rotate
              </button>
              <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors flex flex-col items-center gap-1">
                <Maximize2 className="w-4 h-4" />
                Resize
              </button>
              <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors flex flex-col items-center gap-1">
                <Scissors className="w-4 h-4" />
                Split
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium">Processing...</div>
            <div className="text-sm text-gray-400 mt-1">This may take a moment</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentEditor;

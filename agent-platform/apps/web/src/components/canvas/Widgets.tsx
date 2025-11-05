/**
 * Canvas Widgets
 * 
 * Dynamic widgets for displaying various content types in the canvas
 */

import React, { useState } from 'react';
import { 
  Type, Image as ImageIcon, Video, FileText, BarChart3, Table2, 
  Mic, X, Maximize2, Minimize2, Copy, Download 
} from 'lucide-react';
import type { CanvasWidget } from '@/types/platform';

interface WidgetProps {
  widget: CanvasWidget;
  onClose?: () => void;
  onUpdate?: (widget: CanvasWidget) => void;
}

// ==================== Text Widget ====================

export function TextWidget({ widget, onClose, onUpdate }: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { title, content, style } = widget.config;

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{
        width: widget.size.width,
        height: widget.size.height,
        ...style
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">{title || 'Text'}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`overflow-auto ${isExpanded ? 'max-h-96' : 'max-h-40'}`}>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

// ==================== Voice Transcript Widget ====================

export function VoiceTranscriptWidget({ widget, onClose }: WidgetProps) {
  const { content, autoDisplay } = widget.config;
  const [transcript, setTranscript] = useState<string[]>(
    Array.isArray(content) ? content : content ? [content] : []
  );

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript.join('\n'));
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg border-2 border-purple-200 p-4"
      style={{ width: widget.size.width, height: widget.size.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm">Voice Transcript</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyTranscript}
            className="p-1 hover:bg-white/50 rounded"
            title="Copy transcript"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={downloadTranscript}
            className="p-1 hover:bg-white/50 rounded"
            title="Download transcript"
          >
            <Download className="w-3 h-3" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-white/50 rounded">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="overflow-auto max-h-64 space-y-2">
        {transcript.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transcript yet...</p>
          </div>
        ) : (
          transcript.map((text, index) => (
            <div key={index} className="bg-white/70 rounded p-2 text-sm">
              <span className="text-xs text-gray-500 mr-2">#{index + 1}</span>
              {text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== Image Widget ====================

export function ImageWidget({ widget, onClose }: WidgetProps) {
  const { title, content, style } = widget.config;
  const [error, setError] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{ width: widget.size.width, height: widget.size.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">{title || 'Image'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="overflow-hidden rounded">
        {error ? (
          <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
            <ImageIcon className="w-8 h-8" />
          </div>
        ) : (
          <img
            src={content}
            alt={title || 'Image'}
            className="w-full h-auto object-contain"
            onError={() => setError(true)}
            style={style}
          />
        )}
      </div>
    </div>
  );
}

// ==================== Video Widget ====================

export function VideoWidget({ widget, onClose }: WidgetProps) {
  const { title, content } = widget.config;

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{ width: widget.size.width, height: widget.size.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">{title || 'Video'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Video */}
      <div className="overflow-hidden rounded">
        <video
          src={content}
          controls
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}

// ==================== Form Widget ====================

export function FormWidget({ widget, onClose, onUpdate }: WidgetProps) {
  const { title, content } = widget.config;
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Trigger callback or workflow
  };

  const renderField = (field: any) => {
    const { name, label, type, required, options } = field;

    switch (type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={type}
            name={name}
            required={required}
            value={formData[name] || ''}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            name={name}
            required={required}
            value={formData[name] || ''}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        );
      
      case 'select':
        return (
          <select
            name={name}
            required={required}
            value={formData[name] || ''}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            name={name}
            checked={formData[name] || false}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.checked })}
            className="w-4 h-4 text-blue-600"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{ width: widget.size.width, height: widget.size.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">{title || 'Form'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 overflow-auto max-h-96">
        {content?.fields?.map((field: any) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {content?.submitLabel || 'Submit'}
        </button>
      </form>
    </div>
  );
}

// ==================== Chart Widget ====================

export function ChartWidget({ widget, onClose }: WidgetProps) {
  const { title, content } = widget.config;

  // Simple bar chart for demo - could integrate Recharts here
  const data = content?.data || [];
  const maxValue = Math.max(...data.map((d: any) => d.value));

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{ width: widget.size.width, height: widget.size.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">{title || 'Chart'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Simple Bar Chart */}
      <div className="space-y-2">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs w-20 text-right">{item.label}</span>
            <div className="flex-1 bg-gray-100 rounded overflow-hidden">
              <div
                className="bg-blue-500 h-6 flex items-center justify-end pr-2"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              >
                <span className="text-xs text-white font-semibold">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Table Widget ====================

export function TableWidget({ widget, onClose }: WidgetProps) {
  const { title, content } = widget.config;
  const columns = content?.columns || [];
  const data = content?.data || [];

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{ width: widget.size.width, height: widget.size.height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-sm">{title || 'Table'}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col: any) => (
                <th key={col.key} className="px-3 py-2 text-left font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, index: number) => (
              <tr key={index} className="border-t border-gray-200">
                {columns.map((col: any) => (
                  <td key={col.key} className="px-3 py-2">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Widget Factory ====================

export function WidgetFactory({ widget, onClose, onUpdate }: WidgetProps) {
  switch (widget.type) {
    case 'text':
      return <TextWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    case 'voice_transcript':
      return <VoiceTranscriptWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    case 'image':
      return <ImageWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    case 'video':
      return <VideoWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    case 'form':
      return <FormWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    case 'chart':
      return <ChartWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    case 'table':
      return <TableWidget widget={widget} onClose={onClose} onUpdate={onUpdate} />;
    default:
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-sm text-yellow-800">Unknown widget type: {widget.type}</p>
        </div>
      );
  }
}

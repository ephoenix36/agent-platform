'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Upload, Code, Sparkles } from 'lucide-react';

interface SecurityScore {
  score: number;
  level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
    line_number?: number;
  }>;
  checksum: string;
}

export default function MCPToolCreator() {
  const [step, setStep] = useState<'template' | 'code' | 'scan' | 'publish'>('template');
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [toolCode, setToolCode] = useState('');
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const templates = [
    {
      id: 'web-search',
      name: 'Web Search Tool',
      description: 'Search the web and return results',
      code: `"""
Web Search MCP Tool
Safe, production-ready implementation
"""

from typing import List, Dict
import httpx
from pydantic import BaseModel, Field

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

class WebSearchTool:
    """Secure web search tool"""
    
    def __init__(self, api_key: str):
        # API key from environment variable - NEVER hardcode!
        self.api_key = api_key
        self.base_url = "https://api.search-engine.com/v1"
    
    async def search(self, query: str, max_results: int = 10) -> List[SearchResult]:
        """
        Search the web securely
        
        Args:
            query: Search query string (validated)
            max_results: Maximum number of results (capped at 50)
        
        Returns:
            List of search results
        """
        # Validate inputs
        if not query or len(query) > 500:
            raise ValueError("Query must be 1-500 characters")
        
        if max_results < 1 or max_results > 50:
            raise ValueError("max_results must be 1-50")
        
        # Use HTTPS only
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/search",
                params={
                    "q": query,
                    "num": max_results
                },
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=10.0  # Timeout for safety
            )
            response.raise_for_status()
            
            data = response.json()
            return [SearchResult(**item) for item in data["results"]]
`,
      features: ['✅ Input validation', '✅ HTTPS only', '✅ Timeout protection', '✅ No hardcoded secrets']
    },
    {
      id: 'data-processor',
      name: 'Data Processing Tool',
      description: 'Process and transform data safely',
      code: `"""
Data Processing MCP Tool
Secure data transformation
"""

from typing import Any, Dict, List
from pathlib import Path
import json
from pydantic import BaseModel, validator

class DataProcessorTool:
    """Secure data processor"""
    
    ALLOWED_DIR = Path("/app/data")  # Restricted directory
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
    
    def process_file(self, filename: str) -> Dict[str, Any]:
        """
        Process file securely
        
        Args:
            filename: Name of file to process
        
        Returns:
            Processed data
        """
        # Validate filename - prevent path traversal
        if '..' in filename or filename.startswith('/'):
            raise ValueError("Invalid filename")
        
        # Build safe path
        filepath = (self.ALLOWED_DIR / filename).resolve()
        
        # Ensure path is within allowed directory
        if not str(filepath).startswith(str(self.ALLOWED_DIR)):
            raise ValueError("Path traversal detected")
        
        # Check file exists and size
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filename}")
        
        if filepath.stat().st_size > self.MAX_FILE_SIZE:
            raise ValueError("File too large")
        
        # Process safely
        with open(filepath, 'r') as f:
            data = json.load(f)  # Use safe JSON parsing
        
        return data
    
    def transform(self, data: List[Dict]) -> List[Dict]:
        """Transform data with validation"""
        results = []
        
        for item in data:
            # Validate each item
            if not isinstance(item, dict):
                continue
            
            # Transform safely (no eval/exec!)
            transformed = {
                k: str(v)[:1000]  # Limit string length
                for k, v in item.items()
                if isinstance(k, str) and len(k) < 100
            }
            results.append(transformed)
        
        return results
`,
      features: ['✅ Path validation', '✅ Size limits', '✅ No eval/exec', '✅ Type checking']
    }
  ];

  const scanCode = async () => {
    setIsScanning(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/security/scan/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: toolCode,
          language: 'python'
        })
      });
      
      const result = await response.json();
      setSecurityScore(result);
      setStep('scan');
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Security scan failed. Please check your code and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const selectTemplate = (template: typeof templates[0]) => {
    setToolName(template.name);
    setToolDescription(template.description);
    setToolCode(template.code);
    setStep('code');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="h-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-green-400" />
          <div>
            <h1 className="text-2xl font-bold">MCP Tool Creator</h1>
            <p className="text-gray-300">Create secure, verified MCP tools</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-900 p-4 border-b border-gray-800">
        <div className="flex items-center justify-center gap-4">
          {['template', 'code', 'scan', 'publish'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === s ? 'bg-blue-600' : 
                ['template', 'code', 'scan', 'publish'].indexOf(step) > i ? 'bg-green-600' : 'bg-gray-700'
              }`}>
                {['template', 'code', 'scan', 'publish'].indexOf(step) > i ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{i + 1}</span>
                )}
              </div>
              <span className="text-sm capitalize">{s}</span>
              {i < 3 && <div className="w-12 h-0.5 bg-gray-700" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 'template' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Choose a Template</h2>
            <p className="text-gray-400 mb-6">Start with a secure, pre-vetted template or create from scratch</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all cursor-pointer group"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                  <div className="space-y-1">
                    {template.features.map((feature, i) => (
                      <div key={i} className="text-xs text-green-400">{feature}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('code')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
            >
              <Code className="w-5 h-5 inline mr-2" />
              Start from Scratch
            </button>
          </div>
        )}

        {step === 'code' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Write Your Tool Code</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Tool Name</label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="My Awesome Tool"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="What does your tool do?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Python Code</label>
                <textarea
                  value={toolCode}
                  onChange={(e) => setToolCode(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
                  rows={20}
                  placeholder="# Write your secure MCP tool code here..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('template')}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={scanCode}
                disabled={!toolCode || isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                {isScanning ? 'Scanning...' : 'Security Scan'}
              </button>
            </div>
          </div>
        )}

        {step === 'scan' && securityScore && (
          <div>
            <h2 className="text-xl font-bold mb-4">Security Analysis</h2>
            
            {/* Score Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Security Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(securityScore.score)}`}>
                    {securityScore.score}/100
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold uppercase text-sm ${
                  securityScore.level === 'safe' ? 'bg-green-500/20 text-green-400' :
                  securityScore.level === 'low' ? 'bg-blue-500/20 text-blue-400' :
                  securityScore.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {securityScore.level}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Checksum: <code className="text-xs">{securityScore.checksum}</code>
              </div>
            </div>

            {/* Issues */}
            {securityScore.issues.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Security Issues Found</h3>
                <div className="space-y-3">
                  {securityScore.issues.map((issue, i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{issue.type.replace(/_/g, ' ').toUpperCase()}</span>
                            {issue.line_number && (
                              <span className="text-xs text-gray-400">Line {issue.line_number}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{issue.description}</p>
                          <div className="text-xs text-blue-400">
                            💡 {issue.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">No Security Issues Found!</div>
                    <div className="text-sm">Your code passed all security checks</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('code')}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
              >
                Edit Code
              </button>
              <button
                onClick={() => setStep('publish')}
                disabled={securityScore.score < 70}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {securityScore.score >= 70 ? 'Publish Tool' : 'Fix Issues First'}
              </button>
            </div>
          </div>
        )}

        {step === 'publish' && securityScore && (
          <div>
            <h2 className="text-xl font-bold mb-4">Publish Your Tool</h2>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 text-green-400 mb-4">
                <CheckCircle className="w-6 h-6" />
                <div className="font-semibold">Ready to Publish!</div>
              </div>
              <p className="text-sm text-gray-300">
                Your tool has passed security verification and is ready for the marketplace.
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">What happens next:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Tool will be added to the marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Security badge will be displayed (Score: {securityScore.score})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Other users can install and use your tool</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>You'll earn 70% of revenue from usage</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => alert('Published! (Demo mode)')}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors w-full font-semibold"
            >
              Publish to Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

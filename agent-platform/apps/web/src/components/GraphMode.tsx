/**
 * Graph Mode - Infranodus-Inspired Network Visualization
 * Shows connections, gaps, and analyses between agents, docs, and concepts
 */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Network, Zap, TrendingUp, AlertCircle, Info } from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  type: 'agent' | 'document' | 'concept' | 'workflow';
  value: number; // Importance/frequency
  group: number; // Cluster
}

interface GraphLink {
  source: string;
  target: string;
  value: number; // Connection strength
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface Analysis {
  betweenness: { node: string; score: number }[];
  gaps: { from: string; to: string; potential: number }[];
  clusters: { id: number; nodes: string[]; theme: string }[];
}

export function GraphModeLayout() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);

  // Sample data - replace with real data
  const graphData: GraphData = {
    nodes: [
      { id: '1', name: 'API Development', type: 'agent', value: 10, group: 1 },
      { id: '2', name: 'Database Design', type: 'document', value: 8, group: 1 },
      { id: '3', name: 'Authentication', type: 'concept', value: 12, group: 1 },
      { id: '4', name: 'Frontend UI', type: 'agent', value: 9, group: 2 },
      { id: '5', name: 'Component Library', type: 'document', value: 7, group: 2 },
      { id: '6', name: 'User Experience', type: 'concept', value: 11, group: 2 },
      { id: '7', name: 'Testing', type: 'workflow', value: 6, group: 3 },
      { id: '8', name: 'Documentation', type: 'document', value: 5, group: 3 },
    ],
    links: [
      { source: '1', target: '2', value: 5 },
      { source: '1', target: '3', value: 8 },
      { source: '2', target: '3', value: 6 },
      { source: '4', target: '5', value: 7 },
      { source: '4', target: '6', value: 9 },
      { source: '5', target: '6', value: 6 },
      { source: '1', target: '4', value: 3 },
      { source: '3', target: '6', value: 4 },
      { source: '7', target: '1', value: 4 },
      { source: '7', target: '4', value: 4 },
      { source: '8', target: '1', value: 3 },
      { source: '8', target: '4', value: 3 },
    ],
  };

  // Sample analysis
  const sampleAnalysis: Analysis = {
    betweenness: [
      { node: 'Authentication', score: 0.85 },
      { node: 'API Development', score: 0.72 },
      { node: 'User Experience', score: 0.68 },
    ],
    gaps: [
      { from: 'Testing', to: 'Component Library', potential: 0.9 },
      { from: 'Documentation', to: 'User Experience', potential: 0.75 },
    ],
    clusters: [
      { id: 1, nodes: ['API Development', 'Database Design', 'Authentication'], theme: 'Backend Infrastructure' },
      { id: 2, nodes: ['Frontend UI', 'Component Library', 'User Experience'], theme: 'User Interface' },
      { id: 3, nodes: ['Testing', 'Documentation'], theme: 'Quality Assurance' },
    ],
  };

  useEffect(() => {
    setAnalysis(sampleAnalysis);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear existing content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    const g = svg.append('g');

    // Color scale for node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['agent', 'document', 'concept', 'workflow'])
      .range(['#a78bfa', '#60a5fa', '#34d399', '#f472b6']);

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance(100)
        .strength((d: any) => d.value / 10))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.value));

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => Math.sqrt(d.value) * 3)
      .attr('fill', (d) => colorScale(d.type))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add labels
    const label = g.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .text((d) => d.name)
      .attr('font-size', 12)
      .attr('fill', '#e5e7eb')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => Math.sqrt(d.value) * 3 + 15)
      .style('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  return (
    <div className="h-full grid grid-cols-[1fr_350px] gap-4 p-4">
      {/* Graph Visualization */}
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-gray-900/90 backdrop-blur border border-gray-700/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Network Graph</span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 z-10 bg-gray-900/90 backdrop-blur border border-gray-700/50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-gray-400 mb-2">Node Types</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span className="text-xs text-gray-300">Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-xs text-gray-300">Document</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-300">Concept</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-400"></div>
            <span className="text-xs text-gray-300">Workflow</span>
          </div>
        </div>

        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>

      {/* Analysis Panel */}
      <div className="space-y-4">
        {/* Selected Node Info */}
        {selectedNode && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-purple-300">Selected Node</h4>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-medium text-white">{selectedNode.name}</div>
              <div className="text-xs text-gray-400">
                Type: <span className="text-gray-300">{selectedNode.type}</span>
              </div>
              <div className="text-xs text-gray-400">
                Importance: <span className="text-gray-300">{selectedNode.value}</span>
              </div>
            </div>
          </div>
        )}

        {/* Key Concepts (Betweenness Centrality) */}
        {analysis && (
          <>
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-semibold text-gray-300">Key Concepts</h4>
              </div>
              <div className="space-y-2">
                {analysis.betweenness.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{item.node}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                          style={{ width: `${item.score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{(item.score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Structural Gaps */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-semibold text-gray-300">Structural Gaps</h4>
              </div>
              <div className="space-y-3">
                {analysis.gaps.map((gap, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                      <span>{gap.from}</span>
                      <span>→</span>
                      <span>{gap.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          style={{ width: `${gap.potential * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {(gap.potential * 100).toFixed(0)}% potential
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-semibold text-gray-300">Clusters</h4>
              </div>
              <div className="space-y-3">
                {analysis.clusters.map((cluster) => (
                  <div key={cluster.id} className="space-y-1">
                    <div className="text-sm font-medium text-gray-300">{cluster.theme}</div>
                    <div className="text-xs text-gray-500">
                      {cluster.nodes.length} nodes: {cluster.nodes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

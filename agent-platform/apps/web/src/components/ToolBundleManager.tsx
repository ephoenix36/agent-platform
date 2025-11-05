/**
 * Tool Bundle Manager Component
 * Manages installation, uninstallation, and display of tool bundles
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  Star, 
  Shield, 
  DollarSign, 
  Search,
  Filter,
  Grid,
  List,
  ChevronDown
} from 'lucide-react';
import type { ToolBundleV1 } from '@/types/tool-bundle.v1';
import { marketplaceTools, comingSoonTools } from '@/data/marketplace-tools';

export function ToolBundleManager() {
  const [installedTools, setInstalledTools] = useState<ToolBundleV1[]>([]);
  const [availableTools, setAvailableTools] = useState<ToolBundleV1[]>(marketplaceTools);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Simulate fetching installed and available tools
  useEffect(() => {
    // In production, this would fetch from your backend
    // For now, we're using the imported marketplace data
    setInstalledTools([
      // Example: Some tools already installed
    ]);
  }, []);

  const handleInstall = async (toolId: string) => {
    // TODO: Implement installation logic
    console.log('Installing tool:', toolId);
  };

  const handleUninstall = async (toolId: string) => {
    // TODO: Implement uninstallation logic
    console.log('Uninstalling tool:', toolId);
  };

  const filteredTools = availableTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold mb-2">Tool Marketplace</h1>
        <p className="text-gray-400">Discover and install powerful tools for your platform</p>
      </div>

      {/* Search & Filters */}
      <div className="p-6 border-b border-gray-800 space-y-4">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg 
                       focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg 
                       hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-gray-700 
                            rounded-lg shadow-lg p-4 min-w-[200px] z-10">
                <div className="space-y-2">
                  {['all', 'development', 'communication', 'analytics', 'visualization', 'ai'].map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        selectedCategory === category
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-gray-800'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-gray-800'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Installed Tools Section */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Installed Tools</h2>
        {installedTools.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No tools installed yet. Browse the marketplace below to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} installed onUninstall={handleUninstall} />
            ))}
          </div>
        )}
      </div>

      {/* Available Tools Section */}
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Available Tools ({filteredTools.length})</h2>
        
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onInstall={handleInstall} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTools.map(tool => (
              <ToolListItem key={tool.id} tool={tool} onInstall={handleInstall} />
            ))}
          </div>
        )}

        {filteredTools.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No tools found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Tool Card Component (Grid View)
function ToolCard({ 
  tool, 
  installed = false, 
  onInstall, 
  onUninstall 
}: { 
  tool: ToolBundleV1; 
  installed?: boolean;
  onInstall?: (id: string) => void;
  onUninstall?: (id: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-purple-500/50 
                    transition-all group">
      {/* Tool Icon & Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{tool.metadata.icon || '🔧'}</div>
          <div>
            <h3 className="font-semibold group-hover:text-purple-400 transition-colors">
              {tool.name}
            </h3>
            <p className="text-xs text-gray-400">{tool.author.name}</p>
          </div>
        </div>
        {tool.metadata.verified && (
          <div title="Verified">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{tool.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{tool.metadata.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          <span>{tool.metadata.downloads.toLocaleString()}</span>
        </div>
        {tool.pricing.model !== 'free' && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span className="capitalize">{tool.pricing.model}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {tool.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-gray-800 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Action Button */}
      {installed ? (
        <button
          onClick={() => onUninstall?.(tool.id)}
          className="w-full py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 
                   rounded transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Uninstall</span>
        </button>
      ) : (
        <button
          onClick={() => onInstall?.(tool.id)}
          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 
                   hover:from-purple-600 hover:to-pink-600 rounded transition-all 
                   flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Install</span>
        </button>
      )}
    </div>
  );
}

// Tool List Item Component (List View)
function ToolListItem({ 
  tool, 
  onInstall 
}: { 
  tool: ToolBundleV1;
  onInstall?: (id: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-purple-500/50 
                    transition-all flex items-center gap-4">
      <div className="text-2xl">{tool.metadata.icon || '🔧'}</div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{tool.name}</h3>
          {tool.metadata.verified && (
            <Shield className="w-4 h-4 text-blue-400" />
          )}
        </div>
        <p className="text-sm text-gray-400">{tool.description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{tool.metadata.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Download className="w-4 h-4" />
          <span>{tool.metadata.downloads.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={() => onInstall?.(tool.id)}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 
                 hover:from-purple-600 hover:to-pink-600 rounded transition-all 
                 flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>Install</span>
      </button>
    </div>
  );
}

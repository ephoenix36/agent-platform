'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ViewModesCanvas from "@/components/ViewModesCanvas";
import { ToolBundleManager } from "@/components/ToolBundleManager";
import MCPToolCreator from "@/components/MCPToolCreator";
import { CustomizableDashboard } from "@/components/CustomizableDashboardV2";
import { MCPToolsLibrary } from "@/components/MCPToolsLibrary";
import EnhancedSettingsPage from "@/components/EnhancedSettingsPage";
import { OmnibarV3 } from "@/components/OmnibarV3";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, ShoppingBag, LayoutGrid, Wrench,
  Settings, Home as HomeIcon, LogOut
} from 'lucide-react';

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'views' | 'tools' | 'settings'>('dashboard');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: HomeIcon },
    { id: 'marketplace' as const, label: 'Marketplace', icon: ShoppingBag },
    { id: 'views' as const, label: 'Views', icon: LayoutGrid },
    { id: 'tools' as const, label: 'MCP Tools', icon: Wrench },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-gray-950">
      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            Welcome, <span className="text-blue-400 font-medium">{user.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-auto">
            <CustomizableDashboard />
          </div>
        )}
        {activeTab === 'marketplace' && <ToolBundleManager />}
        {activeTab === 'views' && <ViewModesCanvas />}
        {activeTab === 'tools' && <MCPToolsLibrary />}
        {activeTab === 'settings' && <EnhancedSettingsPage />}
      </div>

      {/* OmnibarV3 - Floating minimized circle with inline voice and document fanning */}
      <OmnibarV3 />
    </main>
  );
}

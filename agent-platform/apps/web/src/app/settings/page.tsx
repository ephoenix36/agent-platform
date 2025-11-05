'use client';

import React, { useState } from 'react';
import {
  User, Bell, Shield, Palette, Database, Key,
  Globe, Users as UsersIcon, Settings as SettingsIcon
} from 'lucide-react';
import IdentityManagement from '@/components/IdentityManagement';

type SettingsTab = 'identities' | 'account' | 'notifications' | 'security' | 'appearance' | 'data';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('identities');

  const tabs = [
    { id: 'identities' as const, label: 'Identities', icon: UsersIcon, component: IdentityManagement },
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'data' as const, label: 'Data & Privacy', icon: Database },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 bg-gray-900/50 p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-purple-400" />
            Settings
          </h2>
        </div>
        
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-8 text-center">
                <p className="text-gray-400">This section is coming soon!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

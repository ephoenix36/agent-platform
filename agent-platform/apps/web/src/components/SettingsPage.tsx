/**
 * Settings Page
 * 
 * Platform settings including database integrations, API keys, and preferences
 */

'use client';

import React, { useState } from 'react';
import {
  Database, Key, Bell, Shield, Palette, Zap, Users, Globe,
  Settings as SettingsIcon, Save, RefreshCw
} from 'lucide-react';
import { DatabaseIntegration } from './database/DatabaseIntegration';
import type { DatabaseConnection } from '@/types/platform';

type SettingsTab = 'general' | 'databases' | 'api-keys' | 'notifications' | 'security' | 'appearance';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const tabs = [
    {
      id: 'general' as SettingsTab,
      label: 'General',
      icon: SettingsIcon,
      description: 'Basic platform settings',
    },
    {
      id: 'databases' as SettingsTab,
      label: 'Databases',
      icon: Database,
      description: 'Database connections',
    },
    {
      id: 'api-keys' as SettingsTab,
      label: 'API Keys',
      icon: Key,
      description: 'Manage API keys',
    },
    {
      id: 'notifications' as SettingsTab,
      label: 'Notifications',
      icon: Bell,
      description: 'Notification preferences',
    },
    {
      id: 'security' as SettingsTab,
      label: 'Security',
      icon: Shield,
      description: 'Security settings',
    },
    {
      id: 'appearance' as SettingsTab,
      label: 'Appearance',
      icon: Palette,
      description: 'Theme and display',
    },
  ];

  const handleDatabaseConnect = (connection: DatabaseConnection) => {
    setDatabases(prev => [...prev, connection]);
    setHasChanges(true);
    console.log('Database connected:', connection);
  };

  const handleSave = () => {
    // Save settings to backend
    console.log('Saving settings...');
    setHasChanges(false);
    // Show success toast
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-gray-400 mt-1">Manage your platform configuration</p>
            </div>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <nav className="space-y-1 sticky top-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-9">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        defaultValue="My Workspace"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onChange={() => setHasChanges(true)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Execution Mode
                      </label>
                      <select
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onChange={() => setHasChanges(true)}
                      >
                        <option value="sync">Synchronous</option>
                        <option value="async">Asynchronous</option>
                        <option value="streaming">Streaming</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded"
                          onChange={() => setHasChanges(true)}
                        />
                        <div>
                          <div className="font-medium text-sm">Enable Auto-Save</div>
                          <div className="text-xs text-gray-400">Automatically save changes</div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded"
                          onChange={() => setHasChanges(true)}
                        />
                        <div>
                          <div className="font-medium text-sm">Enable Analytics</div>
                          <div className="text-xs text-gray-400">Collect usage analytics</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'databases' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <DatabaseIntegration
                  onConnect={handleDatabaseConnect}
                  existingConnections={databases}
                />
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">API Keys</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Production API Key</div>
                        <div className="text-sm text-gray-400 font-mono mt-1">
                          sk_live_••••••••••••••••
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                        Regenerate
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Development API Key</div>
                        <div className="text-sm text-gray-400 font-mono mt-1">
                          sk_dev_••••••••••••••••
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                        Regenerate
                      </button>
                    </div>

                    <button className="w-full py-3 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
                      + Create New API Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-gray-400">Receive updates via email</div>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium">Workflow Completion</div>
                      <div className="text-sm text-gray-400">Notify when workflows finish</div>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium">Error Alerts</div>
                      <div className="text-sm text-gray-400">Alert on execution errors</div>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Two-Factor Authentication
                    </label>
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium">Status: Disabled</div>
                        <div className="text-sm text-gray-400">Add an extra layer of security</div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Session Timeout
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60" selected>1 hour</option>
                      <option value="240">4 hours</option>
                      <option value="never">Never</option>
                    </select>
                  </div>

                  <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-400">Security Recommendation</div>
                        <div className="text-sm text-yellow-300/80 mt-1">
                          Enable two-factor authentication and use strong API key rotation policies.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button className="p-4 bg-gray-950 border-2 border-blue-500 rounded-lg">
                        <div className="aspect-video bg-gray-800 rounded mb-2"></div>
                        <div className="text-sm font-medium">Dark</div>
                      </button>
                      <button className="p-4 bg-white border-2 border-gray-700 rounded-lg text-gray-900">
                        <div className="aspect-video bg-gray-100 rounded mb-2"></div>
                        <div className="text-sm font-medium">Light</div>
                      </button>
                      <button className="p-4 bg-gray-900 border-2 border-gray-700 rounded-lg">
                        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded mb-2"></div>
                        <div className="text-sm font-medium">Auto</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Accent Color
                    </label>
                    <div className="flex gap-3">
                      {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
                        <button
                          key={color}
                          className="w-12 h-12 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                      <option value="small">Small</option>
                      <option value="medium" selected>Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

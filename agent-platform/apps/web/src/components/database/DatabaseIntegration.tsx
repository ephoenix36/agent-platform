/**
 * Database Integration UI
 * 
 * Seamlessly connect databases to agents and workflows
 */

'use client';

import React, { useState } from 'react';
import {
  Database, Plus, Check, X, RefreshCw, AlertCircle, 
  Key, Shield, Eye, EyeOff, Link as LinkIcon, Server,
  Zap, CheckCircle, XCircle, Settings
} from 'lucide-react';
import type { DatabaseConnection } from '@/types/platform';

type DatabaseType = 'supabase' | 'mongodb' | 'sqlite' | 'postgresql' | 'mysql' | 'redis' | 'firebase';

interface DatabaseIntegrationProps {
  onConnect?: (connection: DatabaseConnection) => void;
  existingConnections?: DatabaseConnection[];
}

export function DatabaseIntegration({
  onConnect,
  existingConnections = [],
}: DatabaseIntegrationProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedType, setSelectedType] = useState<DatabaseType | null>(null);
  const [connections, setConnections] = useState<DatabaseConnection[]>(existingConnections);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const databaseTypes = [
    {
      type: 'supabase' as DatabaseType,
      name: 'Supabase',
      icon: '⚡',
      description: 'PostgreSQL database with realtime features',
      popular: true,
      fields: [
        { name: 'projectUrl', label: 'Project URL', type: 'text', placeholder: 'https://xxxxx.supabase.co' },
        { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Supabase API key' },
      ],
    },
    {
      type: 'mongodb' as DatabaseType,
      name: 'MongoDB',
      icon: '🍃',
      description: 'NoSQL document database',
      popular: true,
      fields: [
        { name: 'connectionString', label: 'Connection String', type: 'text', placeholder: 'mongodb+srv://...' },
      ],
    },
    {
      type: 'postgresql' as DatabaseType,
      name: 'PostgreSQL',
      icon: '🐘',
      description: 'Powerful open-source relational database',
      fields: [
        { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
        { name: 'port', label: 'Port', type: 'number', placeholder: '5432' },
        { name: 'database', label: 'Database', type: 'text', placeholder: 'mydb' },
        { name: 'username', label: 'Username', type: 'text' },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'ssl', label: 'Use SSL', type: 'checkbox' },
      ],
    },
    {
      type: 'mysql' as DatabaseType,
      name: 'MySQL',
      icon: '🐬',
      description: 'Popular open-source relational database',
      fields: [
        { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
        { name: 'port', label: 'Port', type: 'number', placeholder: '3306' },
        { name: 'database', label: 'Database', type: 'text' },
        { name: 'username', label: 'Username', type: 'text' },
        { name: 'password', label: 'Password', type: 'password' },
      ],
    },
    {
      type: 'sqlite' as DatabaseType,
      name: 'SQLite',
      icon: '📦',
      description: 'Lightweight file-based database',
      fields: [
        { name: 'filePath', label: 'File Path', type: 'text', placeholder: '/path/to/database.db' },
      ],
    },
    {
      type: 'redis' as DatabaseType,
      name: 'Redis',
      icon: '⚙️',
      description: 'In-memory data structure store',
      fields: [
        { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
        { name: 'port', label: 'Port', type: 'number', placeholder: '6379' },
        { name: 'password', label: 'Password', type: 'password', optional: true },
      ],
    },
    {
      type: 'firebase' as DatabaseType,
      name: 'Firebase',
      icon: '🔥',
      description: 'Google\'s app development platform',
      popular: true,
      fields: [
        { name: 'projectUrl', label: 'Project URL', type: 'text', placeholder: 'https://xxxxx.firebaseio.com' },
        { name: 'apiKey', label: 'API Key', type: 'password' },
      ],
    },
  ];

  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    permissions: {
      read: true,
      write: false,
      delete: false,
    },
  });

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('testing');

    try {
      // Simulate API call to test connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Randomly succeed or fail for demo
      const success = Math.random() > 0.3;
      
      if (success) {
        setConnectionStatus('success');
        setTimeout(() => setConnectionStatus('idle'), 3000);
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!selectedType) return;

    const connection: DatabaseConnection = {
      id: `db-${Date.now()}`,
      name: formData.name,
      type: selectedType,
      config: formData,
      permissions: formData.permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastConnected: new Date(),
    };

    setConnections([...connections, connection]);
    onConnect?.(connection);
    
    // Reset form
    setFormData({
      name: '',
      permissions: {
        read: true,
        write: false,
        delete: false,
      },
    });
    setSelectedType(null);
    setIsAddingNew(false);
  };

  const handleRemoveConnection = (id: string) => {
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const selectedDbType = databaseTypes.find(db => db.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Database Integrations
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Connect databases to your agents and workflows
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      {/* Existing Connections */}
      {connections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => {
            const dbType = databaseTypes.find(db => db.type === connection.type);
            return (
              <div
                key={connection.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dbType?.icon}</span>
                    <div>
                      <div className="font-semibold">{connection.name}</div>
                      <div className="text-xs text-gray-500">{dbType?.name}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveConnection(connection.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-gray-400" />
                    <div className="flex gap-2">
                      {connection.permissions.read && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                          Read
                        </span>
                      )}
                      {connection.permissions.write && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          Write
                        </span>
                      )}
                      {connection.permissions.delete && (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                          Delete
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {connection.lastConnected && (
                    <div className="text-xs text-gray-500">
                      Last used: {connection.lastConnected.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Connection */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">
                {selectedType ? `Configure ${selectedDbType?.name}` : 'Select Database'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setSelectedType(null);
                  setConnectionStatus('idle');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {databaseTypes.map((db) => (
                    <button
                      key={db.type}
                      onClick={() => setSelectedType(db.type)}
                      className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <span className="text-3xl">{db.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {db.name}
                          {db.popular && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {db.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Connection Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Connection Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My Database"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Database-specific fields */}
                  {selectedDbType?.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {!('optional' in field && field.optional) && '*'}
                      </label>
                      
                      {field.type === 'checkbox' ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData[field.name] || false}
                            onChange={(e) =>
                              setFormData({ ...formData, [field.name]: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm">Enable</span>
                        </label>
                      ) : (
                        <div className="relative">
                          <input
                            type={field.type === 'password' && !showPassword[field.name] ? 'password' : field.type}
                            value={formData[field.name] || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, [field.name]: e.target.value })
                            }
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword({
                                  ...showPassword,
                                  [field.name]: !showPassword[field.name],
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword[field.name] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.read}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, read: e.target.checked },
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Read - Query and retrieve data</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.write}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, write: e.target.checked },
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Write - Insert and update data</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.delete}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, delete: e.target.checked },
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-red-600">Delete - Remove data (use with caution)</span>
                      </label>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="border-t border-gray-200 pt-6">
                    <button
                      onClick={handleTestConnection}
                      disabled={testingConnection || !formData.name}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connectionStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                      {connectionStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {connectionStatus === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                      {connectionStatus === 'idle' && <Zap className="w-4 h-4" />}
                      <span>
                        {connectionStatus === 'testing' && 'Testing Connection...'}
                        {connectionStatus === 'success' && 'Connection Successful!'}
                        {connectionStatus === 'error' && 'Connection Failed'}
                        {connectionStatus === 'idle' && 'Test Connection'}
                      </span>
                    </button>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Security Note</p>
                      <p>
                        Your credentials are encrypted and stored securely. We recommend using
                        read-only credentials when possible and enabling IP whitelisting on your
                        database.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedType && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between">
                <button
                  onClick={() => setSelectedType(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveConnection}
                  disabled={!formData.name || connectionStatus === 'error'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Save Connection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {connections.length === 0 && !isAddingNew && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Databases Connected
          </h3>
          <p className="text-gray-500 mb-6">
            Connect a database to use it in your agents and workflows
          </p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Database
          </button>
        </div>
      )}
    </div>
  );
}

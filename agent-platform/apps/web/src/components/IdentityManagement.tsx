/**
 * Identity Management Dashboard
 * Allows users to create, manage, and switch between multiple identities
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Plus, Edit2, Trash2, Check, X, Eye, EyeOff,
  Globe, Lock, Users as UsersIcon, Shield, Star
} from 'lucide-react';

interface Identity {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  is_default: boolean;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
}

interface IdentityCardProps {
  identity: Identity;
  onEdit: (identity: Identity) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

function IdentityCard({ identity, onEdit, onDelete, onSetDefault }: IdentityCardProps) {
  const visibilityIcons = {
    public: <Globe className="w-4 h-4" />,
    friends: <UsersIcon className="w-4 h-4" />,
    private: <Lock className="w-4 h-4" />,
  };

  const visibilityColors = {
    public: 'text-green-400 bg-green-500/10 border-green-500/30',
    friends: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    private: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {identity.display_name.charAt(0).toUpperCase()}
          </div>
          
          {/* Name & Status */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{identity.display_name}</h3>
              {identity.is_default && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
                  <Star className="w-3 h-3 fill-purple-300" />
                  Default
                </div>
              )}
            </div>
            <div className={`flex items-center gap-1 mt-1 text-xs ${visibilityColors[identity.visibility]} px-2 py-1 rounded border w-fit`}>
              {visibilityIcons[identity.visibility]}
              <span className="capitalize">{identity.visibility}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(identity)}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
            title="Edit identity"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
          </button>
          {!identity.is_default && (
            <>
              <button
                onClick={() => onSetDefault(identity.id)}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Set as default"
              >
                <Star className="w-4 h-4 text-purple-400" />
              </button>
              <button
                onClick={() => onDelete(identity.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete identity"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      {identity.bio && (
        <p className="text-sm text-gray-400 mb-3">{identity.bio}</p>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
        Created {new Date(identity.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}

interface IdentityFormProps {
  identity?: Identity;
  onSave: (data: Partial<Identity>) => void;
  onCancel: () => void;
}

function IdentityForm({ identity, onSave, onCancel }: IdentityFormProps) {
  const [formData, setFormData] = useState({
    display_name: identity?.display_name || '',
    bio: identity?.bio || '',
    visibility: identity?.visibility || 'public' as 'public' | 'friends' | 'private',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">
          {identity ? 'Edit Identity' : 'Create New Identity'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              placeholder="Tell others about this identity..."
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['public', 'friends', 'private'] as const).map((vis) => (
                <button
                  key={vis}
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: vis })}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    formData.visibility === vis
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {vis === 'public' && <Globe className="w-4 h-4" />}
                    {vis === 'friends' && <UsersIcon className="w-4 h-4" />}
                    {vis === 'private' && <Lock className="w-4 h-4" />}
                    <span className="text-xs capitalize">{vis}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.visibility === 'public' && 'Visible to everyone'}
              {formData.visibility === 'friends' && 'Visible to friends only'}
              {formData.visibility === 'private' && 'Only visible to you'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {identity ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IdentityManagement() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | undefined>();

  useEffect(() => {
    fetchIdentities();
  }, []);

  const fetchIdentities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('http://localhost:8000/identities/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch identities');
      }

      const data = await response.json();
      setIdentities(data);
    } catch (err) {
      console.error('Error fetching identities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load identities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIdentity = async (data: Partial<Identity>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/identities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create identity');
      }

      await fetchIdentities();
      setShowForm(false);
    } catch (err) {
      console.error('Error creating identity:', err);
      setError(err instanceof Error ? err.message : 'Failed to create identity');
    }
  };

  const handleSetDefault = async (identityId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/identities/${identityId}/set-default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to set default identity');
      }

      await fetchIdentities();
    } catch (err) {
      console.error('Error setting default:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default identity');
    }
  };

  const handleDelete = async (identityId: string) => {
    if (!confirm('Are you sure you want to delete this identity?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/identities/${identityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete identity');
      }

      await fetchIdentities();
    } catch (err) {
      console.error('Error deleting identity:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete identity');
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 overflow-auto">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Identity Management</h1>
            <p className="text-gray-400">
              Create and manage multiple identities for different contexts and platforms
            </p>
          </div>
          <button
            onClick={() => {
              setEditingIdentity(undefined);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-5 h-5" />
            Create Identity
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <strong>Multiple Identities:</strong> Like Discord, you can have different display names, 
              avatars, and visibility settings for different platforms and communities. Switch between them 
              seamlessly while maintaining one account.
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading identities...</p>
          </div>
        </div>
      ) : (
        /* Identities Grid */
        <div className="max-w-6xl mx-auto">
          {identities.length === 0 ? (
            <div className="text-center py-20">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No identities yet</h3>
              <p className="text-gray-500 mb-6">Create your first identity to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Identity
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {identities.map((identity) => (
                <IdentityCard
                  key={identity.id}
                  identity={identity}
                  onEdit={(id) => {
                    setEditingIdentity(id);
                    setShowForm(true);
                  }}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <IdentityForm
          identity={editingIdentity}
          onSave={handleCreateIdentity}
          onCancel={() => {
            setShowForm(false);
            setEditingIdentity(undefined);
          }}
        />
      )}
    </div>
  );
}

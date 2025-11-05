/**
 * Sharing & Privacy Controls
 * 
 * Google Drive-style sharing interface for apps, agents, and workflows
 */

'use client';

import React, { useState } from 'react';
import {
  Globe, Lock, Users, Link as LinkIcon, Mail, UserPlus, 
  X, Check, Copy, Settings, Shield, Eye, Edit3, Trash2,
  Clock, Download, Share2, AlertCircle
} from 'lucide-react';
import type { SharingConfig, PrivacyLevel, SharePermission } from '@/types/platform';

interface SharingControlsProps {
  itemId: string;
  itemType: 'agent' | 'workflow' | 'app';
  itemName: string;
  currentConfig?: SharingConfig;
  currentPrivacy?: PrivacyLevel;
  onUpdate?: (config: SharingConfig, privacy: PrivacyLevel) => void;
}

export function SharingControls({
  itemId,
  itemType,
  itemName,
  currentConfig,
  currentPrivacy = 'private',
  onUpdate,
}: SharingControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyLevel>(currentPrivacy);
  const [config, setConfig] = useState<SharingConfig>(
    currentConfig || {
      permissions: [],
      linkSharing: {
        enabled: false,
        permission: 'view',
        requireAuth: true,
      },
      allowFork: true,
      allowCopy: true,
      allowExport: false,
      listed: privacy === 'public',
      searchable: privacy === 'public',
    }
  );
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<SharePermission>('view');
  const [linkCopied, setLinkCopied] = useState(false);

  const privacyOptions = [
    {
      value: 'private' as PrivacyLevel,
      label: 'Private',
      description: 'Only you can access',
      icon: Lock,
      color: 'text-gray-600',
    },
    {
      value: 'unlisted' as PrivacyLevel,
      label: 'Unlisted',
      description: 'Anyone with the link',
      icon: LinkIcon,
      color: 'text-blue-600',
    },
    {
      value: 'restricted' as PrivacyLevel,
      label: 'Restricted',
      description: 'Specific people',
      icon: Users,
      color: 'text-orange-600',
    },
    {
      value: 'public' as PrivacyLevel,
      label: 'Public',
      description: 'Anyone on the internet',
      icon: Globe,
      color: 'text-green-600',
    },
  ];

  const permissionOptions: { value: SharePermission; label: string; description: string }[] = [
    {
      value: 'view',
      label: 'Viewer',
      description: 'Can view only',
    },
    {
      value: 'comment',
      label: 'Commenter',
      description: 'Can view and comment',
    },
    {
      value: 'edit',
      label: 'Editor',
      description: 'Can view and edit',
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage sharing',
    },
  ];

  const handlePrivacyChange = (newPrivacy: PrivacyLevel) => {
    setPrivacy(newPrivacy);
    
    const updatedConfig = {
      ...config,
      listed: newPrivacy === 'public',
      searchable: newPrivacy === 'public',
      linkSharing: {
        ...config.linkSharing!,
        enabled: newPrivacy !== 'private',
        requireAuth: newPrivacy !== 'public',
      },
    };
    
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig, newPrivacy);
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    
    const newPermission = {
      email: inviteEmail,
      permission: invitePermission,
    };
    
    const updatedConfig = {
      ...config,
      permissions: [...config.permissions, newPermission],
    };
    
    setConfig(updatedConfig);
    setInviteEmail('');
    onUpdate?.(updatedConfig, privacy);
  };

  const handleRemovePermission = (index: number) => {
    const updatedConfig = {
      ...config,
      permissions: config.permissions.filter((_, i) => i !== index),
    };
    
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig, privacy);
  };

  const handleUpdatePermission = (index: number, newPermission: SharePermission) => {
    const updatedConfig = {
      ...config,
      permissions: config.permissions.map((p, i) =>
        i === index ? { ...p, permission: newPermission } : p
      ),
    };
    
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig, privacy);
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/${itemType}/${itemId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const toggleLinkSharing = () => {
    const updatedConfig = {
      ...config,
      linkSharing: {
        ...config.linkSharing!,
        enabled: !config.linkSharing?.enabled,
      },
    };
    
    setConfig(updatedConfig);
    onUpdate?.(updatedConfig, privacy);
  };

  const currentPrivacyOption = privacyOptions.find(opt => opt.value === privacy);
  const Icon = currentPrivacyOption?.icon || Lock;

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Share "{itemName}"</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Privacy Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Privacy Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {privacyOptions.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handlePrivacyChange(option.value)}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                          privacy === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <OptionIcon className={`w-5 h-5 mt-0.5 ${option.color}`} />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{option.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {option.description}
                          </div>
                        </div>
                        {privacy === option.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Link Sharing */}
              {privacy !== 'private' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">Link Sharing</span>
                    </div>
                    <button
                      onClick={toggleLinkSharing}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.linkSharing?.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.linkSharing?.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.linkSharing?.enabled && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/${itemType}/${itemId}`}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
                        />
                        <button
                          onClick={copyShareLink}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {linkCopied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.linkSharing?.requireAuth}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              linkSharing: {
                                ...config.linkSharing!,
                                requireAuth: e.target.checked,
                              },
                            })
                          }
                          className="rounded"
                        />
                        <label className="text-sm text-gray-600">
                          Require sign-in to access
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Invite People */}
              {(privacy === 'restricted' || privacy === 'unlisted') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Invite People
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={invitePermission}
                      onChange={(e) => setInvitePermission(e.target.value as SharePermission)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {permissionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={!inviteEmail}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Shared With */}
                  {config.permissions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Shared with {config.permissions.length}{' '}
                        {config.permissions.length === 1 ? 'person' : 'people'}
                      </div>
                      {config.permissions.map((perm, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {perm.email?.[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{perm.email}</div>
                              {perm.expiresAt && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Expires {new Date(perm.expiresAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={perm.permission}
                              onChange={(e) =>
                                handleUpdatePermission(index, e.target.value as SharePermission)
                              }
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {permissionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRemovePermission(index)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Settings */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-sm">Additional Settings</h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.allowFork}
                      onChange={(e) =>
                        setConfig({ ...config, allowFork: e.target.checked })
                      }
                      className="rounded"
                    />
                    <div>
                      <div className="text-sm font-medium">Allow Forking</div>
                      <div className="text-xs text-gray-500">
                        Others can create their own copy
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.allowCopy}
                      onChange={(e) =>
                        setConfig({ ...config, allowCopy: e.target.checked })
                      }
                      className="rounded"
                    />
                    <div>
                      <div className="text-sm font-medium">Allow Copying</div>
                      <div className="text-xs text-gray-500">
                        Others can duplicate this {itemType}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.allowExport}
                      onChange={(e) =>
                        setConfig({ ...config, allowExport: e.target.checked })
                      }
                      className="rounded"
                    />
                    <div>
                      <div className="text-sm font-medium">Allow Export</div>
                      <div className="text-xs text-gray-500">
                        Others can download as file
                      </div>
                    </div>
                  </label>

                  {privacy === 'public' && (
                    <>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.listed}
                          onChange={(e) =>
                            setConfig({ ...config, listed: e.target.checked })
                          }
                          className="rounded"
                        />
                        <div>
                          <div className="text-sm font-medium">List in Marketplace</div>
                          <div className="text-xs text-gray-500">
                            Show in public listings
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.searchable}
                          onChange={(e) =>
                            setConfig({ ...config, searchable: e.target.checked })
                          }
                          className="rounded"
                        />
                        <div>
                          <div className="text-sm font-medium">Searchable</div>
                          <div className="text-xs text-gray-500">
                            Allow search engines to index
                          </div>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

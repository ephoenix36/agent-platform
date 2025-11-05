/**
 * API Key Display Component
 * 
 * Displays API key with secure masking, copy functionality, and regeneration controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Shield
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import type { APIKey } from '@/lib/api';
import { format } from 'date-fns';

interface APIKeyDisplayProps {
  onRefresh: () => void;
}

export const APIKeyDisplay: React.FC<APIKeyDisplayProps> = ({ onRefresh }) => {
  const [apiKey, setApiKey] = useState<APIKey | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);

  useEffect(() => {
    fetchAPIKey();
  }, []);

  /**
   * Fetch current API key
   */
  const fetchAPIKey = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.getAPIKey();
      
      if (response.success && response.data) {
        setApiKey(response.data);
      } else {
        setError(response.error || 'Failed to load API key');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Regenerate API key
   */
  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.billing.regenerateAPIKey();
      
      if (response.success && response.data) {
        setApiKey(response.data.api_key);
        setNewKey(response.data.key); // Full key shown only once
        setShowConfirmRegenerate(false);
        onRefresh();
      } else {
        setError(response.error || 'Failed to regenerate API key');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy API key to clipboard
   */
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  /**
   * Mask API key for display
   */
  const maskKey = (keyPrefix: string): string => {
    // Show format: sk_live_abc...xyz (first 12 chars + ... + last 4 chars)
    if (keyPrefix.length < 16) return keyPrefix + '...';
    return `${keyPrefix.substring(0, 12)}...${keyPrefix.substring(keyPrefix.length - 4)}`;
  };

  /**
   * Dismiss new key warning
   */
  const handleDismissNewKey = () => {
    setNewKey(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!apiKey) return null;

  return (
    <div className="space-y-6">
      {/* New Key Alert (shown only after regeneration) */}
      {newKey && (
        <Alert className="bg-amber-50 border-amber-200">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-3">
              <div className="font-semibold">⚠️ Save this key now! It won't be shown again.</div>
              <div className="bg-white border border-amber-300 rounded-lg p-3 font-mono text-sm break-all">
                {newKey}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCopy(newKey)}
                  variant="outline"
                  className="border-amber-600 text-amber-800 hover:bg-amber-100"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Key'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleDismissNewKey}
                  variant="outline"
                  className="border-amber-600 text-amber-800 hover:bg-amber-100"
                >
                  I've Saved It
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Your API Key
              </CardTitle>
              <CardDescription>
                Use this key to authenticate your API requests
              </CardDescription>
            </div>
            <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
              {apiKey.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Display */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 border rounded-lg p-3 font-mono text-sm break-all">
                {showFullKey && newKey ? newKey : maskKey(apiKey.key_prefix)}
              </div>
              <Button
                variant="outline"
                onClick={() => handleCopy(newKey || apiKey.key_prefix)}
                size="sm"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Shield className="w-3 h-3" />
              <span>Keep your API key secure. Never share it publicly or commit it to version control.</span>
            </div>
          </div>

          {/* Key Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created
              </div>
              <div className="font-medium">
                {format(new Date(apiKey.created_at), 'MMM dd, yyyy')}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Last Used
              </div>
              <div className="font-medium">
                {apiKey.last_used_at 
                  ? format(new Date(apiKey.last_used_at), 'MMM dd, yyyy HH:mm')
                  : 'Never'
                }
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-gray-600">Total Usage</div>
              <div className="font-medium text-lg">
                {apiKey.usage_count.toLocaleString()} calls
              </div>
            </div>

            {apiKey.expires_at && (
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Expires</div>
                <div className="font-medium">
                  {format(new Date(apiKey.expires_at), 'MMM dd, yyyy')}
                </div>
              </div>
            )}
          </div>

          {/* Rate Limits */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Rate Limits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-600 font-medium mb-1">Per Minute</div>
                <div className="text-2xl font-bold text-blue-900">
                  {apiKey.rate_limit.per_minute}
                </div>
                <div className="text-xs text-blue-700">requests/min</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-purple-600 font-medium mb-1">Per Month</div>
                <div className="text-2xl font-bold text-purple-900">
                  {apiKey.rate_limit.per_month === -1 
                    ? '∞' 
                    : apiKey.rate_limit.per_month.toLocaleString()
                  }
                </div>
                <div className="text-xs text-purple-700">requests/month</div>
              </div>
            </div>
          </div>

          {/* Usage Example */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Usage Example</h4>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <div className="space-y-2">
                <div className="text-gray-400"># Python</div>
                <div>
                  <span className="text-blue-400">import</span> requests
                </div>
                <div className="mt-2">
                  headers = {'{'}
                </div>
                <div className="ml-4">
                  <span className="text-green-400">"X-API-Key"</span>: <span className="text-green-400">"{maskKey(apiKey.key_prefix)}"</span>
                </div>
                <div>{'}'}</div>
                <div className="mt-2">
                  response = requests.post(
                </div>
                <div className="ml-4">
                  <span className="text-green-400">"https://api.sotatools.com/v1/evaluate"</span>,
                </div>
                <div className="ml-4">
                  headers=headers,
                </div>
                <div className="ml-4">
                  json=data
                </div>
                <div>)</div>
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowConfirmRegenerate(true)}
              disabled={loading}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate API Key
            </Button>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Regenerating will invalidate your current key. Update your applications immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Store API keys in environment variables, never in your code</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Use different keys for development and production environments</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Regenerate keys immediately if you suspect they've been compromised</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Never commit API keys to version control (add to .gitignore)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Implement proper error handling to avoid exposing keys in logs</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Modal */}
      {showConfirmRegenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                Regenerate API Key
              </CardTitle>
              <CardDescription>
                This action cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">Warning:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your current API key will be immediately invalidated</li>
                      <li>All applications using the old key will stop working</li>
                      <li>You must update all integrations with the new key</li>
                      <li>The new key will only be shown once</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Yes, Regenerate Key
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmRegenerate(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Folder,
  Trash2,
  LogOut,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SCOPE_DRIVE_FILE, SCOPE_DRIVE_READONLY } from '../../services/auth';
import { clearAllTracks } from '../../services/db';

interface SettingsScreenProps {
  onClose: () => void;
  folderName?: string | null;
  onSelectFolderClick: () => void;
  onRefreshLibrary: () => void;
  isScanning: boolean;
  trackCount: number;
  onLibraryCleared: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClose,
  folderName,
  onSelectFolderClick,
  onRefreshLibrary,
  isScanning,
  trackCount,
  onLibraryCleared,
}) => {
  const {
    isAuthenticated,
    user,
    signOutUser,
    activeScope,
    config,
    updateConfig,
    signIn,
    switchScope,
  } = useAuth();

  const [clientId, setClientId] = useState(config.clientId);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [appId, setAppId] = useState(config.appId || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(clientId, apiKey, appId);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearCache = async () => {
    if (confirm('Clear local metadata cache? Your files in Google Drive will not be affected.')) {
      setIsClearing(true);
      try {
        await clearAllTracks();
        onLibraryCleared();
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Settings & Security</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Account & Connection */}
          <div className="bg-neutral-950/70 border border-neutral-850 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Google Account & Drive
            </h3>

            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-11 h-11 rounded-full border border-neutral-700"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white text-sm">{user.name}</p>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOutUser}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-200">Not signed in</p>
                  <p className="text-xs text-neutral-400">Connect to stream from your Google Drive</p>
                </div>
                <button
                  onClick={() => signIn(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Sign In with Google
                </button>
              </div>
            )}

            {/* Folder selection state */}
            <div className="border-t border-neutral-850 pt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <Folder className="w-4 h-4 text-emerald-400" />
                <span className="text-neutral-300">
                  {folderName ? `Folder: ${folderName}` : 'No folder selected'}
                </span>
              </div>
              <button
                onClick={onSelectFolderClick}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                {folderName ? 'Change Folder' : 'Select Folder'}
              </button>
            </div>
          </div>

          {/* Active OAuth Scope Status */}
          <div className="bg-neutral-950/70 border border-neutral-850 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              OAuth 2.0 Scope Evaluation
            </h3>
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {activeScope}
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                {activeScope === SCOPE_DRIVE_FILE
                  ? 'Currently using drive.file (least privilege). If folder child traversal fails on pre-existing files, switch to drive.readonly.'
                  : 'Currently using drive.readonly. Grants read-only access to browse music folders without write permissions.'}
              </p>
            </div>
            {activeScope === SCOPE_DRIVE_FILE && (
              <button
                onClick={() => switchScope(SCOPE_DRIVE_READONLY)}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Switch to drive.readonly (if subfolders are missing)
              </button>
            )}
          </div>

          {/* Google Cloud API Credentials */}
          <form
            onSubmit={handleSaveConfig}
            className="bg-neutral-950/70 border border-neutral-850 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Google Cloud Credentials
                </h3>
              </div>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400">
              Provide your Google OAuth Web Client ID and Google Picker API Key (or configure them in{' '}
              <code className="text-neutral-300">.env</code>).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  OAuth Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Google Picker API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="e.g. AIzaSy..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Project Number / App ID (Optional)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
            >
              Save Credentials
            </button>
          </form>

          {/* Library Cache & Maintenance */}
          <div className="bg-neutral-950/70 border border-neutral-855 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Library Storage & Cache
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">Cached Audio Tracks:</span>
              <span className="font-bold text-white font-mono">{trackCount} tracks</span>
            </div>
            <div className="pt-2 flex flex-wrap gap-2">
              {folderName && (
                <button
                  onClick={onRefreshLibrary}
                  disabled={isScanning}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Refresh Library Now'}</span>
                </button>
              )}
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearing ? 'Clearing...' : 'Clear Local Metadata Cache'}</span>
              </button>
            </div>
          </div>

          {/* Security & Privacy Guarantee */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-xs uppercase tracking-wider">
                Security Guarantee
              </h4>
            </div>
            <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
              <li>OAuth tokens are kept strictly in memory; never saved to disk or storage.</li>
              <li>Read-only Google Drive operations. Zero files are uploaded, modified, or deleted.</li>
              <li>Zero telemetry, analytics, or third-party tracking.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

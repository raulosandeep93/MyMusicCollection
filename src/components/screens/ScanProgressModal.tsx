import React from 'react';
import { Loader2, Music2, Folder, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ScanProgress } from '../../services/drive';
import { SCOPE_DRIVE_READONLY } from '../../services/auth';

interface ScanProgressModalProps {
  isOpen: boolean;
  isScanning: boolean;
  progress: ScanProgress | null;
  error: string | null;
  isScopeError: boolean;
  onClose: () => void;
  onUpgradeScope: (scope: string) => void;
}

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  isOpen,
  isScanning,
  progress,
  error,
  isScopeError,
  onClose,
  onUpgradeScope,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3">
          {isScanning ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-white">
              {isScanning
                ? 'Scanning Music Folder'
                : error
                ? 'Scan Interrupted'
                : 'Library Scan Complete'}
            </h3>
            <p className="text-xs text-neutral-400">
              {isScanning
                ? 'Discovering audio tracks and subfolders in Google Drive...'
                : error
                ? 'Could not complete folder traversal'
                : `Successfully indexed ${progress?.foundSongs || 0} songs`}
            </p>
          </div>
        </div>

        {/* Live Counters */}
        {progress && (
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center space-x-3">
              <Folder className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">Folders</p>
                <p className="text-base font-bold text-white font-mono">{progress.scannedFolders}</p>
              </div>
            </div>
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center space-x-3">
              <Music2 className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">Songs Found</p>
                <p className="text-base font-bold text-white font-mono">{progress.foundSongs}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Folder Path */}
        {isScanning && progress?.currentFolder && (
          <div className="text-xs text-neutral-400 truncate bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850">
            <span className="text-neutral-400">Current: </span>
            <span className="text-neutral-200 font-mono">{progress.currentFolder}</span>
          </div>
        )}

        {/* Scope Limitation Warning & Upgrade Path */}
        {error && isScopeError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Google Drive Scope Limitation</span>
            </div>
            <p className="leading-relaxed text-neutral-300">
              Under Google's narrowest permission (<code className="text-amber-300 font-mono">drive.file</code>), Google Drive API does not permit enumerating pre-existing files uploaded prior to this app.
            </p>
            <p className="leading-relaxed text-neutral-300">
              To browse and stream your music library, authorize the least-privileged alternative: <strong className="text-white">drive.readonly</strong> (strictly read-only; no modification or upload rights).
            </p>
            <div className="pt-2">
              <button
                onClick={() => onUpgradeScope(SCOPE_DRIVE_READONLY)}
                className="w-full py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition shadow-md"
              >
                Authorize drive.readonly & Retry Scan
              </button>
            </div>
          </div>
        )}

        {error && !isScopeError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <p className="font-semibold mb-1">Error Details:</p>
            <p className="font-mono text-[11px] break-words">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          {!isScanning && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

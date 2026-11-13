import React, { useState } from 'react';
import { ShieldCheck, LogIn, X, AlertCircle, Disc3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { signIn, isLoading, error, config } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLocalError(null);
    if (!config.clientId) {
      setLocalError('Google Client ID is missing. Please enter it in Settings.');
      return;
    }

    const success = await signIn(true);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Disc3 className="w-8 h-8 animate-[spin_8s_linear_infinite]" />
          </div>

          <h2 className="text-xl font-bold text-white">Sign in to Google Drive</h2>
          <p className="text-xs text-neutral-400 max-w-xs">
            Connect to select your music folder and stream audio directly to your device.
          </p>
        </div>

        {/* Security Reassurance Box */}
        <div className="my-5 p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 space-y-2 text-xs text-neutral-300 text-left">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Strict Privacy & Read-Only Access</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            We request the narrowest possible permission to stream audio from your chosen folder. We cannot edit, delete, or upload files to your Google Drive.
          </p>
        </div>

        {/* Error notice */}
        {(error || localError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{localError || error}</p>
              {!config.clientId && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="text-emerald-400 underline font-semibold mt-1 inline-block"
                >
                  Configure Client ID in Settings &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 active:scale-98 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


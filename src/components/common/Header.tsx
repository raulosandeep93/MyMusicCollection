import React from 'react';
import { Settings, Folder, UserCircle, LogIn, Disc3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  folderName?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenAuth, folderName }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900/60 pt-safe">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Disc3 className="w-5 h-5 animate-[spin_8s_linear_infinite]" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            CloudPlayer
          </span>
          {folderName && (
            <div className="flex items-center space-x-1 text-[11px] text-neutral-400">
              <Folder className="w-3 h-3 text-emerald-500" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{folderName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-neutral-700"
              />
            ) : (
              <UserCircle className="w-7 h-7 text-neutral-400" />
            )}
            <span className="hidden md:inline text-xs font-medium text-neutral-300">
              {user.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Connect</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

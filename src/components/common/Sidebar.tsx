import React from 'react';
import { Home, Search, Library, Disc3, Heart, ListMusic, Cloud, HardDrive } from 'lucide-react';
import type { NavTab } from './BottomNav';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  folderName?: string | null;
  onSelectFolderClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  folderName,
  onSelectFolderClick,
}) => {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-neutral-950 border-r border-neutral-900 p-4 shrink-0">
      {/* Brand */}
      <div className="flex items-center space-x-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Disc3 className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            CloudPlayer
          </h1>
          <p className="text-[11px] text-neutral-400">Personal Drive Streamer</p>
        </div>
      </div>

      {/* Main Nav */}
      <div className="space-y-1 mb-6">
        <button
          onClick={() => onTabChange('home')}
          className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            currentTab === 'home'
              ? 'bg-neutral-800 text-emerald-400'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onTabChange('search')}
          className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            currentTab === 'search'
              ? 'bg-neutral-800 text-emerald-400'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        <button
          onClick={() => onTabChange('library')}
          className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            currentTab === 'library'
              ? 'bg-neutral-800 text-emerald-400'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Library className="w-5 h-5" />
          <span>Your Library</span>
        </button>
      </div>

      {/* Quick shortcuts */}
      <div className="border-t border-neutral-900 pt-4 mb-4">
        <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          Collections
        </p>
        <div className="space-y-1">
          <button
            onClick={() => onTabChange('library')}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <Heart className="w-4 h-4 text-emerald-500" />
            <span>Favourites</span>
          </button>
          <button
            onClick={() => onTabChange('library')}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <ListMusic className="w-4 h-4 text-teal-400" />
            <span>Playlists</span>
          </button>
        </div>
      </div>

      {/* Drive Source Status */}
      <div className="mt-auto border-t border-neutral-900 pt-4">
        <div className="bg-neutral-900/70 rounded-xl p-3 border border-neutral-800/80">
          <div className="flex items-center space-x-2 text-xs text-neutral-400 mb-1.5">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-neutral-300">Google Drive Source</span>
          </div>
          {folderName ? (
            <div className="flex items-center space-x-1.5 text-xs text-neutral-300 truncate mb-2">
              <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{folderName}</span>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 mb-2">No music folder selected yet.</p>
          )}
          <button
            onClick={onSelectFolderClick}
            className="w-full text-xs font-medium py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition text-center"
          >
            {folderName ? 'Change Folder' : 'Select Folder'}
          </button>
        </div>
      </div>
    </aside>
  );
};

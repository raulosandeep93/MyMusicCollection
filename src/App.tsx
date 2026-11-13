import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Header } from './components/common/Header';
import { BottomNav, type NavTab } from './components/common/BottomNav';
import { Sidebar } from './components/common/Sidebar';
import { MiniPlayer } from './components/player/MiniPlayer';
import { NowPlayingModal } from './components/player/NowPlayingModal';
import { HomeScreen } from './components/screens/HomeScreen';
import { SearchScreen } from './components/screens/SearchScreen';
import { LibraryScreen } from './components/screens/LibraryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AuthModal } from './components/screens/AuthModal';
import { AlbumDetailModal } from './components/screens/AlbumDetailModal';
import { ArtistDetailModal } from './components/screens/ArtistDetailModal';
import type { Album, Artist } from './types/music';
import { getAllTracks, getSetting } from './services/db';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const [folderName, setFolderName] = useState<string | null>(null);
  const [trackCount, setTrackCount] = useState<number>(0);

  const refreshLibraryStats = useCallback(async () => {
    const tracks = await getAllTracks();
    setTrackCount(tracks.length);
    const savedFolderName = await getSetting<string | null>('selected_folder_name', null);
    setFolderName(savedFolderName);
  }, []);

  useEffect(() => {
    refreshLibraryStats();
  }, [refreshLibraryStats]);

  const handleSelectFolderClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    // Folder picker trigger (will be wired to Google Picker in Phase 2)
    setIsSettingsOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        folderName={folderName}
        onSelectFolderClick={handleSelectFolderClick}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          folderName={folderName}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'home' && (
            <HomeScreen
              onSelectFolderClick={handleSelectFolderClick}
              folderName={folderName}
            />
          )}

          {currentTab === 'search' && (
            <SearchScreen
              onSelectAlbum={setSelectedAlbum}
              onSelectArtist={setSelectedArtist}
            />
          )}

          {currentTab === 'library' && (
            <LibraryScreen
              onSelectAlbum={setSelectedAlbum}
              onSelectArtist={setSelectedArtist}
            />
          )}
        </main>

        {/* Persistent Mini Player */}
        <MiniPlayer />

        {/* Mobile Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>

      {/* Modals & Overlays */}
      <NowPlayingModal />

      {isSettingsOpen && (
        <SettingsScreen
          onClose={() => setIsSettingsOpen(false)}
          folderName={folderName}
          onSelectFolderClick={handleSelectFolderClick}
          trackCount={trackCount}
          onLibraryCleared={refreshLibraryStats}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <AlbumDetailModal album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      <ArtistDetailModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </AuthProvider>
  );
}

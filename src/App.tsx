import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
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
import { PlaylistDetailModal } from './components/screens/PlaylistDetailModal';
import { AddToPlaylistModal } from './components/common/AddToPlaylistModal';
import { ScanProgressModal } from './components/screens/ScanProgressModal';
import type { Album, Artist, Playlist, Track } from './types/music';
import { getAllTracks, getSetting } from './services/db';
import { openFolderPicker } from './services/picker';
import {
  scanDriveMusicFolder,
  refreshMusicLibrary,
  DrivePermissionError,
  type ScanProgress,
} from './services/drive';

const MainApp: React.FC = () => {
  const { isAuthenticated, switchScope, activeScope } = useAuth();
  const { restoreTrack } = usePlayer();

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [trackForAddToPlaylist, setTrackForAddToPlaylist] = useState<Track | null>(null);

  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [trackCount, setTrackCount] = useState<number>(0);
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  // Scan progress state
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScopeError, setIsScopeError] = useState<boolean>(false);

  const refreshLibraryStats = useCallback(async () => {
    const tracks = await getAllTracks();
    setAllTracks(tracks);
    setTrackCount(tracks.length);
    const savedFolderName = await getSetting<string | null>('selected_folder_name', null);
    const savedFolderId = await getSetting<string | null>('selected_folder_id', null);
    setFolderName(savedFolderName);
    setFolderId(savedFolderId);

    // Restore last played track and position if available
    const lastTrackId = await getSetting<string | null>('last_played_track_id', null);
    const lastPos = await getSetting<number>('last_played_position', 0);
    if (lastTrackId) {
      const found = tracks.find((t) => t.id === lastTrackId);
      if (found) {
        restoreTrack(found, lastPos);
      }
    }
  }, [restoreTrack]);

  useEffect(() => {
    refreshLibraryStats();
  }, [refreshLibraryStats]);

  const runScan = async (targetFolderId: string, targetFolderName: string) => {
    setIsScanModalOpen(true);
    setIsScanning(true);
    setScanError(null);
    setIsScopeError(false);
    setScanProgress({ scannedFolders: 0, foundSongs: 0, currentFolder: targetFolderName });

    try {
      await scanDriveMusicFolder(targetFolderId, targetFolderName, (progress) => {
        setScanProgress(progress);
      });
      await refreshLibraryStats();
    } catch (err: any) {
      if (err instanceof DrivePermissionError) {
        setIsScopeError(true);
      }
      setScanError(err.message || 'Failed to scan music folder.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectFolderClick = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const picked = await openFolderPicker();
      if (picked) {
        setFolderId(picked.id);
        setFolderName(picked.name);
        await runScan(picked.id, picked.name);
      }
    } catch (err: any) {
      setScanError(err.message || 'Error opening Google Picker.');
      setIsScanModalOpen(true);
    }
  };

  const handleRefreshLibrary = async () => {
    if (!folderId || !folderName) return;

    setIsScanModalOpen(true);
    setIsScanning(true);
    setScanError(null);
    setIsScopeError(false);

    try {
      await refreshMusicLibrary((progress) => {
        setScanProgress(progress);
      });
      await refreshLibraryStats();
    } catch (err: any) {
      if (err instanceof DrivePermissionError) {
        setIsScopeError(true);
      }
      setScanError(err.message || 'Failed to refresh music library.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpgradeScopeAndRescan = async (newScope: string) => {
    const success = await switchScope(newScope);
    if (success && folderId && folderName) {
      await runScan(folderId, folderName);
    }
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
          onRefreshLibrary={handleRefreshLibrary}
          folderName={folderName}
          isScanning={isScanning}
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
              onSelectPlaylist={setSelectedPlaylist}
              onAddToPlaylist={setTrackForAddToPlaylist}
            />
          )}
        </main>

        {/* Persistent Mini Player */}
        <MiniPlayer />

        {/* Mobile Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>

      {/* Modals & Overlays */}
      <NowPlayingModal onAddToPlaylist={setTrackForAddToPlaylist} />

      {isSettingsOpen && (
        <SettingsScreen
          onClose={() => setIsSettingsOpen(false)}
          folderName={folderName}
          onSelectFolderClick={handleSelectFolderClick}
          onRefreshLibrary={handleRefreshLibrary}
          isScanning={isScanning}
          trackCount={trackCount}
          onLibraryCleared={refreshLibraryStats}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <ScanProgressModal
        isOpen={isScanModalOpen}
        isScanning={isScanning}
        progress={scanProgress}
        error={scanError}
        isScopeError={isScopeError}
        activeScope={activeScope}
        onClose={() => setIsScanModalOpen(false)}
        onUpgradeScope={handleUpgradeScopeAndRescan}
      />

      <AlbumDetailModal album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      <ArtistDetailModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />

      <PlaylistDetailModal
        playlist={selectedPlaylist}
        tracks={allTracks}
        onClose={() => setSelectedPlaylist(null)}
        onPlaylistUpdated={refreshLibraryStats}
      />

      <AddToPlaylistModal
        track={trackForAddToPlaylist}
        onClose={() => setTrackForAddToPlaylist(null)}
      />
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

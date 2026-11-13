import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Clock, Music2, FolderPlus, Disc3 } from 'lucide-react';
import type { Track } from '../../types/music';
import { getAllTracks, getRecentHistory } from '../../services/db';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import { formatDuration } from '../../utils/format';

interface HomeScreenProps {
  onSelectFolderClick: () => void;
  folderName?: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectFolderClick, folderName }) => {
  const { playTrack } = usePlayer();
  const { isAuthenticated } = useAuth();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const tracks = await getAllTracks();
        setAllTracks(tracks);

        const history = await getRecentHistory(10);
        const historyTracks = history
          .map((h) => tracks.find((t) => t.id === h.trackId))
          .filter((t): t is Track => !!t);
        setRecentTracks(historyTracks);
      } catch (err) {
        console.error('Error loading library:', err);
      }
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentlyAdded = [...allTracks]
    .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
    .slice(0, 10);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {folderName
              ? `Connected to "${folderName}" (${allTracks.length} tracks indexed)`
              : 'Stream your music from Google Drive'}
          </p>
        </div>

        {!folderName && (
          <button
            onClick={onSelectFolderClick}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95 self-start md:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Select Music Folder</span>
          </button>
        )}
      </div>

      {/* Empty State Banner if no folder or library empty */}
      {(!folderName || allTracks.length === 0) && (
        <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 border border-neutral-800 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 shadow-xl">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Cloud Streaming</span>
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Connect your Google Drive music collection
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              CloudPlayer streams directly from your Google Drive folder using progressive byte-range requests. No files are uploaded elsewhere, and credentials stay securely in memory.
            </p>
            <div className="pt-2">
              <button
                onClick={onSelectFolderClick}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
              >
                {isAuthenticated ? 'Select Music Folder' : 'Connect Google Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently Played Section */}
      {recentTracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-white">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight">Recently Played</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentTracks.map((track) => (
              <div
                key={`recent-${track.id}`}
                onClick={() => playTrack(track, recentTracks)}
                className="group relative bg-neutral-900/60 hover:bg-neutral-850 p-3 rounded-xl border border-neutral-800/60 hover:border-neutral-700/80 transition-all cursor-pointer"
              >
                <div className="aspect-square rounded-lg bg-neutral-800 overflow-hidden mb-3 relative flex items-center justify-center shadow-md">
                  {track.coverArtUrl ? (
                    <img
                      src={track.coverArtUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <Disc3 className="w-10 h-10 text-neutral-400 group-hover:text-emerald-400 transition" />
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute right-2 bottom-2 w-9 h-9 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all shadow-lg shadow-emerald-500/40">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-neutral-100 truncate">{track.title}</h3>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added Section */}
      {recentlyAdded.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-white">
            <h2 className="text-lg font-bold tracking-tight">Recently Added</h2>
            <span className="text-xs text-neutral-400">{allTracks.length} total tracks</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyAdded.map((track, i) => (
              <div
                key={`added-${track.id}-${i}`}
                onClick={() => playTrack(track, recentlyAdded)}
                className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/40 hover:bg-neutral-850 border border-neutral-850/80 hover:border-neutral-700/60 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-neutral-800 shrink-0 overflow-hidden flex items-center justify-center">
                    {track.coverArtUrl ? (
                      <img
                        src={track.coverArtUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music2 className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 group-hover:text-emerald-400 truncate transition">
                      {track.title}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                  </div>
                </div>
                <div className="text-xs text-neutral-400 font-mono shrink-0 pl-2">
                  {formatDuration(track.duration)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

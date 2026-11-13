import React from 'react';
import { X, Play, ListMusic, Trash2 } from 'lucide-react';
import type { Playlist, Track } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/format';
import { savePlaylist } from '../../services/db';

interface PlaylistDetailModalProps {
  playlist: Playlist | null;
  tracks: Track[];
  onClose: () => void;
  onPlaylistUpdated: () => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  tracks,
  onClose,
  onPlaylistUpdated,
}) => {
  const { playTrack } = usePlayer();

  if (!playlist) return null;

  const playlistTracks = playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => !!t);

  const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handleRemoveTrack = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    const updated: Playlist = {
      ...playlist,
      trackIds: playlist.trackIds.filter((id) => id !== trackId),
      updatedAt: Date.now(),
    };
    await savePlaylist(updated);
    onPlaylistUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="relative p-6 bg-gradient-to-b from-teal-950/40 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-end justify-between">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/60 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-20 h-20 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/30 shrink-0 shadow-lg">
              <ListMusic className="w-10 h-10" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Playlist
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white truncate">{playlist.name}</h2>
              <p className="text-xs text-neutral-400 mt-1">
                {playlistTracks.length} tracks • {formatDuration(totalDuration)}
              </p>
            </div>
          </div>

          <button
            onClick={() => playlistTracks.length > 0 && playTrack(playlistTracks[0], playlistTracks)}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition shadow-xl shadow-emerald-500/30 active:scale-95 shrink-0 ml-4"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-1">
          {playlistTracks.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No tracks in this playlist yet.
            </div>
          ) : (
            playlistTracks.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                onClick={() => playTrack(track, playlistTracks)}
                className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 transition cursor-pointer text-neutral-300 hover:text-white"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xs text-neutral-400 w-5 text-center">{i + 1}</span>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0 pl-2">
                  <span className="text-xs text-neutral-400 font-mono">
                    {formatDuration(track.duration)}
                  </span>
                  <button
                    onClick={(e) => handleRemoveTrack(e, track.id)}
                    className="p-1 text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

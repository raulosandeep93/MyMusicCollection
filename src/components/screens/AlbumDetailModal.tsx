import React from 'react';
import { X, Play, Disc3 } from 'lucide-react';
import type { Album } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/format';

interface AlbumDetailModalProps {
  album: Album | null;
  onClose: () => void;
}

export const AlbumDetailModal: React.FC<AlbumDetailModalProps> = ({ album, onClose }) => {
  const { playTrack } = usePlayer();

  if (!album) return null;

  const totalDuration = album.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-b from-neutral-800 to-neutral-900 border-b border-neutral-800 flex items-end justify-between">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/60 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-24 h-24 rounded-2xl bg-neutral-800 shrink-0 overflow-hidden shadow-xl border border-neutral-700/60 flex items-center justify-center">
              {album.coverArtUrl ? (
                <img src={album.coverArtUrl} alt={album.name} className="w-full h-full object-cover" />
              ) : (
                <Disc3 className="w-12 h-12 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Album
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white truncate">{album.name}</h2>
              <p className="text-xs text-neutral-400 mt-1">
                {album.artist} • {album.tracks.length} songs • {formatDuration(totalDuration)}
              </p>
            </div>
          </div>

          <button
            onClick={() => album.tracks.length > 0 && playTrack(album.tracks[0], album.tracks)}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition shadow-xl shadow-emerald-500/30 active:scale-95 shrink-0 ml-4"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        {/* Tracks list */}
        <div className="overflow-y-auto p-4 space-y-1">
          {album.tracks.map((track, i) => (
            <div
              key={track.id}
              onClick={() => playTrack(track, album.tracks)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 transition cursor-pointer text-neutral-300 hover:text-white"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span className="text-xs text-neutral-400 w-5 text-center">{i + 1}</span>
                <span className="text-sm font-medium truncate">{track.title}</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {formatDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

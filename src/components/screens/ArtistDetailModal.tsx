import React from 'react';
import { X, Play, User } from 'lucide-react';
import type { Artist } from '../../types/music';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/format';

interface ArtistDetailModalProps {
  artist: Artist | null;
  onClose: () => void;
}

export const ArtistDetailModal: React.FC<ArtistDetailModalProps> = ({ artist, onClose }) => {
  const { playTrack } = usePlayer();

  if (!artist) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="relative p-6 bg-gradient-to-b from-neutral-800 to-neutral-900 border-b border-neutral-800 flex items-end justify-between">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-950/60 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
              <User className="w-10 h-10" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Artist
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white truncate">{artist.name}</h2>
              <p className="text-xs text-neutral-400 mt-1">{artist.tracks.length} songs</p>
            </div>
          </div>

          <button
            onClick={() => artist.tracks.length > 0 && playTrack(artist.tracks[0], artist.tracks)}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition shadow-xl shadow-emerald-500/30 active:scale-95 shrink-0 ml-4"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-1">
          {artist.tracks.map((track, i) => (
            <div
              key={track.id}
              onClick={() => playTrack(track, artist.tracks)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 transition cursor-pointer text-neutral-300 hover:text-white"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span className="text-xs text-neutral-400 w-5 text-center">{i + 1}</span>
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{track.album}</p>
                </div>
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


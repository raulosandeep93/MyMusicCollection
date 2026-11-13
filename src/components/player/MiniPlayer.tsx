import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Music2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    setIsNowPlayingOpen,
  } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 md:left-64 z-20 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800 shadow-2xl transition-all">
      {/* Mini Progress Line */}
      <div className="w-full h-1 bg-neutral-800 cursor-pointer relative overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3 md:px-5 py-2.5 h-16">
        {/* Track Info (Tappable to expand) */}
        <div
          onClick={() => setIsNowPlayingOpen(true)}
          className="flex items-center space-x-3 cursor-pointer min-w-0 flex-1 mr-2"
        >
          <div className="w-11 h-11 rounded-lg bg-neutral-800 shrink-0 overflow-hidden flex items-center justify-center border border-neutral-700/60 shadow-md">
            {currentTrack.coverArtUrl ? (
              <img
                src={currentTrack.coverArtUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music2 className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-100 truncate hover:underline">
              {currentTrack.title}
            </p>
            <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              previousTrack();
            }}
            className="p-2 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-800"
            title="Previous"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition shadow-lg shadow-emerald-500/20 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextTrack();
            }}
            className="p-2 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-800"
            title="Next"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

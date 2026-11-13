import React, { useState, useEffect } from 'react';
import type { Track } from '../../types/music';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Disc3,
  X,
  ListPlus,
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { formatDuration } from '../../utils/format';
import { getFavorites, toggleFavorite } from '../../services/db';

interface NowPlayingModalProps {
  onAddToPlaylist?: (track: Track) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ onAddToPlaylist }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    queue,
    queueIndex,
    isNowPlayingOpen,
    setIsNowPlayingOpen,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    playTrack,
  } = usePlayer();

  const [isFav, setIsFav] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekVal, setSeekVal] = useState<number>(0);

  useEffect(() => {
    if (currentTrack) {
      getFavorites().then((favs) => {
        setIsFav(favs.includes(currentTrack.id));
      });
    }
  }, [currentTrack]);

  if (!isNowPlayingOpen || !currentTrack) {
    return null;
  }

  const handleToggleFavorite = async () => {
    if (!currentTrack) return;
    const newState = await toggleFavorite(currentTrack.id);
    setIsFav(newState);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    setSeekVal(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    seek(seekVal);
    setIsSeeking(false);
  };

  const activeTime = isSeeking ? seekVal : currentTime;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
      {/* Background ambient blur */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-neutral-950/80 to-neutral-950 -z-10 pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 pt-safe py-4 border-b border-neutral-900/40">
        <button
          onClick={() => setIsNowPlayingOpen(false)}
          className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          aria-label="Collapse player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Playing from Library
          </p>
          <p className="text-xs font-medium text-neutral-300 truncate max-w-[200px]">
            {currentTrack.album || 'Unknown Album'}
          </p>
        </div>

        <button
          onClick={() => setShowQueue(!showQueue)}
          className={`p-2 rounded-full transition ${
            showQueue ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white'
          }`}
          title="Play Queue"
          aria-label="Toggle play queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Middle Body: Artwork or Queue View */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 overflow-y-auto">
        {showQueue ? (
          <div className="w-full max-w-md h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <h3 className="font-semibold text-sm text-neutral-200">Up Next ({queue.length})</h3>
              <button
                onClick={() => setShowQueue(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {queue.map((track, i) => {
                const isCurrent = i === queueIndex;
                return (
                  <div
                    key={`${track.id}-${i}`}
                    onClick={() => playTrack(track)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                      isCurrent
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'hover:bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-xs text-neutral-400 w-4 text-center">{i + 1}</span>
                      <div className="truncate">
                        <p className={`text-sm truncate ${isCurrent ? 'font-semibold' : ''}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/80 bg-neutral-900 flex items-center justify-center group">
            {currentTrack.coverArtUrl ? (
              <img
                src={currentTrack.coverArtUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400">
                <Disc3 className="w-24 h-24 mb-2 text-emerald-500/30 animate-[spin_12s_linear_infinite]" />
                <span className="text-xs text-neutral-400">Cloud Music</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md mx-auto px-8 pb-safe pb-8 space-y-4">
        {/* Track Title & Favorite */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <h2 className="text-xl font-bold text-white truncate">{currentTrack.title}</h2>
            <p className="text-sm text-neutral-400 truncate">{currentTrack.artist}</p>
          </div>
          <div className="flex items-center space-x-1">
            {onAddToPlaylist && (
              <button
                onClick={() => onAddToPlaylist(currentTrack)}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Add to playlist"
                aria-label="Add to playlist"
              >
                <ListPlus className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              className="p-2 rounded-full hover:bg-neutral-800 transition"
              aria-label="Favorite"
            >
              <Heart
                className={`w-6 h-6 transition ${
                  isFav ? 'fill-emerald-500 text-emerald-500' : 'text-neutral-400 hover:text-white'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Scrubber / Slider */}
        <div className="space-y-1.5">
          <div className="relative group flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={activeTime}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 font-mono">
            <span>{formatDuration(activeTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center justify-between pt-2">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition ${
              isShuffle ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
            title="Shuffle"
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={previousTrack}
            className="p-2 rounded-full text-neutral-200 hover:text-white hover:bg-neutral-800 transition active:scale-95"
            title="Previous"
            aria-label="Previous track"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center transition shadow-xl shadow-emerald-500/25 active:scale-90"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className="p-2 rounded-full text-neutral-200 hover:text-white hover:bg-neutral-800 transition active:scale-95"
            title="Next"
            aria-label="Next track"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition ${
              repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
            aria-label={`Toggle repeat: currently ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume Slider (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center space-x-3 pt-2">
          <button
            onClick={toggleMute}
            className="text-neutral-400 hover:text-white p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};

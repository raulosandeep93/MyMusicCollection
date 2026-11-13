import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { Track, RepeatMode } from '../types/music';
import { addPlayHistory, getSetting, setSetting } from '../services/db';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);

  // Hidden audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    // Load initial settings
    getSetting<number>('player_volume', 0.8).then((vol) => {
      setVolumeState(vol);
      audio.volume = vol;
    });

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      // Audio track ended naturally
      handleTrackEnded();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, []);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }

    if (queue.length === 0) {
      setIsPlaying(false);
      return;
    }

    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      playTrackAt(nextIdx);
    } else if (repeatMode === 'all') {
      playTrackAt(0);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, repeatMode]);

  const playTrackAt = useCallback(
    (index: number) => {
      if (index >= 0 && index < queue.length) {
        const track = queue[index];
        setQueueIndex(index);
        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(track.duration || 0);

        // Record history
        addPlayHistory(track.id).catch(console.error);

        // Connect audio source (routed to Service Worker proxy in Phase 3)
        if (audioRef.current) {
          audioRef.current.src = `/api/stream/${track.id}`;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Playback deferred or stream proxy pending:', err);
              // Set simulated playing state for UI until streaming proxy responds
            });
        }
      }
    },
    [queue]
  );

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      let q = queue;
      if (newQueue && newQueue.length > 0) {
        q = isShuffle ? shuffleArray([...newQueue]) : newQueue;
        setQueue(q);
      } else if (!queue.some((t) => t.id === track.id)) {
        q = [track, ...queue];
        setQueue(q);
      }

      const idx = q.findIndex((t) => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);

      addPlayHistory(track.id).catch(console.error);

      if (audioRef.current) {
        audioRef.current.src = `/api/stream/${track.id}`;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback play request:', err);
          });
      }
    },
    [queue, isShuffle]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx = queueIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        return;
      }
    }
    playTrackAt(nextIdx);
  }, [queue, queueIndex, repeatMode, playTrackAt]);

  const previousTrack = useCallback(() => {
    if (!audioRef.current || queue.length === 0) return;
    // If played more than 3 seconds, restart the song
    if (currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeatMode === 'all' ? queue.length - 1 : 0;
    }
    playTrackAt(prevIdx);
  }, [queue, queueIndex, repeatMode, currentTime, playTrackAt]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    setSetting('player_volume', clamped).catch(console.error);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next && queue.length > 0) {
        const remaining = [...queue];
        const curr = currentTrack;
        const shuffled = shuffleArray(remaining);
        if (curr) {
          const idx = shuffled.findIndex((t) => t.id === curr.id);
          if (idx > -1) {
            shuffled.splice(idx, 1);
            shuffled.unshift(curr);
          }
        }
        setQueue(shuffled);
        setQueueIndex(0);
      }
      return next;
    });
  }, [queue, currentTrack]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => prev.filter((_, i) => i !== index));
      if (index < queueIndex) {
        setQueueIndex((prev) => prev - 1);
      }
    },
    [queueIndex]
  );

  return (
    <PlayerContext.Provider
      value={{
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
        playTrack,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


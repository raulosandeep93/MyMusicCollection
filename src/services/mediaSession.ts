import type { Track } from '../types/music';

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeekTo: (details: MediaSessionActionDetails) => void;
  onSeekForward: (details: MediaSessionActionDetails) => void;
  onSeekBackward: (details: MediaSessionActionDetails) => void;
}

/**
 * Updates navigator.mediaSession metadata for lock screen and notification controls.
 */
export function updateMediaSessionMetadata(track: Track): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  const artwork: MediaImage[] = [];

  if (track.coverArtUrl) {
    artwork.push(
      { src: track.coverArtUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: track.coverArtUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: track.coverArtUrl, sizes: '192x192', type: 'image/jpeg' },
      { src: track.coverArtUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: track.coverArtUrl, sizes: '384x384', type: 'image/jpeg' },
      { src: track.coverArtUrl, sizes: '512x512', type: 'image/jpeg' }
    );
  } else {
    // Fallback app icon
    artwork.push(
      { src: '/vite.svg', sizes: '96x96', type: 'image/svg+xml' },
      { src: '/vite.svg', sizes: '512x512', type: 'image/svg+xml' }
    );
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'Unknown Album',
    artwork,
  });
}

/**
 * Updates playback state ('playing' | 'paused' | 'none')
 */
export function setMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}

/**
 * Updates scrubber position state for lock-screen seek bars
 */
export function updateMediaSessionPositionState(state: {
  duration: number;
  playbackRate: number;
  position: number;
}): void {
  if (
    typeof window !== 'undefined' &&
    'mediaSession' in navigator &&
    'setPositionState' in navigator.mediaSession &&
    state.duration > 0 &&
    !isNaN(state.duration) &&
    !isNaN(state.position)
  ) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0, state.duration),
        playbackRate: state.playbackRate || 1.0,
        position: Math.min(Math.max(0, state.position), state.duration),
      });
    } catch (e) {
      // Some browsers throw if position exceeds duration
      console.warn('Failed to set mediaSession position state:', e);
    }
  }
}

/**
 * Registers all MediaSession action handlers (Bluetooth, Lock screen, Notifications)
 */
export function setupMediaSessionHandlers(callbacks: MediaSessionCallbacks): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  const actionMap: Array<[MediaSessionAction, (details: any) => void]> = [
    ['play', callbacks.onPlay],
    ['pause', callbacks.onPause],
    ['previoustrack', callbacks.onPrevious],
    ['nexttrack', callbacks.onNext],
    ['seekto', callbacks.onSeekTo],
    ['seekforward', callbacks.onSeekForward],
    ['seekbackward', callbacks.onSeekBackward],
    ['stop', callbacks.onPause],
  ];

  for (const [action, handler] of actionMap) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Action might not be supported in this browser version
    }
  }
}


export interface Track {
  id: string; // Google Drive file ID
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  mimeType: string;
  size: number; // in bytes
  fileExtension: string;
  modifiedTime: string;
  coverArtUrl?: string; // Optional cached blob URL or thumbnail
  trackNumber?: number;
  year?: string;
  folderId?: string;
}

export interface Album {
  id: string; // generated key, e.g. "album-name-artist"
  name: string;
  artist: string;
  trackCount: number;
  tracks: Track[];
  coverArtUrl?: string;
  year?: string;
}

export interface Artist {
  id: string; // artist name or normalized key
  name: string;
  trackCount: number;
  albumCount: number;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  trackIds: string[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
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
  playbackHistory: string[]; // Track IDs
}


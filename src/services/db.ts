import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Track, Playlist } from '../types/music';

interface MusicDBSchema extends DBSchema {
  tracks: {
    key: string; // fileId
    value: Track;
    indexes: {
      'by-artist': string;
      'by-album': string;
      'by-title': string;
      'by-folder': string;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
  };
  favorites: {
    key: string; // trackId
    value: { trackId: string; addedAt: number };
  };
  history: {
    key: number;
    value: { trackId: string; playedAt: number };
    indexes: { 'by-playedAt': number };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'cloud_music_player_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MusicDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<MusicDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<MusicDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tracks store
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('by-artist', 'artist');
          trackStore.createIndex('by-album', 'album');
          trackStore.createIndex('by-title', 'title');
          trackStore.createIndex('by-folder', 'folderId');
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'trackId' });
        }

        // Playback history store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', {
            keyPath: 'id',
            autoIncrement: true,
          });
          historyStore.createIndex('by-playedAt', 'playedAt');
        }

        // Settings store (non-sensitive: folders, preferences, theme)
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// Track operations
export async function saveTracks(tracks: Track[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tracks', 'readwrite');
  for (const track of tracks) {
    await tx.store.put(track);
  }
  await tx.done;
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return db.getAll('tracks');
}

export async function clearAllTracks(): Promise<void> {
  const db = await getDB();
  await db.clear('tracks');
}

// Favorites operations
export async function getFavorites(): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll('favorites');
  return all.map((f) => f.trackId);
}

export async function toggleFavorite(trackId: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('favorites', trackId);
  if (existing) {
    await db.delete('favorites', trackId);
    return false;
  } else {
    await db.put('favorites', { trackId, addedAt: Date.now() });
    return true;
  }
}

// History operations
export async function addPlayHistory(trackId: string): Promise<void> {
  const db = await getDB();
  await db.add('history', { trackId, playedAt: Date.now() });
}

export async function getRecentHistory(limit = 20): Promise<{ trackId: string; playedAt: number }[]> {
  const db = await getDB();
  const history = await db.getAllFromIndex('history', 'by-playedAt');
  // Reverse to get latest first and deduplicate recent items
  const seen = new Set<string>();
  const recent: { trackId: string; playedAt: number }[] = [];
  for (let i = history.length - 1; i >= 0 && recent.length < limit; i--) {
    const item = history[i];
    if (!seen.has(item.trackId)) {
      seen.add(item.trackId);
      recent.push(item);
    }
  }
  return recent;
}

// Playlists operations
export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

// Settings operations (Strictly non-sensitive data)
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const entry = (await db.get('settings', key)) as { key: string; value: T } | undefined;
  return entry !== undefined ? entry.value : defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}


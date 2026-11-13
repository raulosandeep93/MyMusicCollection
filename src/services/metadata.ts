import type { Track } from '../types/music';

// Supported audio mime types and extensions
export const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.aac', '.wav', '.ogg'];

export const AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/vorbis',
]);

export function isAudioFile(fileName: string, mimeType?: string): boolean {
  if (mimeType && AUDIO_MIME_TYPES.has(mimeType.toLowerCase())) {
    return true;
  }
  const lowerName = fileName.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

/**
 * Parses track title, artist, album, and track number from file name and directory structure.
 */
export function parseTrackMetadataFromFileName(
  fileName: string,
  parentFolderName?: string,
  grandparentFolderName?: string
): { title: string; artist: string; album: string; trackNumber?: number } {
  // Strip extension
  const ext = getFileExtension(fileName);
  let baseName = ext ? fileName.slice(0, -ext.length) : fileName;

  let trackNumber: number | undefined;
  let artist = 'Unknown Artist';
  let album = 'Unknown Album';
  let title = baseName;

  // Use folder hierarchy for contextual defaults if available
  if (parentFolderName && !parentFolderName.toLowerCase().includes('music')) {
    album = parentFolderName;
    if (grandparentFolderName && !grandparentFolderName.toLowerCase().includes('music')) {
      artist = grandparentFolderName;
    }
  }

  // Check for leading track number, e.g. "01 - ", "01. ", "01 "
  const trackNumMatch = baseName.match(/^(\d{1,3})[\s._-]+(.*)$/);
  if (trackNumMatch) {
    trackNumber = parseInt(trackNumMatch[1], 10);
    baseName = trackNumMatch[2].trim();
  }

  // Patterns:
  // 1. "Artist - Album - Title"
  // 2. "Artist - Title"
  // 3. "Title"
  if (baseName.includes(' - ')) {
    const parts = baseName.split(' - ').map((p) => p.trim());
    if (parts.length >= 3) {
      artist = parts[0];
      album = parts[1];
      title = parts.slice(2).join(' - ');
    } else if (parts.length === 2) {
      artist = parts[0];
      title = parts[1];
    }
  } else {
    title = baseName;
  }

  // Clean up title
  title = title.replace(/[_]+/g, ' ').trim();
  if (!title) title = fileName;

  return { title, artist, album, trackNumber };
}

/**
 * Builds a Track object from Google Drive File Resource
 */
export function buildTrackFromDriveFile(
  file: {
    id: string;
    name: string;
    mimeType: string;
    size?: string | number;
    modifiedTime?: string;
    thumbnailLink?: string;
  },
  folderId?: string,
  parentFolderName?: string,
  grandparentFolderName?: string
): Track {
  const { title, artist, album, trackNumber } = parseTrackMetadataFromFileName(
    file.name,
    parentFolderName,
    grandparentFolderName
  );

  const ext = getFileExtension(file.name);
  const sizeNum = typeof file.size === 'string' ? parseInt(file.size, 10) : file.size || 0;

  // Derive duration estimation if not present (approximate bitrate: 192kbps = 24KB/s)
  // Accurate duration will update once the Service Worker or audio element metadata loads
  const estimatedDuration = sizeNum > 0 ? Math.round(sizeNum / 24000) : 180;

  return {
    id: file.id,
    title,
    artist,
    album,
    duration: estimatedDuration,
    mimeType: file.mimeType || 'audio/mpeg',
    size: sizeNum,
    fileExtension: ext,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    coverArtUrl: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s400') : undefined,
    trackNumber,
    folderId,
  };
}

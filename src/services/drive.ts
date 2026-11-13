import type { Track } from '../types/music';
import { getInMemoryAccessToken } from './auth';
import { isAudioFile, buildTrackFromDriveFile } from './metadata';
import { saveTracks, setSetting, getSetting } from './db';

export interface ScanProgress {
  scannedFolders: number;
  foundSongs: number;
  currentFolder: string;
}

export class DrivePermissionError extends Error {
  isScopeError: boolean;
  constructor(message: string, isScopeError = true) {
    super(message);
    this.name = 'DrivePermissionError';
    this.isScopeError = isScopeError;
  }
}

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

interface DriveFileListResponse {
  files?: DriveFileItem[];
  nextPageToken?: string;
  error?: {
    code: number;
    message: string;
    errors?: Array<{ reason: string; message: string }>;
  };
}

/**
 * Fetch files inside a specific folder using Google Drive API v3
 */
async function fetchFolderContents(
  folderId: string,
  token: string,
  pageToken?: string
): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink)');
  let url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data: DriveFileListResponse = await res.json();

  if (!res.ok || data.error) {
    const status = res.status;
    const errorReason = data.error?.errors?.[0]?.reason || '';
    const errorMsg = data.error?.message || `HTTP ${status}`;

    if (status === 403 || status === 404 || errorReason === 'insufficientFilePermissions') {
      throw new DrivePermissionError(
        `Google Drive permission denied on folder children (${errorMsg}). Under 'drive.file', Google Drive does not grant access to pre-existing items inside a folder. Upgrade to 'drive.readonly' in Settings.`,
        true
      );
    }
    throw new Error(`Google Drive API error: ${errorMsg}`);
  }

  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Recursively scans a selected Google Drive folder for audio files.
 */
export async function scanDriveMusicFolder(
  rootFolderId: string,
  rootFolderName: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<Track[]> {
  const token = getInMemoryAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in first.');
  }

  const visitedFolders = new Set<string>();
  const discoveredTracks: Track[] = [];
  let scannedFolderCount = 0;

  async function traverse(
    folderId: string,
    currentFolderName: string,
    parentFolderName?: string
  ): Promise<void> {
    if (visitedFolders.has(folderId)) return;
    visitedFolders.add(folderId);
    scannedFolderCount++;

    onProgress?.({
      scannedFolders: scannedFolderCount,
      foundSongs: discoveredTracks.length,
      currentFolder: currentFolderName,
    });

    let pageToken: string | undefined;

    do {
      const page = await fetchFolderContents(folderId, token!, pageToken);
      pageToken = page.nextPageToken;

      for (const item of page.files) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Recurse into subfolder
          await traverse(item.id, item.name, currentFolderName);
        } else if (isAudioFile(item.name, item.mimeType)) {
          // Found audio file
          const track = buildTrackFromDriveFile(
            item,
            folderId,
            currentFolderName,
            parentFolderName
          );
          discoveredTracks.push(track);

          onProgress?.({
            scannedFolders: scannedFolderCount,
            foundSongs: discoveredTracks.length,
            currentFolder: currentFolderName,
          });
        }
      }
    } while (pageToken);
  }

  // Start traversal from root folder
  await traverse(rootFolderId, rootFolderName);

  // Save discovered tracks to local IndexedDB cache
  await saveTracks(discoveredTracks);
  await setSetting('selected_folder_id', rootFolderId);
  await setSetting('selected_folder_name', rootFolderName);
  await setSetting('last_scan_timestamp', Date.now());

  return discoveredTracks;
}

/**
 * Performs an incremental refresh of the library, keeping local favorites and history intact.
 */
export async function refreshMusicLibrary(
  onProgress?: (progress: ScanProgress) => void
): Promise<Track[]> {
  const token = getInMemoryAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in to refresh library.');
  }

  const folderId = await getSetting<string | null>('selected_folder_id', null);
  const folderName = await getSetting<string | null>('selected_folder_name', null);

  if (!folderId || !folderName) {
    throw new Error('No Google Drive folder has been selected yet.');
  }

  return scanDriveMusicFolder(folderId, folderName, onProgress);
}

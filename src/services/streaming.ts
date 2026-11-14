import { getInMemoryAccessToken, requestToken, isTokenValid } from './auth';

// Active blob URL tracker to ensure zero memory leaks
let currentActiveBlobUrl: string | null = null;
let currentTrackId: string | null = null;

// Small cache for preloaded next song (max 2 tracks in memory: current + next)
const streamCache = new Map<string, { blobUrl: string; size: number }>();

/**
 * Cleanly revokes a Blob URL from browser memory
 */
export function revokeStreamUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Error revoking blob URL:', e);
    }
  }
}

/**
 * Releases all cached audio blobs to free memory
 */
export function clearStreamCache(): void {
  for (const [, entry] of streamCache.entries()) {
    revokeStreamUrl(entry.blobUrl);
  }
  streamCache.clear();
  if (currentActiveBlobUrl) {
    revokeStreamUrl(currentActiveBlobUrl);
    currentActiveBlobUrl = null;
  }
  currentTrackId = null;
}

/**
 * Fetches an authenticated audio stream directly from Google Drive API v3
 * using fast progressive chunking or verified Blob URL with seek support.
 */
export async function getAudioStreamUrl(
  fileId: string,
  onProgress?: (receivedBytes: number, totalBytes: number) => void
): Promise<string> {
  // If already loaded in cache
  if (streamCache.has(fileId)) {
    const cached = streamCache.get(fileId)!;
    currentActiveBlobUrl = cached.blobUrl;
    currentTrackId = fileId;
    return cached.blobUrl;
  }

  // Ensure valid token
  let token = getInMemoryAccessToken();
  if (!token || !isTokenValid()) {
    token = await requestToken('');
  }

  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  let res = await fetch(driveUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle token expiration retry
  if (res.status === 401) {
    token = await requestToken('');
    res = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google Drive streaming error (${res.status}): ${errText || res.statusText}`);
  }

  const contentLengthHeader = res.headers.get('content-length');
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

  // Stream with progress tracking
  if (!res.body) {
    throw new Error('Response body is empty');
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      if (onProgress && totalBytes > 0) {
        onProgress(receivedBytes, totalBytes);
      }
    }
  }

  // Determine mime type
  const mimeType = res.headers.get('content-type') || 'audio/mpeg';
  const blob = new Blob(chunks as BlobPart[], { type: mimeType });
  const newBlobUrl = URL.createObjectURL(blob);

  // Clean up older cache entries to keep memory tight (maximum 2 tracks: current + next)
  if (streamCache.size >= 2) {
    const firstKey = streamCache.keys().next().value;
    if (firstKey && firstKey !== currentTrackId) {
      const old = streamCache.get(firstKey);
      if (old) {
        revokeStreamUrl(old.blobUrl);
      }
      streamCache.delete(firstKey);
    }
  }

  // Save in cache
  streamCache.set(fileId, { blobUrl: newBlobUrl, size: receivedBytes });

  // If previous active blob is not in cache, revoke it
  if (currentActiveBlobUrl && currentActiveBlobUrl !== newBlobUrl) {
    let isInCache = false;
    for (const entry of streamCache.values()) {
      if (entry.blobUrl === currentActiveBlobUrl) {
        isInCache = true;
        break;
      }
    }
    if (!isInCache) {
      revokeStreamUrl(currentActiveBlobUrl);
    }
  }

  currentActiveBlobUrl = newBlobUrl;
  currentTrackId = fileId;

  return newBlobUrl;
}


import { getInMemoryAccessToken, getGoogleConfig, requestToken } from './auth';

export interface PickedFolder {
  id: string;
  name: string;
}

let isGapiPickerLoaded = false;

/**
 * Ensures the Google API Client library and Picker module are loaded.
 */
export async function loadGooglePickerApi(): Promise<void> {
  if (isGapiPickerLoaded && window.google?.picker) {
    return;
  }

  // Wait for window.gapi to be available if script is still downloading
  let attempts = 0;
  while (typeof window !== 'undefined' && !window.gapi && attempts < 30) {
    await new Promise((res) => setTimeout(res, 100));
    attempts++;
  }

  if (typeof window === 'undefined' || !window.gapi) {
    throw new Error('Google API Client (gapi) failed to load. Check your network connection.');
  }

  return new Promise((resolve, reject) => {
    window.gapi!.load('picker', {
      callback: () => {
        isGapiPickerLoaded = true;
        resolve();
      },
      onerror: () => {
        reject(new Error('Failed to load Google Picker module.'));
      },
    });
  });
}

/**
 * Launches Google Picker dialog for selecting a music folder.
 */
export async function openFolderPicker(): Promise<PickedFolder | null> {
  await loadGooglePickerApi();

  let token = getInMemoryAccessToken();
  if (!token) {
    // Attempt to request access token
    token = await requestToken('');
  }

  const { apiKey } = await getGoogleConfig();
  if (!apiKey) {
    throw new Error('Google Picker API Key is missing. Please enter it in Settings.');
  }

  const cleanApiKey = apiKey.trim();
  const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`;

  return new Promise((resolve, reject) => {
    try {
      // Allow viewing folders and audio files with folder selection enabled
      const docsView = new window.google!.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      const builder = new window.google!.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(token!)
        .setDeveloperKey(cleanApiKey)
        .setOrigin(origin)
        .setTitle('Select Music Folder in Google Drive')
        .setCallback(async (data: any) => {
          if (data.action === window.google!.picker.Action.PICKED) {
            const doc = data.docs?.[0];
            if (doc) {
              const folder = await resolvePickedFolder(doc, token!);
              resolve(folder);
            } else {
              resolve(null);
            }
          } else if (data.action === window.google!.picker.Action.CANCEL) {
            resolve(null);
          }
        });

      const picker = builder.build();
      picker.setVisible(true);
    } catch (err: any) {
      reject(new Error(`Failed to open Google Picker: ${err.message}`));
    }
  });
}

/**
 * Resolves the folder whether the user selected a folder directly or an audio file inside it.
 */
async function resolvePickedFolder(doc: any, token: string): Promise<PickedFolder> {
  if (doc.mimeType === 'application/vnd.google-apps.folder' || doc.type === 'folder') {
    return { id: doc.id, name: doc.name };
  }

  // If user selected an audio file inside the music folder, resolve its parent folder
  const parentId = doc.parentId || doc.parents?.[0];
  if (parentId) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${parentId}?fields=id,name`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const parentData = await res.json();
        return { id: parentData.id, name: parentData.name };
      }
    } catch {
      // Fallback below
    }
    return { id: parentId, name: 'Music Folder' };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?fields=parents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const fileData = await res.json();
      const resolvedParentId = fileData.parents?.[0];
      if (resolvedParentId) {
        const parentRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${resolvedParentId}?fields=id,name`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (parentRes.ok) {
          const parentData = await parentRes.json();
          return { id: parentData.id, name: parentData.name };
        }
        return { id: resolvedParentId, name: 'Music Folder' };
      }
    }
  } catch (e) {
    console.warn('Error resolving parent folder from Drive API:', e);
  }

  return { id: doc.id, name: doc.name };
}


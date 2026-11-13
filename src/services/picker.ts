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

  const { apiKey, appId } = await getGoogleConfig();
  if (!apiKey) {
    throw new Error('Google Picker API Key is missing. Please enter it in Settings.');
  }

  return new Promise((resolve, reject) => {
    try {
      const docsView = new window.google!.picker.DocsView(window.google!.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');

      const builder = new window.google!.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(token!)
        .setDeveloperKey(apiKey)
        .setTitle('Select Music Folder in Google Drive')
        .setCallback((data: any) => {
          if (data.action === window.google!.picker.Action.PICKED) {
            const doc = data.docs?.[0];
            if (doc) {
              resolve({
                id: doc.id,
                name: doc.name,
              });
            } else {
              resolve(null);
            }
          } else if (data.action === window.google!.picker.Action.CANCEL) {
            resolve(null);
          }
        });

      if (appId) {
        // Optional App ID / Project number
        (builder as any).setAppId(appId);
      }

      const picker = builder.build();
      picker.setVisible(true);
    } catch (err: any) {
      reject(new Error(`Failed to open Google Picker: ${err.message}`));
    }
  });
}


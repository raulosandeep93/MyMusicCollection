import type { GoogleUser, TokenResponse } from '../types/auth';
import { getSetting } from './db';

// OAuth Scopes
export const SCOPE_DRIVE_FILE = 'https://www.googleapis.com/auth/drive.file';
export const SCOPE_DRIVE_READONLY = 'https://www.googleapis.com/auth/drive.readonly';
export const SCOPE_USERINFO = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

// STRICT SECURITY DIRECTIVE: Access tokens are held exclusively in-memory in this module closure.
// NEVER persist to localStorage, sessionStorage, cookies, or IndexedDB.
let inMemoryAccessToken: string | null = null;
let tokenExpiresAt = 0;
let activeScope: string = SCOPE_DRIVE_FILE;

// Google GIS TokenClient instance
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let tokenClientScope: string = '';

export async function getGoogleConfig(): Promise<{ clientId: string; apiKey: string; appId?: string }> {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const envApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  const envAppId = import.meta.env.VITE_GOOGLE_APP_ID || '';

  // Allow user override from IndexedDB settings if .env is not yet configured
  const savedClientId = await getSetting<string>('custom_client_id', '');
  const savedApiKey = await getSetting<string>('custom_api_key', '');
  const savedAppId = await getSetting<string>('custom_app_id', '');

  return {
    clientId: savedClientId || envClientId,
    apiKey: savedApiKey || envApiKey,
    appId: savedAppId || envAppId,
  };
}

export function getInMemoryAccessToken(): string | null {
  // Check if token exists and hasn't expired (with 30-second clock skew buffer)
  if (inMemoryAccessToken && Date.now() < tokenExpiresAt - 30000) {
    return inMemoryAccessToken;
  }
  return null;
}

export function getActiveScope(): string {
  return activeScope;
}

export function isTokenValid(): boolean {
  return inMemoryAccessToken !== null && Date.now() < tokenExpiresAt - 30000;
}

/**
 * Initializes the Google Identity Services TokenClient.
 */
export async function initTokenClient(scope: string = SCOPE_DRIVE_FILE): Promise<google.accounts.oauth2.TokenClient> {
  const { clientId } = await getGoogleConfig();
  if (!clientId) {
    throw new Error('Google Client ID is missing. Please configure it in Settings or .env.');
  }

  const fullScope = `${scope} ${SCOPE_USERINFO}`;

  if (tokenClient && tokenClientScope === fullScope) {
    return tokenClient;
  }

  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is not loaded yet.');
  }

  activeScope = scope;
  tokenClientScope = fullScope;

  return new Promise((resolve) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: fullScope,
      callback: () => {
        // Handled per request
      },
    });
    resolve(tokenClient);
  });
}

/**
 * Request an access token via Google Identity Services.
 * @param prompt 'consent', 'select_account', or '' for silent renewal
 * @param scope Target scope (defaults to drive.file)
 */
export async function requestToken(
  prompt: 'consent' | 'select_account' | '' = '',
  scope: string = activeScope
): Promise<string> {
  const client = await initTokenClient(scope);

  return new Promise((resolve, reject) => {
    client.callback = (resp: TokenResponse) => {
      if (resp.error) {
        reject(new Error(`OAuth Error: ${resp.error_description || resp.error}`));
        return;
      }
      inMemoryAccessToken = resp.access_token;
      tokenExpiresAt = Date.now() + (resp.expires_in || 3600) * 1000;
      activeScope = scope;
      resolve(resp.access_token);
    };

    client.requestAccessToken({ prompt });
  });
}

/**
 * Fetch authenticated Google user profile using in-memory token
 */
export async function fetchUserProfile(): Promise<GoogleUser | null> {
  const token = getInMemoryAccessToken();
  if (!token) return null;

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        inMemoryAccessToken = null;
      }
      return null;
    }
    const data = await res.json();
    return {
      id: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
  } catch (err) {
    console.warn('Could not fetch Google user profile:', err);
    return null;
  }
}

/**
 * Revoke token and clear in-memory authentication state completely
 */
export async function signOut(userEmail?: string): Promise<void> {
  const token = inMemoryAccessToken;
  inMemoryAccessToken = null;
  tokenExpiresAt = 0;

  if (token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {
        // Revocation complete
      });
    } catch (e) {
      console.warn('Error revoking token:', e);
    }
  }

  // Also prompt GIS sign-out if email is known
  if (userEmail && window.google?.accounts?.id) {
    try {
      window.google.accounts.id.revoke(userEmail, () => {});
    } catch {
      // Ignored
    }
  }
}

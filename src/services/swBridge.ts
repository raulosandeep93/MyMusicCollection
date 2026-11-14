import { getInMemoryAccessToken } from './auth';

let authChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    authChannel = new BroadcastChannel('cloud_player_auth');
  }
} catch (e) {
  console.warn('BroadcastChannel initialization error:', e);
}

/**
 * Registers the Service Worker and sets up two-way in-memory token communication.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Listen for messages from the Service Worker (e.g. asking for token)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'REQUEST_AUTH_TOKEN') {
        const token = getInMemoryAccessToken();
        event.ports?.[0]?.postMessage({ token });
      }
    });

    // Ensure immediate activation
    if (registration.installing) {
      registration.installing.postMessage({ type: 'SKIP_WAITING' });
    }

    // Sync token if already authenticated
    syncTokenToServiceWorker();

    return registration;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Synchronizes the in-memory access token to the Service Worker.
 * Never persists to disk or storage.
 */
export function syncTokenToServiceWorker(): void {
  const token = getInMemoryAccessToken();

  // 1. BroadcastChannel
  if (authChannel) {
    authChannel.postMessage({
      type: token ? 'SET_AUTH_TOKEN' : 'CLEAR_AUTH_TOKEN',
      token,
    });
  }

  // 2. Direct postMessage to active controller
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: token ? 'SET_AUTH_TOKEN' : 'CLEAR_AUTH_TOKEN',
      token,
    });
  }
}


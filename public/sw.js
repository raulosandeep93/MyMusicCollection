// Service Worker: In-Browser Range Streaming Proxy & Offline PWA Shell
const SW_VERSION = 'v1.0.0';
const CACHE_NAME = `cloud-player-cache-${SW_VERSION}`;

let inMemoryToken = null;

// Set up BroadcastChannel for in-memory token synchronization
let authChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    authChannel = new BroadcastChannel('cloud_player_auth');
    authChannel.onmessage = (event) => {
      if (event.data?.type === 'SET_AUTH_TOKEN') {
        inMemoryToken = event.data.token;
      } else if (event.data?.type === 'CLEAR_AUTH_TOKEN') {
        inMemoryToken = null;
      }
    };
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in SW:', e);
}

// Also accept postMessage from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_AUTH_TOKEN') {
    inMemoryToken = event.data.token;
    event.ports?.[0]?.postMessage({ status: 'OK' });
  } else if (event.data?.type === 'CLEAR_AUTH_TOKEN') {
    inMemoryToken = null;
    event.ports?.[0]?.postMessage({ status: 'OK' });
  } else if (event.data?.type === 'GET_TOKEN_STATUS') {
    event.ports?.[0]?.postMessage({ hasToken: !!inMemoryToken });
  } else if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Pre-cache core app shell assets on install
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_FILES).catch((err) => {
        console.warn('App shell pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept requests: specifically /api/stream/:fileId
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/stream/')) {
    event.respondWith(handleAudioStreamRequest(event.request, url));
    return;
  }

  // Allow other requests to pass through
});

/**
 * Handles progressive chunked streaming from Google Drive v3
 */
async function handleAudioStreamRequest(request, url) {
  const fileId = url.pathname.replace('/api/stream/', '').trim();
  if (!fileId) {
    return new Response('File ID missing', { status: 400 });
  }

  // If in-memory token is not yet stored, ask active window clients
  if (!inMemoryToken) {
    inMemoryToken = await requestTokenFromClients();
  }

  if (!inMemoryToken) {
    return new Response('Unauthorized: In-memory token unavailable in Service Worker', {
      status: 401,
      statusText: 'Unauthorized',
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Forward Range headers from the browser audio tag
  const rangeHeader = request.headers.get('range');
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const driveHeaders = new Headers();
  driveHeaders.set('Authorization', `Bearer ${inMemoryToken}`);
  if (rangeHeader) {
    driveHeaders.set('Range', rangeHeader);
  }

  try {
    const driveResponse = await fetch(driveUrl, {
      method: 'GET',
      headers: driveHeaders,
    });

    if (!driveResponse.ok && driveResponse.status !== 206) {
      if (driveResponse.status === 401) {
        // Token expired
        inMemoryToken = null;
      }
      return new Response(driveResponse.body, {
        status: driveResponse.status,
        statusText: driveResponse.statusText,
        headers: driveResponse.headers,
      });
    }

    // Construct streaming response with byte ranges preserved
    const responseHeaders = new Headers();
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag',
    ];

    for (const h of headersToForward) {
      const val = driveResponse.headers.get(h);
      if (val) {
        responseHeaders.set(h, val);
      }
    }

    // Ensure Accept-Ranges is always present for media seeking
    if (!responseHeaders.has('accept-ranges')) {
      responseHeaders.set('accept-ranges', 'bytes');
    }

    return new Response(driveResponse.body, {
      status: driveResponse.status,
      statusText: driveResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(`Stream error: ${err.message}`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Solicits token from active client windows if worker restarted
 */
async function requestTokenFromClients() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    try {
      const token = await new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => {
          resolve(e.data?.token || null);
        };
        client.postMessage({ type: 'REQUEST_AUTH_TOKEN' }, [channel.port2]);
        setTimeout(() => resolve(null), 1000); // 1s timeout
      });
      if (token) return token;
    } catch {
      // Continue to next client
    }
  }
  return null;
}

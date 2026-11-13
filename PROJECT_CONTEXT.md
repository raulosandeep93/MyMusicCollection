# PROJECT_CONTEXT.md - System Architecture & Technical Specifications

## 1. System Vision
A zero-cost, self-hosted, serverless Personal Cloud Music Streaming Progressive Web Application (PWA) using Google Drive as the storage backend. The application runs locally or as a static web app deployed on GitHub Pages / Cloudflare Pages / Vercel, streaming personal music collections directly to mobile and desktop browsers.

## 2. Platform Comparison & Evaluation

| Evaluation Criteria | Progressive Web App (PWA) - Selected | React Native (Expo) | Flutter |
| :--- | :--- | :--- | :--- |
| **Development Effort** | **Low**: Single unified TypeScript codebase, instant reload, no App Store builds. | **High**: Dual native platform builds, native bridge maintenance, store review processes. | **High**: Dart codebase, separate web vs mobile nuances, binary compilation pipelines. |
| **Maintenance** | **Minimal**: Pure web deployment, automated static hosting, zero native SDK deprecation woes. | **Medium-High**: Frequent Xcode/Gradle/CocoaPods and OS SDK upgrades. | **Medium-High**: Flutter engine upgrades, platform channel maintenance. |
| **Google Drive Integration** | **Native**: Google Identity Services (GIS) & Google Picker Web SDK work out-of-the-box. | **Complex**: Requires native deep-linking, Safari/Chrome custom tabs, or webview wrappers. | **Complex**: Similar native auth hurdles and external picker limitations. |
| **Background Audio** | **Feasible**: HTML5 Audio + Media Session API. Android is seamless; iOS requires unbroken playback chain. | **Native**: Background audio service with OS foreground notifications (`react-native-track-player`). | **Native**: Native audio background runner (`just_audio` + `audio_service`). |
| **Security Surface** | **Tight**: In-memory token management, zero exposed secrets, client-side PKCE OAuth. | **Good**: Secure store / Keystore / Keychain for token storage. | **Good**: Secure storage plugins. |
| **Memory & Performance** | **High**: Byte-range stream interception via Service Worker. | **High**: Native audio buffers. | **High**: Native audio buffers. |

**Verdict**: PWA with React + TypeScript is the optimal approach. It eliminates native build and deployment overhead while fully satisfying cross-platform personal streaming.

## 3. Architecture Overview

```
+--------------------------------------------------------------------------------+
|                               Client Browser                                   |
|                                                                                |
|  +--------------------+     +---------------------+     +-------------------+  |
|  |     React UI       |     |   Audio Controller  |     |  IndexedDB Cache  |  |
|  |  (Tailwind, Views, | <-> | (HTML5 Audio Element| <-> | (File Metadata,   |  |
|  |  Playlists, Queue) |     |  Media Session API) |     |  Playlists, State)|  |
|  +--------------------+     +---------------------+     +-------------------+  |
|            |                           | (audio src)                           |
|            v                           v                                       |
|  +--------------------+     +-----------------------------------------------+  |
|  | Google Identity    |     |            Service Worker (SW)                |  |
|  | Services (GIS)     |     | - Intercepts `/stream/:fileId`                |  |
|  | - Token in memory  | --> | - Injects Authorization: Bearer <Token>       |  |
|  +--------------------+     | - Forwards Range: bytes=X-Y headers           |  |
|                             | - Streams HTTP 206 chunked audio to `<audio>` |  |
|                             +-----------------------------------------------+  |
|                                                     |                          |
+-----------------------------------------------------|--------------------------+
                                                      | Authenticated Range Fetch
                                                      v
                                        +----------------------------+
                                        |   Google Drive API v3      |
                                        |   `files.get(alt=media)`   |
                                        +----------------------------+
```

## 4. Google Drive & OAuth Strategy

### OAuth 2.0 Scopes & Limitations
1. **`drive.file` Scope Investigation**:
   - *Intended Behavior*: Access only to files created by or explicitly opened with the application via Google Picker.
   - *Known API Limitation*: Selecting a folder via Google Picker grants metadata access to that folder entity. However, Google Drive API v3 **does NOT automatically grant permissions to pre-existing files and subfolders** contained within that folder unless each item was explicitly selected or created by the application.
   - *Feasibility Plan*: We will rigorously test folder enumeration and child file streaming under `drive.file`. If Google Drive API blocks child access with `404 Not Found` or `403 Forbidden`, we will cleanly transition with explicit user notification to the least-privileged broad alternative.
2. **`drive.readonly` Alternative**:
   - Scope: `https://www.googleapis.com/auth/drive.readonly`
   - *Capabilities*: Allows recursive reading and streaming of all audio files and subfolders in the library without modifying, deleting, or uploading any files.
   - *Security Safeguard*: Application code enforces strict read-only queries restricted to the chosen folder ID (`'${folderId}' in parents and trashed = false`).

### Token Security
- Google Identity Services (GIS) Web SDK (`google.accounts.oauth2.initTokenClient`).
- Implicit / Authorization code flow without client secrets.
- In-memory token storage only. On page reload, GIS restores the session silently using `prompt: ''` if the user is already logged in, without prompting.

## 5. Streaming Architecture: The Service Worker Solution
- **The Problem**: `<audio src="...">` cannot attach custom HTTP headers (`Authorization: Bearer <token>`). Google Drive v3 media download endpoint `https://www.googleapis.com/drive/v3/files/{id}?alt=media` rejects unauthenticated requests and no longer supports query parameters like `?access_token=`.
- **The Solution**: A dedicated Service Worker acts as an in-browser streaming proxy:
  1. The audio player sets `<audio src="/api/stream/{fileId}">`.
  2. The Service Worker intercepts requests matching `/api/stream/*`.
  3. The Service Worker fetches the active OAuth token from in-memory postMessage bridge.
  4. The Service Worker preserves the incoming browser `Range` header (e.g., `Range: bytes=1048576-`).
  5. The Service Worker sends the request to `https://www.googleapis.com/drive/v3/files/{fileId}?alt=media` with `Authorization: Bearer <token>` and `Range`.
  6. The Service Worker pipes the Google Drive `206 Partial Content` response directly back to the `<audio>` tag.
  7. This enables true progressive chunked streaming, instantaneous seeking, and minimal memory usage without needing a backend server!


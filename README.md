# Personal Cloud Music Player (PWA)

A private, secure, lightweight personal music streaming Progressive Web App (PWA) that streams your music collection directly from Google Drive.

Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Google Drive API v3**.

---

## Key Features

- **Direct Google Drive Streaming**: Progressive chunked streaming without downloading entire songs into memory.
- **Cross-Platform Responsive PWA**: Works on Android Chrome, iOS Safari, and Desktop browsers.
- **Background Playback & Lock-Screen Controls**: Integration with the `MediaSession` API for lock-screen artwork, notifications, track controls, and Bluetooth headset events.
- **Privacy & Security First**: Zero client secrets, in-memory tokens, read-only permissions, and local metadata caching via IndexedDB.
- **Audio Format Support**: MP3, FLAC, M4A, AAC, and WAV.
- **Modern Music UI**: Spotify/Apple Music-inspired dark theme with mini-player, full now-playing view, playlists, search, and library management.

---

## Architecture Documentation

- [`AGENTS.md`](./AGENTS.md) - Development rules and guidelines.
- [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) - Deep architectural and streaming details.
- [`CURRENT_STATE.md`](./CURRENT_STATE.md) - Active phase progress and milestones.
- [`SECURITY.md`](./SECURITY.md) - Security threat model, scopes, and token protections.

---

## Setup & Configuration

### Prerequisites
- Node.js (v18+ recommended)
- A Google Cloud Project with:
  - **Google Drive API** enabled
  - **Google Picker API** enabled
  - **OAuth 2.0 Web Client ID** configured with Authorized JavaScript Origins

### Environment Variables
Create a `.env` file in the project root:
```env
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_google_picker_api_key
VITE_GOOGLE_APP_ID=your_google_cloud_project_number
```

### Installation & Development
```bash
npm install
npm run dev
```


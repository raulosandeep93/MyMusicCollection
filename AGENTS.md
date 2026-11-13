# AGENTS.md - Development Rules & Operational Instructions

## Mission
Build a lightweight, responsive, and secure Personal Cloud Music Player (PWA) using Google Drive as the music library, functioning seamlessly across Android Chrome, iOS Safari, and Desktop browsers.

## Core Directives for Autonomous & Pair Operations
1. **Never Compromise Security**:
   - Never store OAuth access tokens, refresh tokens, or client credentials in `localStorage`, `sessionStorage`, or cookies.
   - Keep access tokens exclusively in-memory (or worker state).
   - Never expose OAuth client secrets in frontend client code.
   - Restrict Google OAuth scopes to the minimal necessary (`drive.file` investigation first, then `drive.readonly` if folder hierarchy traversal fails).
   - Never modify, delete, or upload files to user's Google Drive. Read-only operations only.
2. **Streaming & Memory Efficiency**:
   - Do NOT load entire audio files (e.g. 50MB+ FLAC/WAV) into memory blobs for playback.
   - Implement progressive streaming via Service Worker Range request interception or verified stream pipelines.
   - Audio must seek reliably without crashing mobile browser memory limits.
3. **Cross-Platform Background Audio**:
   - Android and iOS have distinct background playback policies.
   - Always wire the `MediaSession` API (`navigator.mediaSession`) with complete action handlers and lock-screen metadata.
   - Never mark mobile background playback as complete based solely on desktop browser testing.
4. **Documentation Continuity**:
   - Maintain and update `CURRENT_STATE.md` after every development phase.
   - Document all security evaluations in `SECURITY.md`.
   - Update `PROJECT_CONTEXT.md` whenever architectural decisions evolve.
5. **Phase-Gated Implementation**:
   - Do not skip ahead or implement multiple unverified phases simultaneously.
   - Validate architectural assumptions before building high-level UI.


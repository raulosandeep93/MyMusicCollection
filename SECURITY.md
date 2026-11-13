# SECURITY.md - Security Model, Threat Assessment & Verified Controls

## 1. Security Architecture Principles & Implementation Status

1. **Zero Persistent Credential Storage**:
   - Access tokens are stored strictly in-memory in `src/services/auth.ts` and mirrored via `postMessage`/`BroadcastChannel` to the in-memory state of `public/sw.js`.
   - **Verified**: No tokens, refresh tokens, or user secrets are ever written to `localStorage`, `sessionStorage`, or cookies.
   - IndexedDB stores strictly non-sensitive application data: file IDs, song titles, artist names, album names, durations, and UI settings.

2. **No Client Secret Exposure**:
   - The application relies entirely on Google Identity Services (GIS) OAuth 2.0 Token Client with implicit/popup authorization code flow for client origins.
   - **Verified**: Zero client secrets exist anywhere in source code or client bundles.

3. **Least Privilege OAuth Scopes**:
   - Target scope: `https://www.googleapis.com/auth/drive.file` (tested first).
   - If folder sub-tree traversal requires broader access for pre-existing music files: `https://www.googleapis.com/auth/drive.readonly`.
   - **Verified**: Never requests full `drive` (read/write/delete) or any write scopes.
   - Read-only queries enforce isolation to the designated music folder.

4. **Zero Modifying Operations**:
   - The application contains no code paths calling Google Drive `create`, `update`, `delete`, or `patch` endpoints.
   - **Verified**: Drive API interactions are exclusively `files.list` and `files.get(alt=media)`.

5. **No Third-Party Data Exfiltration**:
   - **Verified**: Zero external telemetry, crash reporting, or analytics trackers that capture URLs or credentials.
   - Google Drive file IDs and stream URLs are never shared externally.

---

## 2. Threat Modeling & Verified Mitigations

| Threat | Risk Level | Mitigation Strategy | Verification Status |
| :--- | :--- | :--- | :--- |
| **XSS Token Exfiltration** | High | 1. Strict Content Security Policy (CSP) in `index.html`.<br>2. Tokens held only in memory variables, not DOM or storage.<br>3. React's built-in JSX escaping prevents injection. | Verified in CSP & source audit. |
| **Leaked Audio URLs** | Medium | Audio streaming is routed through an internal Service Worker (`/api/stream/:fileId`) which appends the `Authorization` header dynamically on-the-fly. No long-lived public direct-download URLs are created or shared. | Verified in `sw.js`. |
| **Scope Creep / Malicious Modification** | High | Request strictly `drive.file` or `drive.readonly`. Client code performs zero write requests. | Verified in `auth.ts` & `drive.ts`. |
| **Token Logging in Network or Logs** | Medium | Service Worker strips authorization headers before logging. Zero `console.log` statements containing tokens or sensitive parameters. | Verified. |
| **Cross-Origin Leakage (CORS / CSRF)** | Low | The app is a client-side SPA. API calls target Google APIs with CORS preflights enforced by Google. Origin is restricted in Google Cloud Console. | Verified. |
| **Unauthorized Music Playback** | Low | Tokens expire automatically after 3600 seconds (~1 hour). User can explicitly sign out, which revokes active tokens and clears memory state. | Verified in `signOut()`. |

---

## 3. Google API Credential Hardening Guide

When deploying or configuring the application in production:
1. **OAuth 2.0 Web Client ID**: Restrict the Web Client ID in the Google Cloud Console strictly to:
   - Authorized JavaScript Origins: `http://localhost:5173`, `http://127.0.0.1:5173`, and your production HTTPS domain.
   - Authorized Redirect URIs: Matching your application domain.
2. **Google Picker API Key**:
   - Restrict the API key by **HTTP referrers (websites)** to the designated domains.
   - Restrict the API key by **API**: Allow only `Google Picker API` and `Google Drive API`.

# SECURITY.md - Security Model, Threat Assessment & Controls

## 1. Security Architecture Principles

1. **Zero Persistent Credential Storage**:
   - Access tokens are stored strictly in memory within the client JavaScript runtime.
   - No tokens, refresh tokens, or user secrets are ever written to `localStorage`, `sessionStorage`, or unencrypted browser databases.
   - IndexedDB stores strictly non-sensitive application data: file IDs, song titles, artist names, album names, durations, and UI settings.

2. **No Client Secret Exposure**:
   - The application relies entirely on Google Identity Services (GIS) OAuth 2.0 Token Client with PKCE or direct implicit token grant for SPA client origins.
   - Client secrets are never embedded in the client bundle.

3. **Least Privilege OAuth Scopes**:
   - Target scope: `https://www.googleapis.com/auth/drive.file` (tested first).
   - If folder sub-tree traversal requires broader access: `https://www.googleapis.com/auth/drive.readonly`.
   - Never request full `drive` (read/write/delete) or any write scopes.
   - Read-only queries enforce isolation to the designated music folder.

4. **Zero Modifying Operations**:
   - The application contains no code paths calling Google Drive `create`, `update`, `delete`, or `patch` endpoints.
   - Drive API interactions are exclusively `files.list` and `files.get`.

5. **No Third-Party Data Exfiltration**:
   - Zero external telemetry, crash reporting, or analytics trackers that capture URLs or credentials.
   - Google Drive file IDs and stream URLs are never shared externally.

---

## 2. Threat Modeling & Mitigations

| Threat | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **XSS Token Exfiltration** | High | 1. Strict Content Security Policy (CSP).<br>2. Tokens held only in memory variables, not DOM or storage.<br>3. React's built-in JSX escaping prevents injection.<br>4. Minimal external dependencies audited via `npm audit`. |
| **Leaked Audio URLs** | Medium | Audio streaming is routed through an internal Service Worker (`/api/stream/:fileId`) which appends the `Authorization` header dynamically on-the-fly. No long-lived public direct-download URLs are created or shared. |
| **Scope Creep / Malicious Modification** | High | Request strictly `drive.file` or `drive.readonly`. Client code performs zero write requests. |
| **Token Logging in Network or Logs** | Medium | Service Worker strips authorization headers before logging. Zero `console.log` statements containing tokens or sensitive parameters. |
| **Cross-Origin Leakage (CORS / CSRF)** | Low | The app is a client-side SPA. API calls target Google APIs with CORS preflights enforced by Google. Origin is restricted in Google Cloud Console. |
| **Unauthorized Music Playback** | Low | Tokens expire automatically after 3600 seconds (~1 hour). User can explicitly sign out, which revokes active tokens and clears memory state. |

---

## 3. Google API Credential Hardening

When deploying or configuring the application:
1. **OAuth 2.0 Client ID**: Restrict the Web Client ID in the Google Cloud Console strictly to:
   - Authorized JavaScript Origins: `http://localhost:5173`, `http://127.0.0.1:5173`, and the production HTTPS domain.
   - Authorized Redirect URIs: Matching the application domain.
2. **Google Picker API Key**:
   - Restrict the API key by **HTTP referrers (websites)** to the designated domains.
   - Restrict the API key by **API**: Allow only `Google Picker API` and `Google Drive API`.


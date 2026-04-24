# Google OAuth setup (Slice 2)

This app uses OAuth on the API only:

- `GET /api/auth/google/start` creates PKCE + state and redirects to Google.
- `GET /api/auth/google/callback` exchanges code for tokens, stores encrypted refresh token, sets an httpOnly session cookie, and redirects to `PUBLIC_WEB_ORIGIN/photos`.
- `GET /api/auth/me` returns current session user or `401`.
- `POST /api/auth/logout` clears auth cookies.

## 1) Create OAuth client in Google Cloud

1. Open Google Cloud Console.
2. Create/select a project.
3. Enable **Google Drive API**.
4. Configure OAuth consent screen (internal/testing while in development).
5. Create OAuth client type **Web application**.
6. Add authorized redirect URIs:
   - Local API callback: `http://localhost:8080/api/auth/google/callback`
   - Render callback (later): `https://<your-api>.onrender.com/api/auth/google/callback`

## 2) Configure local env

Copy:

```bash
cp apps/api/.env.example apps/api/.env
```

Set:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI` (must exactly match one configured in GCP)
- `PUBLIC_WEB_ORIGIN` (for local dev: `http://localhost:5173`)
- `SESSION_SECRET` (random long value)
- `REFRESH_TOKEN_ENCRYPTION_KEY` (recommended separate secret)

For split-host deploys (Vercel + Render), set:

- `CORS_ORIGIN=https://<your-web>.vercel.app`
- `PUBLIC_WEB_ORIGIN=https://<your-web>.vercel.app`
- `NODE_ENV=production` (cookie uses `SameSite=None; Secure`)

## 3) Verify locally

1. Start API + web (`pnpm dev`).
2. Open web and click **Sign in with Google**.
3. Complete consent.
4. Confirm:
   - callback redirects to `/photos`
   - `/api/auth/me` returns `{ id, googleSub }`
   - `POST /api/auth/logout` clears session.

## Notes

- No OAuth secrets belong in `apps/web` env.
- If Google does not return `refresh_token`, remove app access from your Google account and re-consent.

export function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required auth env: ${name}`);
  }
  return value;
}

export type AuthEnv = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webOrigin: string;
  sessionSecret: string;
  sessionCookieName: string;
  oauthCookieName: string;
  scope: string;
  sessionTtlSec: number;
  oauthStateTtlSec: number;
  isProd: boolean;
};

export function getAuthEnv(): AuthEnv {
  return {
    clientId: requiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: requiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
    webOrigin: requiredEnv("PUBLIC_WEB_ORIGIN"),
    sessionSecret: requiredEnv("SESSION_SECRET"),
    sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || "photo_gallery_session",
    oauthCookieName: process.env.OAUTH_STATE_COOKIE_NAME?.trim() || "photo_gallery_oauth",
    scope:
      process.env.GOOGLE_OAUTH_SCOPE?.trim() ||
      "openid profile email https://www.googleapis.com/auth/drive.readonly",
    sessionTtlSec: Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 7),
    oauthStateTtlSec: Number(process.env.OAUTH_STATE_TTL_SECONDS ?? 10 * 60),
    isProd: process.env.NODE_ENV === "production",
  };
}

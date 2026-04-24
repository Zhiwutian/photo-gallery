import { getAuthEnv } from "../auth/env.js";

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = getAuthEnv();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "token_refresh_failed");
  }
  if (!json.access_token) {
    throw new Error("token_refresh_missing_access_token");
  }
  return json.access_token;
}

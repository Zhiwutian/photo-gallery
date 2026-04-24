import crypto from "node:crypto";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
};

type UserInfoResponse = {
  sub: string;
};

export type OAuthStartParams = {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge: string;
};

export type ExchangedIdentity = {
  googleSub: string;
  refreshToken: string;
};

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function createGoogleAuthUrl(params: OAuthStartParams): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Google OAuth request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function exchangeAuthCode(
  code: string,
  verifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<ExchangedIdentity> {
  const token = await fetchJson<TokenResponse>("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!token.refresh_token) {
    throw new Error("Google did not return refresh_token; user may need to re-consent.");
  }

  const userInfo = await fetchJson<UserInfoResponse>(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { authorization: `Bearer ${token.access_token}` },
    },
  );

  return {
    googleSub: userInfo.sub,
    refreshToken: token.refresh_token,
  };
}

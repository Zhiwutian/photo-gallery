import express from "express";
import request from "supertest";
import type { Response as SupertestResponse } from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthRouter } from "./router.js";

const BASE_ENV = {
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  GOOGLE_OAUTH_REDIRECT_URI: "http://localhost:8080/api/auth/google/callback",
  PUBLIC_WEB_ORIGIN: "http://localhost:5173",
  SESSION_SECRET: "test-session-secret",
  SESSION_COOKIE_NAME: "pg_session",
  OAUTH_STATE_COOKIE_NAME: "pg_oauth",
  SESSION_TTL_SECONDS: "3600",
  OAUTH_STATE_TTL_SECONDS: "600",
  NODE_ENV: "test",
};

function buildApp(deps?: Parameters<typeof createAuthRouter>[0]) {
  const app = express();
  app.use("/api/auth", createAuthRouter(deps));
  return app;
}

function setCookieHeader(res: SupertestResponse): string[] {
  const value = res.headers["set-cookie"];
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

describe("auth router", () => {
  beforeEach(() => {
    Object.assign(process.env, BASE_ENV);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 for /me without session", async () => {
    const app = buildApp({
      exchangeAuthCode: vi.fn(),
      upsertOAuthUser: vi.fn(),
      findSessionUser: vi.fn(),
    });
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("redirects to Google auth with PKCE and sets oauth cookie", async () => {
    const app = buildApp({
      exchangeAuthCode: vi.fn(),
      upsertOAuthUser: vi.fn(),
      findSessionUser: vi.fn(),
    });
    const res = await request(app).get("/api/auth/google/start");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("accounts.google.com");
    expect(res.headers.location).toContain("code_challenge_method=S256");
    expect(setCookieHeader(res).join(" ")).toContain("pg_oauth=");
  });

  it("handles callback, stores user, and issues session cookie", async () => {
    const exchangeAuthCode = vi.fn().mockResolvedValue({
      googleSub: "google-sub-1",
      refreshToken: "refresh-abc",
    });
    const upsertOAuthUser = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "google-sub-1",
      refreshTokenVersion: 0,
    });

    const app = buildApp({
      exchangeAuthCode,
      upsertOAuthUser,
      findSessionUser: vi.fn(),
    });

    const start = await request(app).get("/api/auth/google/start");
    const oauthCookie = setCookieHeader(start).find((c) => c.includes("pg_oauth="));
    if (!oauthCookie) {
      throw new Error("expected pg_oauth cookie");
    }
    const stateParam = new URL(start.headers.location, "http://localhost").searchParams.get("state");
    if (!stateParam) {
      throw new Error("missing state");
    }

    const callback = await request(app)
      .get(`/api/auth/google/callback?code=test-code&state=${encodeURIComponent(stateParam)}`)
      .set("cookie", oauthCookie);

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/photos");
    expect(exchangeAuthCode).toHaveBeenCalledOnce();
    expect(upsertOAuthUser).toHaveBeenCalledWith("google-sub-1", "refresh-abc");
    const setCookie = setCookieHeader(callback).join(" ");
    expect(setCookie).toContain("pg_session=");
  });

  it("logout clears cookies", async () => {
    const app = buildApp({
      exchangeAuthCode: vi.fn(),
      upsertOAuthUser: vi.fn(),
      findSessionUser: vi.fn(),
    });
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(204);
    const setCookie = setCookieHeader(res).join(" ");
    expect(setCookie).toContain("pg_session=");
    expect(setCookie).toContain("pg_oauth=");
  });
});

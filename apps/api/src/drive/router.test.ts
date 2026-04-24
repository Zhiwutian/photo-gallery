import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthEnv } from "../auth/env.js";
import { createSignedPayload } from "../auth/session.js";
import { createDriveRouter } from "./router.js";

const BASE_ENV = {
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  GOOGLE_OAUTH_REDIRECT_URI: "http://localhost:8080/api/auth/google/callback",
  PUBLIC_WEB_ORIGIN: "http://localhost:5173",
  SESSION_SECRET: "test-session-secret",
  SESSION_COOKIE_NAME: "pg_session",
  OAUTH_STATE_COOKIE_NAME: "pg_oauth",
  NODE_ENV: "test",
  DRIVE_RATE_LIMIT_MAX: "100000",
};

function buildApp(deps?: Parameters<typeof createDriveRouter>[0]) {
  const app = express();
  app.use("/api/drive", createDriveRouter(deps));
  return app;
}

function sessionCookie(): string {
  const cfg = getAuthEnv();
  const value = createSignedPayload(
    {
      userId: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    cfg.sessionSecret,
  );
  return `${cfg.sessionCookieName}=${encodeURIComponent(value)}`;
}

describe("drive router", () => {
  beforeEach(() => {
    Object.assign(process.env, BASE_ENV);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 without session cookie", async () => {
    const app = buildApp({
      refreshGoogleAccessToken: vi.fn(),
      isFileUnderFolder: vi.fn(),
      findSessionUser: vi.fn(),
      findUserWithRefreshToken: vi.fn(),
    });
    const res = await request(app).get("/api/drive/folders/f1/files");
    expect(res.status).toBe(401);
  });

  it("lists files in folder", async () => {
    const refreshGoogleAccessToken = vi.fn().mockResolvedValue("access-token");
    const findSessionUser = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
    });
    const findUserWithRefreshToken = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
      refreshToken: "refresh",
    });
    const isFileUnderFolder = vi.fn();

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("https://www.googleapis.com/drive/v3/files?")) {
        return new Response(JSON.stringify({ files: [{ id: "img1" }], nextPageToken: "nxt" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("unexpected", { status: 500 });
    });

    const app = buildApp({
      refreshGoogleAccessToken,
      isFileUnderFolder,
      findSessionUser,
      findUserWithRefreshToken,
    });

    const res = await request(app)
      .get("/api/drive/folders/folder-abc/files?pageSize=10")
      .set("Cookie", sessionCookie());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ files: [{ id: "img1" }], nextPageToken: "nxt" });
    expect(refreshGoogleAccessToken).toHaveBeenCalledWith("refresh");
  });

  it("returns 404 for media when not under folder", async () => {
    const refreshGoogleAccessToken = vi.fn().mockResolvedValue("access-token");
    const findSessionUser = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
    });
    const findUserWithRefreshToken = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
      refreshToken: "refresh",
    });
    const isFileUnderFolder = vi.fn().mockResolvedValue(false);

    const app = buildApp({
      refreshGoogleAccessToken,
      isFileUnderFolder,
      findSessionUser,
      findUserWithRefreshToken,
    });

    const res = await request(app)
      .get("/api/drive/files/file-xyz/media?folderId=folder-abc")
      .set("Cookie", sessionCookie());

    expect(res.status).toBe(404);
    expect(isFileUnderFolder).toHaveBeenCalled();
  });

  it("streams media when under folder", async () => {
    const refreshGoogleAccessToken = vi.fn().mockResolvedValue("access-token");
    const findSessionUser = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
    });
    const findUserWithRefreshToken = vi.fn().mockResolvedValue({
      id: "u1",
      googleSub: "sub1",
      refreshTokenVersion: 0,
      refreshToken: "refresh",
    });
    const isFileUnderFolder = vi.fn().mockResolvedValue(true);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("alt=media")) {
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        });
      }
      return new Response("unexpected", { status: 500 });
    });

    const app = buildApp({
      refreshGoogleAccessToken,
      isFileUnderFolder,
      findSessionUser,
      findUserWithRefreshToken,
    });

    const res = await request(app)
      .get("/api/drive/files/file-xyz/media?folderId=folder-abc")
      .set("Cookie", sessionCookie());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/jpeg");
    expect(Buffer.isBuffer(res.body) ? res.body.length : String(res.body).length).toBeGreaterThan(0);
  });
});

import type { Request, Response } from "express";
import { Router } from "express";
import { readCookie } from "./cookies.js";
import { getAuthEnv } from "./env.js";
import {
  createGoogleAuthUrl,
  exchangeAuthCode,
  pkceChallenge,
  randomToken,
} from "./google-oauth.js";
import { clearCookie, createSignedPayload, parseSignedPayload, setSessionCookie } from "./session.js";
import { parseGallerySessionCookie } from "./session-request.js";
import { findSessionUser, upsertOAuthUser } from "./store.js";

type OAuthCookiePayload = {
  state: string;
  verifier: string;
  exp: number;
};

type AuthRouterDeps = {
  exchangeAuthCode: typeof exchangeAuthCode;
  upsertOAuthUser: typeof upsertOAuthUser;
  findSessionUser: typeof findSessionUser;
};

const defaultDeps: AuthRouterDeps = {
  exchangeAuthCode,
  upsertOAuthUser,
  findSessionUser,
};

export function createAuthRouter(deps: AuthRouterDeps = defaultDeps): Router {
  const router = Router();

  router.get("/google/start", (_req, res) => {
    const cfg = getAuthEnv();
    const state = randomToken(24);
    const verifier = randomToken(48);

    const oauthPayload: OAuthCookiePayload = {
      state,
      verifier,
      exp: Math.floor(Date.now() / 1000) + cfg.oauthStateTtlSec,
    };

    res.cookie(cfg.oauthCookieName, createSignedPayload(oauthPayload, cfg.sessionSecret), {
      httpOnly: true,
      secure: cfg.isProd,
      sameSite: cfg.isProd ? "none" : "lax",
      path: "/",
      maxAge: cfg.oauthStateTtlSec * 1000,
    });

    res.redirect(
      createGoogleAuthUrl({
        clientId: cfg.clientId,
        redirectUri: cfg.redirectUri,
        scope: cfg.scope,
        state,
        codeChallenge: pkceChallenge(verifier),
      }),
    );
  });

  router.get("/google/callback", async (req, res) => {
    const cfg = getAuthEnv();
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";

    if (!code || !state) {
      res.status(400).json({ error: "Missing code/state." });
      return;
    }

    const oauth = parseSignedPayload<OAuthCookiePayload>(
      readCookie(req, cfg.oauthCookieName),
      cfg.sessionSecret,
    );
    if (!oauth || oauth.state !== state) {
      res.status(400).json({ error: "Invalid OAuth state." });
      return;
    }

    const identity = await deps.exchangeAuthCode(
      code,
      oauth.verifier,
      cfg.clientId,
      cfg.clientSecret,
      cfg.redirectUri,
    );
    const user = await deps.upsertOAuthUser(identity.googleSub, identity.refreshToken);

    setSessionCookie(
      res,
      cfg.sessionCookieName,
      {
        userId: user.id,
        googleSub: user.googleSub,
        refreshTokenVersion: user.refreshTokenVersion,
        exp: Math.floor(Date.now() / 1000) + cfg.sessionTtlSec,
      },
      cfg.sessionSecret,
      { maxAgeMs: cfg.sessionTtlSec * 1000, isProd: cfg.isProd },
    );
    clearCookie(res, cfg.oauthCookieName, cfg.isProd);
    res.redirect(new URL("/photos", cfg.webOrigin).toString());
  });

  router.get("/me", async (req: Request, res: Response) => {
    const cfg = getAuthEnv();
    const session = parseGallerySessionCookie(req, cfg.sessionSecret, cfg.sessionCookieName);
    if (!session) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    const user = await deps.findSessionUser(
      session.userId,
      session.googleSub,
      session.refreshTokenVersion,
    );
    if (!user) {
      clearCookie(res, cfg.sessionCookieName, cfg.isProd);
      res.status(401).json({ error: "Session expired." });
      return;
    }
    res.json({ id: user.id, googleSub: user.googleSub });
  });

  router.post("/logout", (_req, res) => {
    const cfg = getAuthEnv();
    clearCookie(res, cfg.sessionCookieName, cfg.isProd);
    clearCookie(res, cfg.oauthCookieName, cfg.isProd);
    res.status(204).send();
  });

  return router;
}

import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Readable } from "node:stream";
import { z } from "zod";
import { getAuthEnv } from "../auth/env.js";
import { parseGallerySessionCookie } from "../auth/session-request.js";
import { findSessionUser, findUserWithRefreshToken } from "../auth/store.js";
import { isFileUnderFolder } from "./parentage.js";
import { refreshGoogleAccessToken } from "./refresh-access-token.js";

type GalleryLocals = {
  gallery: {
    userId: string;
    getAccessToken: () => Promise<string>;
  };
};

function galleryCtx(res: Response): GalleryLocals["gallery"] {
  const locals = res.locals as GalleryLocals;
  if (!locals.gallery) {
    throw new Error("Missing gallery context");
  }
  return locals.gallery;
}

const folderIdParam = z.object({
  folderId: z.string().min(2).max(512),
});

const fileIdParam = z.object({
  fileId: z.string().min(2).max(512),
});

const filesQuery = z.object({
  pageToken: z.string().max(4096).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().max(400).optional(),
});

const folderScopeQuery = z.object({
  folderId: z.string().min(2).max(512),
});

const driveReadLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.DRIVE_RATE_LIMIT_MAX ?? 240),
  standardHeaders: true,
  legacyHeaders: false,
});

export type DriveRouterDeps = {
  refreshGoogleAccessToken: typeof refreshGoogleAccessToken;
  isFileUnderFolder: typeof isFileUnderFolder;
  findSessionUser: typeof findSessionUser;
  findUserWithRefreshToken: typeof findUserWithRefreshToken;
};

const defaultDeps: DriveRouterDeps = {
  refreshGoogleAccessToken,
  isFileUnderFolder,
  findSessionUser,
  findUserWithRefreshToken,
};

function zodErrorResponse(res: Response, err: z.ZodError): void {
  res.status(400).json({ error: "invalid_request", issues: err.issues });
}

export function createDriveRouter(deps: DriveRouterDeps = defaultDeps): Router {
  const router = Router();
  router.use(driveReadLimiter);

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
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
        res.status(401).json({ error: "Session expired." });
        return;
      }
      const row = await deps.findUserWithRefreshToken(
        session.userId,
        session.googleSub,
        session.refreshTokenVersion,
      );
      if (!row) {
        res.status(403).json({ error: "No Google refresh token stored; sign in again." });
        return;
      }
      let cached: string | undefined;
      const getAccessToken = async () => {
        if (cached) {
          return cached;
        }
        cached = await deps.refreshGoogleAccessToken(row.refreshToken);
        return cached;
      };
      (res.locals as GalleryLocals).gallery = { userId: user.id, getAccessToken };
      next();
    } catch (err) {
      next(err);
    }
  });

  router.get("/folders/:folderId/files", async (req, res, next) => {
    try {
      const { folderId } = folderIdParam.parse(req.params);
      const query = filesQuery.parse(req.query);
      const pageSize = query.pageSize ?? 50;
      const escapedFolder = folderId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const parts = [`'${escapedFolder}' in parents`, "trashed = false", "mimeType contains 'image/'"];
      if (query.q?.trim()) {
        parts.push(`(${query.q.trim()})`);
      }
      const q = parts.join(" and ");
      const params = new URLSearchParams({
        q,
        spaces: "drive",
        fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,webContentLink,size)",
        pageSize: String(pageSize),
        orderBy: "folder,name_natural",
        supportsAllDrives: "true",
      });
      if (query.pageToken) {
        params.set("pageToken", query.pageToken);
      }
      const token = await galleryCtx(res).getAccessToken();
      const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        res.status(502).json({ error: "drive_list_failed" });
        return;
      }
      const body = (await r.json()) as { files?: unknown[]; nextPageToken?: string };
      res.json({ files: body.files ?? [], nextPageToken: body.nextPageToken });
    } catch (e) {
      if (e instanceof z.ZodError) {
        zodErrorResponse(res, e);
        return;
      }
      next(e);
    }
  });

  router.get("/files/:fileId/meta", async (req, res, next) => {
    try {
      const { fileId } = fileIdParam.parse(req.params);
      const { folderId } = folderScopeQuery.parse(req.query);
      const token = await galleryCtx(res).getAccessToken();
      const ok = await deps.isFileUnderFolder(fetch, token, fileId, folderId);
      if (!ok) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      const params = new URLSearchParams({
        fields:
          "id,name,mimeType,size,parents,thumbnailLink,webContentLink,imageMediaMetadata,width,height",
        supportsAllDrives: "true",
      });
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!r.ok) {
        res.status(502).json({ error: "drive_meta_failed" });
        return;
      }
      res.json(await r.json());
    } catch (e) {
      if (e instanceof z.ZodError) {
        zodErrorResponse(res, e);
        return;
      }
      next(e);
    }
  });

  router.get("/files/:fileId/media", async (req, res, next) => {
    try {
      const { fileId } = fileIdParam.parse(req.params);
      const { folderId } = folderScopeQuery.parse(req.query);
      const token = await galleryCtx(res).getAccessToken();
      const ok = await deps.isFileUnderFolder(fetch, token, fileId, folderId);
      if (!ok) {
        res.status(404).json({ error: "not_found" });
        return;
      }
      const upstream = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!upstream.ok || !upstream.body) {
        res.status(502).json({ error: "drive_media_failed" });
        return;
      }
      const ct = upstream.headers.get("content-type");
      if (ct) {
        res.setHeader("content-type", ct);
      }
      Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
    } catch (e) {
      if (e instanceof z.ZodError) {
        zodErrorResponse(res, e);
        return;
      }
      next(e);
    }
  });

  return router;
}

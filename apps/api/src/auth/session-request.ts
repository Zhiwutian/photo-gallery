import type { Request } from "express";
import { readCookie } from "./cookies.js";
import { parseSignedPayload } from "./session.js";

export type GallerySessionPayload = {
  userId: string;
  googleSub: string;
  refreshTokenVersion: number;
  exp: number;
};

export function parseGallerySessionCookie(
  req: Request,
  secret: string,
  cookieName: string,
): GallerySessionPayload | null {
  return parseSignedPayload<GallerySessionPayload>(readCookie(req, cookieName), secret);
}

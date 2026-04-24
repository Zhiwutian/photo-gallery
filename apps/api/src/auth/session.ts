import crypto from "node:crypto";
import type { Response } from "express";

export type SessionPayload = {
  userId: string;
  googleSub: string;
  refreshTokenVersion: number;
  exp: number;
};

type SignedPayload = {
  exp: number;
  [key: string]: unknown;
};

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function hmac(data: string, secret: string): Buffer {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export function createSignedPayload<T extends SignedPayload>(payload: T, secret: string): string {
  const encoded = base64Url(JSON.stringify(payload));
  const signature = base64Url(hmac(encoded, secret));
  return `${encoded}.${signature}`;
}

export function parseSignedPayload<T extends SignedPayload>(
  value: string | undefined,
  secret: string,
): T | null {
  if (!value) {
    return null;
  }
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = hmac(encoded, secret);
  const supplied = decodeBase64Url(signature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return null;
  }
  try {
    const parsed = JSON.parse(decodeBase64Url(encoded).toString("utf8")) as T;
    if (typeof parsed.exp !== "number" || parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

type CookieOptions = {
  maxAgeMs: number;
  isProd: boolean;
};

export function setSessionCookie(
  res: Response,
  cookieName: string,
  payload: SessionPayload,
  secret: string,
  opts: CookieOptions,
): void {
  res.cookie(cookieName, createSignedPayload(payload, secret), {
    httpOnly: true,
    secure: opts.isProd,
    sameSite: opts.isProd ? "none" : "lax",
    path: "/",
    maxAge: opts.maxAgeMs,
  });
}

export function clearCookie(res: Response, cookieName: string, isProd: boolean): void {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

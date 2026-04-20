import "server-only";

import crypto from "crypto";

export const AUTH_COOKIE_NAME = "iam_auth";
export const AUTH_SESSION_HOURS = 12;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(derived));
  } catch {
    return false;
  }
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiresAtIso() {
  return new Date(Date.now() + AUTH_SESSION_HOURS * 60 * 60 * 1000).toISOString();
}

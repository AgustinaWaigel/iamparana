import { NextResponse } from "next/server";
import { getSessionUserByTokenHash, SessionUser, UserRole } from "@/db/auth-repository";
import { AUTH_COOKIE_NAME, hashSessionToken } from "@/lib/auth-security";

export type Permission =
  | "content.read"
  | "content.write"
  | "content.delete"
  | "users.manage"
  | "comments.moderate";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ["content.read", "content.write", "content.delete", "users.manage", "comments.moderate"],
  editor: ["content.read", "content.write"],
  moderator: ["content.read", "comments.moderate"],
  viewer: ["content.read"],
};

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export function serverError(error = "Error interno") {
  return NextResponse.json({ error }, { status: 500 });
}

export function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug);
}

function forbidden() {
  return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
}

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((value) => value.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);
  if (!token) {
    return null;
  }

  const user = await getSessionUserByTokenHash(hashSessionToken(token));
  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function requirePermission(req: Request, permission: Permission) {
  const user = await getSessionUser(req);
  if (!user) {
    return { response: unauthorized() };
  }

  if (!hasPermission(user.role, permission)) {
    return { response: forbidden() };
  }

  return { user };
}

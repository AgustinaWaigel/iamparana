import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUserByTokenHash, UserRole } from "@/db/auth-repository";
import { AUTH_COOKIE_NAME, hashSessionToken } from "@/lib/auth-security";

// 1. Tipado de Permisos
export type Permission =
  | "content.read"
  | "content.write"
  | "content.delete"
  | "users.manage"
  | "comments.moderate";

// 2. Mapeo de Roles de la IAM
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ["content.read", "content.write", "content.delete", "users.manage", "comments.moderate"],
  equipo: ["content.read", "content.write", "comments.moderate"],
  redactor: ["content.read", "content.write"],
  coordinador: ["content.read", "comments.moderate"],
  animador: ["content.read"],
};

// 3. Helpers de Respuesta
export const unauthorized = () => 
  NextResponse.json({ error: "No autorizado. Iniciá sesión." }, { status: 401 });

export const forbidden = () => 
  NextResponse.json({ error: "Permisos insuficientes para esta acción." }, { status: 403 });

export const badRequest = (error: string) => 
  NextResponse.json({ error }, { status: 400 });

export const serverError = (error = "Error interno del servidor") => 
  NextResponse.json({ error }, { status: 500 });

/**
 * 4. Validador de ID numérico (Crucial para rutas [id])
 */
export function parseId(id: string | number | undefined | null): number | null {
  if (id === undefined || id === null) return null;
  const parsed = Number(id);
  // Verifica que sea un número entero, no sea NaN y sea mayor a 0
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/**
 * 5. Validador de Slug (Para noticias y canciones)
 */
export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug);
}

// 6. Obtener usuario de la sesión actual
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) return null;

    const user = await getSessionUserByTokenHash(hashSessionToken(token));
    
    if (!user || !user.isActive) return null;

    return user;
  } catch (error) {
    console.error("Auth helper error:", error);
    return null;
  }
}

// 7. Protector de Rutas API
export async function requirePermission(permission: Permission) {
  const user = await getSessionUser();
  
  if (!user) {
    return { errorResponse: unauthorized() };
  }

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  if (!permissions.includes(permission)) {
    return { errorResponse: forbidden() };
  }

  return { user };
}
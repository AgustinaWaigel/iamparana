import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Usamos el helper oficial
import { getSessionUserByTokenHash, UserRole } from "@/server/db/auth-repository";
import { AUTH_COOKIE_NAME, hashSessionToken } from "@/server/lib/auth-security";

// 1. Tipado de Permisos
export type Permission =
  | "content.read"
  | "content.write"
  | "content.delete"
  | "users.manage"
  | "comments.moderate";

export type ManagedArea = "animacion" | "comunicacion" | "formacion" | "logistica" | "espiritualidad";

const AREA_ALIASES: Record<string, ManagedArea> = {
  animacion: "animacion", juegos: "animacion", recursos: "animacion", canciones: "animacion",
  comunicacion: "comunicacion", logos: "comunicacion", dibujos: "comunicacion",
  formacion: "formacion",
  logistica: "logistica", presupuestos: "logistica", rendiciones: "logistica", inventario: "logistica",
  espiritualidad: "espiritualidad", oraciones: "espiritualidad", guiones: "espiritualidad",
};

export function resolveManagedArea(value: unknown): ManagedArea | null {
  return AREA_ALIASES[String(value || "").trim().toLowerCase()] ?? null;
}

// 2. Mapeo de Roles (Ajustado a tus roles reales de la IAM)
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ["content.read", "content.write", "content.delete", "users.manage", "comments.moderate"],
  equipo: ["content.read", "content.write", "comments.moderate"],
  redactor: ["content.read", "content.write"],
  coordinador: ["content.read", "comments.moderate"],
  animador: ["content.read"],
};

// 3. Helpers de Respuesta (Estandarizados)
export const unauthorized = () => 
  NextResponse.json({ error: "No autorizado. Iniciá sesión." }, { status: 401 });

export const forbidden = () => 
  NextResponse.json({ error: "No tenés permisos para realizar esta acción." }, { status: 403 });

export const badRequest = (error: string) => 
  NextResponse.json({ error }, { status: 400 });

export const serverError = (error = "Error interno del servidor") => 
  NextResponse.json({ error }, { status: 500 });

// 4. Utilidades de Validación
export function parseId(id: string | number) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && /^[a-z0-9-]+$/.test(slug);
}

// 5. Lógica de Sesión (Simplificada con Next.js 15)
export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) return null;

    const user = await getSessionUserByTokenHash(hashSessionToken(token));
    
    // Verificamos existencia y que la cuenta no haya sido desactivada
    if (!user || !user.isActive) return null;

    return user;
  } catch (error) {
    console.error("Auth helper error:", error);
    return null;
  }
}

// 6. Protector de Rutas API
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

/** Administra todo; un miembro puede crear contenido solamente en sus áreas asignadas. */
export async function requireAreaWrite(areaValue: unknown) {
  const user = await getSessionUser();
  if (!user) return { errorResponse: unauthorized() };
  const area = resolveManagedArea(areaValue);
  if (!area) return { errorResponse: badRequest("Área inválida") };
  if (user.role === "admin" || user.areas.includes(area)) return { user, area };
  return { errorResponse: forbidden() };
}

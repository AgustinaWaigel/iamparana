import "server-only";

import { cookies } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getCuentaSesionByTokenHash, getCuentaSesionByUserId, type CuentaSesion } from "@/server/db/cuentas-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { createSessionToken, hashSessionToken } from "@/server/lib/auth-security";

// Sesión de la cuenta familiar. Tiene su propia cookie (iam_familia), separada de la del
// sitio (iam_auth): una familia nunca obtiene permisos del panel. Un usuario del sitio
// llega a su cuenta familiar solo después de confirmar su email con un código, una vez.

export const CUENTA_COOKIE_NAME = "iam_familia";
export const CUENTA_SESSION_HOURS = 2;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normaliza y valida un email. Devuelve null si no es utilizable. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

/** Crea el token de sesión: el navegador recibe el token, la base solo su huella. */
export function createCuentaToken() {
  const token = createSessionToken();
  return { token, tokenHash: hashSessionToken(token) };
}

export async function setCuentaCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUENTA_COOKIE_NAME, token, {
    httpOnly: true, // JavaScript del navegador no puede leerla
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // no viaja en pedidos iniciados desde otros sitios
    path: "/",
    maxAge: CUENTA_SESSION_HOURS * 60 * 60,
  });
}

export async function clearCuentaCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUENTA_COOKIE_NAME);
}

export async function getCuentaTokenHash(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUENTA_COOKIE_NAME)?.value;
  return token ? hashSessionToken(token) : null;
}

/** Cuenta familiar de la sesión actual, o null. Toda lectura de datos parte de acá. */
export async function getCuentaSesion(): Promise<CuentaSesion | null> {
  try {
    const tokenHash = await getCuentaTokenHash();
    if (tokenHash) {
      const porCodigo = await getCuentaSesionByTokenHash(tokenHash);
      if (porCodigo) return porCodigo;
    }
    // Usuarios del sitio que ya confirmaron su email entran con su sesión de siempre.
    const user = await getSessionUser();
    return user ? await getCuentaSesionByUserId(user.id) : null;
  } catch (error) {
    // Sin datos personales en el registro: solo el tipo de error.
    console.error("cuenta-session: no se pudo leer la sesión", error instanceof Error ? error.name : "error");
    return null;
  }
}

/**
 * Rechaza pedidos que no vienen del propio sitio. Junto con la cookie SameSite=Strict
 * evita que otra página dispare acciones en nombre de una familia.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "desconocida";
}

// ── Límite de intentos ─────────────────────────────────────────────────
// Upstash si está disponible; si falla, un contador en memoria. Nunca se deja pasar sin límite.

type Window = `${number} m`;

const limiters = new Map<string, Ratelimit>();
const localCounters = new Map<string, { count: number; resetAt: number }>();

function localLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const current = localCounters.get(key);
  if (!current || current.resetAt <= now) {
    if (localCounters.size > 5000) localCounters.clear();
    localCounters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= max;
}

/** true si el pedido puede seguir; false si superó el límite. */
export async function checkRateLimit(name: string, key: string, max: number, minutes: number): Promise<boolean> {
  const id = `${name}:${max}:${minutes}`;
  try {
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(max, `${minutes} m` as Window),
        prefix: `iam:inscripciones:${name}`,
      });
      limiters.set(id, limiter);
    }
    const { success } = await limiter.limit(key);
    return success;
  } catch {
    return localLimit(`${id}:${key}`, max, minutes * 60_000);
  }
}

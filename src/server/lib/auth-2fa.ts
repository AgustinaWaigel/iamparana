import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { createSession, deleteAllSessionsByUserId } from "@/server/db/auth-repository";
import { getTursoClient } from "@/server/db/turso";
import { AUTH_COOKIE_NAME, createSessionToken, getSessionExpiresAtIso, hashSessionToken } from "@/server/lib/auth-security";
import { sendAdminLoginCodeEmail } from "@/server/lib/email-service";
import { createAccessCode, hashAccessCode, safeEqual } from "@/server/lib/inscripciones-crypto";

// Segundo paso de verificación para administradores: después de la contraseña (o de
// Google) hay que ingresar un código de 6 dígitos que llega por email. El admin ve
// fichas de salud de menores, así que la contraseña sola no alcanza.
//
// Salida de emergencia: si el envío de emails deja de funcionar y nadie puede entrar,
// poner ADMIN_2FA_DISABLED=1 en las variables de entorno lo desactiva.

export const ADMIN_2FA_COOKIE = "iam_2fa";
const MINUTOS = 10;
const INTENTOS = 5;

let tablaLista: Promise<unknown> | null = null;

function db() {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  if (!tablaLista) {
    tablaLista = client
      .execute(
        `CREATE TABLE IF NOT EXISTS auth_2fa (
          token_hash TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          email TEXT NOT NULL,
          codigo_hash TEXT NOT NULL,
          intentos INTEGER NOT NULL DEFAULT ${INTENTOS},
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      )
      .catch((error) => {
        tablaLista = null;
        throw error;
      });
  }
  return tablaLista.then(() => client);
}

export function requiere2fa(user: { role: string }): boolean {
  return user.role === "admin" && process.env.ADMIN_2FA_DISABLED !== "1";
}

/** Abre la sesión del sitio para un usuario ya verificado y deja la cookie puesta. */
export async function abrirSesion(userId: number): Promise<void> {
  await deleteAllSessionsByUserId(userId);
  const token = createSessionToken();
  const expiresAtIso = getSessionExpiresAtIso();
  await createSession(userId, hashSessionToken(token), expiresAtIso);
  (await cookies()).set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAtIso),
  });
}

/** Manda el código al email del admin y deja una cookie que identifica este intento de ingreso. */
export async function iniciar2fa(user: { id: number; email: string }): Promise<void> {
  const client = await db();
  const code = createAccessCode();
  const token = crypto.randomBytes(32).toString("hex");
  await client.batch([
    { sql: "DELETE FROM auth_2fa WHERE user_id = ? OR expires_at <= DATETIME('now')", args: [user.id] },
    {
      sql: `INSERT INTO auth_2fa (token_hash, user_id, email, codigo_hash, expires_at) VALUES (?, ?, ?, ?, DATETIME('now', '+${MINUTOS} minutes'))`,
      args: [hashSessionToken(token), user.id, user.email, hashAccessCode(user.email, code)],
    },
  ], "write");

  if (process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console") {
    console.log(`[admin] código de ingreso (modo consola): ${code}`);
  } else if (!user.email.endsWith(".invalid")) {
    // (Los emails .invalid son de cuentas de prueba: ese dominio no existe.)
    await sendAdminLoginCodeEmail(user.email, code, MINUTOS);
  }

  (await cookies()).set(ADMIN_2FA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MINUTOS * 60,
  });
}

/**
 * Comprueba el código del intento de ingreso en curso. Cada intento gasta uno de los
 * disponibles, sea correcto o no. Devuelve el usuario si el código es correcto.
 */
export async function verificar2fa(code: string): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_2FA_COOKIE)?.value;
  if (!token) return null;

  const client = await db();
  const tokenHash = hashSessionToken(token);
  const result = await client.execute({
    sql: `UPDATE auth_2fa SET intentos = intentos - 1
          WHERE token_hash = ? AND intentos > 0 AND expires_at > DATETIME('now')
          RETURNING user_id, email, codigo_hash`,
    args: [tokenHash],
  });
  const row = result.rows[0];
  if (!row || !safeEqual(String(row.codigo_hash), hashAccessCode(String(row.email), code))) return null;

  await client.execute({ sql: "DELETE FROM auth_2fa WHERE token_hash = ?", args: [tokenHash] });
  cookieStore.delete(ADMIN_2FA_COOKIE);
  return Number(row.user_id);
}

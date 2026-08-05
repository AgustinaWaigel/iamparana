import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { findUserByEmail, createPasswordReset } from "@/server/db/auth-repository";
import { sendPasswordResetEmail } from "@/server/lib/email-service";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    let limitOk = true;
    try {
      const { success } = await ratelimit.limit(`reset:${ip}`);
      limitOk = success;
    } catch (rlErr) {
      console.warn("⚠️ Rate limit check failed:", rlErr);
      limitOk = true;
    }

    if (!limitOk) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un momento." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Siempre respondemos con 200 para no revelar si el email existe
    const user = await findUserByEmail(normalizedEmail);

    if (user && user.isActive) {
      const crypto = await import("crypto");
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Expira en 1 hora
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await createPasswordReset(user.id, tokenHash, expiresAt);

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetLink = `${appUrl}/auth/nueva-contrasena?token=${rawToken}`;

      // Enviamos el email de forma silenciosa (si falla, no rompemos la respuesta)
      try {
        await sendPasswordResetEmail(normalizedEmail, resetLink, user.nombre);
      } catch (emailErr) {
        console.error("❌ Error enviando email de recuperación:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Recuperar Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { findPasswordReset, deletePasswordReset, deleteExpiredPasswordResets, deleteAllSessionsByUserId } from "@/server/db/auth-repository";
import { hashPassword } from "@/server/lib/auth-security";
import { updateUser } from "@/server/db/auth-repository";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Eliminar tokens expirados primero
    await deleteExpiredPasswordResets();

    // Hashear el token para buscar en DB
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const reset = await findPasswordReset(tokenHash);

    if (!reset) {
      return NextResponse.json(
        { error: "El link de recuperación es inválido o ya expiró" },
        { status: 400 }
      );
    }

    // Actualizar la contraseña
    const newHash = hashPassword(password);
    await updateUser(reset.userId, { passwordHash: newHash });
    await deleteAllSessionsByUserId(reset.userId);

    // Invalidar el token
    await deletePasswordReset(tokenHash);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Nueva contraseña Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

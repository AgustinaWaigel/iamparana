// Bootstrap de autenticación: crea el primer usuario administrador si hace falta.
import { NextResponse } from "next/server";
import { countUsers, createUser, UserRole } from "@/server/db/auth-repository";
import { hashPassword } from "@/server/lib/auth-security";

const ADMIN_KEY = process.env.ADMIN_KEY;

type BootstrapBody = {
  email: string;
  password: string;
  role?: UserRole;
};

function isValidRole(value: unknown): value is UserRole {
  return value === "admin" || value === "editor" || value === "moderator" || value === "viewer";
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!ADMIN_KEY || auth !== `Bearer ${ADMIN_KEY}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { email, password, role } = body as Partial<BootstrapBody>;
  if (typeof email !== "string" || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Email o password invalidos" }, { status: 400 });
  }

  const safeRole = isValidRole(role) ? role : "admin";

  try {
    const total = await countUsers();
    if (total > 0) {
      return NextResponse.json({ error: "Bootstrap ya ejecutado" }, { status: 409 });
    }

    await createUser(email.trim().toLowerCase(), hashPassword(password), safeRole);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createSession, findUserByEmail } from "@/db/auth-repository";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionExpiresAtIso,
  hashSessionToken,
  verifyPassword,
} from "@/lib/auth-security";

type LoginBody = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { email, password } = body as Partial<LoginBody>;
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Credenciales invalidas" }, { status: 400 });
  }

  try {
    const user = await findUserByEmail(email.trim().toLowerCase());
    
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    const valid = verifyPassword(password, user.passwordHash);
    
    if (!valid) {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiresAtIso();

    await createSession(user.id, tokenHash, expiresAt);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      expires: new Date(expiresAt),
    });

    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

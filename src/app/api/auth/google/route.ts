import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Inicio de sesión con Google, paso 1: manda al usuario a Google a elegir su cuenta.
// En Google Cloud, el cliente OAuth tiene que tener autorizada la dirección
//   <sitio>/api/auth/google/callback
// (una para localhost y otra para el dominio publicado).

const GOOGLE_STATE_COOKIE = "iam_g_state";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const origin = request.nextUrl.origin;
  if (!clientId) return NextResponse.redirect(`${origin}/auth/login?error=google`);

  const state = crypto.randomBytes(24).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(url);
  // Lax: tiene que volver con la redirección desde Google. Sirve solo para este ida y vuelta.
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return response;
}

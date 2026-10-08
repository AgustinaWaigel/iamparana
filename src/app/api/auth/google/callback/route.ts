import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/server/db/auth-repository";
import { abrirSesion, iniciar2fa, requiere2fa } from "@/server/lib/auth-2fa";
import { hashPassword } from "@/server/lib/auth-security";

export const dynamic = "force-dynamic";

// Inicio de sesión con Google, paso 2: Google devuelve al usuario con un código. Se
// canjea por su email (ya verificado por Google) y se abre la sesión del sitio. Si es
// la primera vez, se crea su usuario. Un administrador pasa igual por el código por email.

const STATE_COOKIE = "iam_g_state";

/**
 * La cookie de sesión es "strict": no viaja en una navegación que viene de otro sitio
 * (Google). Por eso no se redirige directo: se muestra una página que navega sola,
 * ya desde el propio sitio.
 */
function irA(path: string) {
  // Se ve un instante: tiene que parecer parte del sitio, no una página en blanco.
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${path}">
<title>Entrando… · IAM Paraná</title>
<style>
  html, body { margin: 0; height: 100%; }
  body { display: grid; place-items: center; background: #fbf8f3; color: #2c1d11;
         font-family: "Hanken Grotesk", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 24px; text-align: center;
         animation: aparecer .35s ease-out both; }
  img { width: 76px; height: 76px; object-fit: contain; }
  .ruedita { width: 28px; height: 28px; border-radius: 50%; border: 3px solid rgba(98, 45, 13, .18);
             border-top-color: #622d0d; animation: girar .8s linear infinite; }
  p { margin: 0; font-size: 16px; font-weight: 600; }
  a { color: #622d0d; font-size: 14px; }
  @keyframes girar { to { transform: rotate(360deg); } }
  @keyframes aparecer { from { opacity: 0; transform: translateY(4px); } }
  @media (prefers-reduced-motion: reduce) { main, .ruedita { animation: none; } }
</style>
</head>
<body>
<main>
  <img src="/assets/header/logoiam2.png" alt="IAM Paraná">
  <div class="ruedita" role="status" aria-label="Entrando"></div>
  <p>Entrando…</p>
  <noscript><a href="${path}">Continuar</a></noscript>
</main>
<script>location.replace(${JSON.stringify(path)})</script>
</body>
</html>`;
  const response = new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  response.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/google" });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const state = searchParams.get("state") ?? "";
  const expected = request.cookies.get(STATE_COOKIE)?.value ?? "";
  const code = searchParams.get("code");

  // El "state" tiene que ser el que salió de este mismo navegador: evita que alguien inicie sesión por otro.
  const stateOk = state.length > 0 && state.length === expected.length && crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected));
  if (!stateOk || !code) return irA("/auth/login?error=google");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) return irA("/auth/login?error=google");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json();
    const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
    if (!profileResponse.ok || !email || profile.email_verified !== true) return irA("/auth/login?error=google");

    let user = await findUserByEmail(email);
    if (!user) {
      // Primera vez: se crea el usuario con una contraseña al azar que nadie conoce; entra siempre con Google
      // (o puede definirse una con "¿Olvidaste tu contraseña?").
      await createUser(email, hashPassword(crypto.randomBytes(32).toString("hex")), "miembro", typeof profile.name === "string" ? profile.name.slice(0, 80) : undefined);
      user = await findUserByEmail(email);
    }
    if (!user || !user.isActive) return irA("/auth/login?error=inactiva");

    if (requiere2fa(user)) {
      await iniciar2fa(user);
      return irA("/auth/login?paso=codigo");
    }
    await abrirSesion(user.id);
    return irA("/");
  } catch (error) {
    console.error("auth/google/callback", error instanceof Error ? error.name : "error");
    return irA("/auth/login?error=google");
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "iam_auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isAdminPage = pathname.startsWith("/admin");
  const isProfilePage = pathname === "/auth/perfil";

  if (isAdminPage || isProfilePage) {
    if (!token) {
      const url = new URL("/auth/login", request.url);
      return NextResponse.redirect(url);
    }
    // La validación real de la sesión se hace en los Server Components de /admin o en la API
    // para no saturar Turso con una consulta por cada petición de asset.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};

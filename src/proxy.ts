import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "auth_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isAuthPage = pathname.startsWith("/login");
  const isAdminPage = pathname.startsWith("/admin");

  if (isAdminPage) {
    if (!token) {
      const url = new URL("/auth/login", request.url);
      return NextResponse.redirect(url);
    }
    // La validación real de la sesión se hace en los Server Components de /admin o en la API
    // para no saturar Turso con una consulta por cada petición de asset.
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};

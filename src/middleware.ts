// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Debes importar estas constantes o definirlas igual que en tu server/lib/auth-security
const AUTH_COOKIE_NAME = "auth_session"; // Asegurate que coincida con tu config

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 1. Definir rutas protegidas y públicas
  const isAuthPage = pathname.startsWith("/login");
  const isAdminPage = pathname.startsWith("/admin");

  // 2. Lógica de Redirección
  
  // Caso A: Intenta entrar al panel administrativo
  if (isAdminPage) {
    if (!token) {
      // No hay cookie, al login de cabeza
      const url = new URL("/auth/login", request.url);
      return NextResponse.redirect(url);
    }
    
    // NOTA: No validamos el token contra la DB aquí porque el Middleware se ejecuta 
    // en cada petición (imágenes, scripts, etc). Validar en la DB aquí saturaría Turso.
    // La validación real de la sesión se hace en los Server Components de /admin o en la API.
  }

  // Caso B: El usuario ya está logueado e intenta ir al Login
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

// 3. Configuración del Matcher
// Es vital filtrar para que el middleware no corra en archivos estáticos
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (tu carpeta de imágenes del carrusel)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
import "server-only";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Header from '@/app/components/layout/header';
import Footer from '@/app/components/layout/footer';
import { getSessionUserByTokenHash } from '@/app/db/auth-repository';
import { AUTH_COOKIE_NAME, hashSessionToken } from '@/app/lib/auth-security';

// Este componente protege las rutas /admin/* y valida que el usuario sea admin
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtenemos las cookies en el servidor
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  // 2. Validación de seguridad nivel servidor
  // Si no hay cookie de sesión, redirigimos al login
  if (!sessionCookie?.value) {
    redirect('/auth/login');
  }

  // 3. Obtenemos el usuario desde la sesión usando el token hash
  const sessionUser = await getSessionUserByTokenHash(
    hashSessionToken(sessionCookie.value)
  );

  // 4. Si la sesión no es válida o el usuario no está activo, redirigimos al login
  if (!sessionUser || !sessionUser.isActive) {
    redirect('/auth/login');
  }

  // 5. Validación del rol: solo administradores pueden acceder a /admin
  if (sessionUser.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Al estar en el layout, el Header y Footer no se recargan 
          cuando navegas entre /admin/usuarios y /admin/noticias 
      */}
      <Header />
      
      <div className="flex-grow">
        {children}
      </div>

      <Footer />
    </div>
  );
}
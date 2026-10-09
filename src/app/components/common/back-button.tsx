'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (!pathname || pathname === '/') {
    return null;
  }

  const handleBack = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) {
      router.push('/');
      return;
    }

    // "/auth" no tiene página propia: subir un nivel daba 404. Desde registrarse, recuperar o cambiar
    // la contraseña se vuelve al ingreso; desde el resto, al inicio.
    if (segments[0] === 'auth') {
      router.push(['registro', 'recuperar', 'nueva-contrasena'].includes(segments[1]) ? '/auth/login' : '/');
      return;
    }

    let parentSegments = segments.slice(0, -1);

    // Skip the "recursos" directory if it doesn't have an index page in these sections
    if (
      parentSegments.length === 2 &&
      parentSegments[1] === 'recursos' &&
      ['formacion', 'espiritualidad', 'comunicacion', 'logistica', 'institucional'].includes(parentSegments[0])
    ) {
      parentSegments = parentSegments.slice(0, -1);
    }

    const parentPath = `/${parentSegments.join('/')}`;
    router.push(parentPath);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Volver"
      title="Volver"
      className="fixed left-3 top-24 z-[1100] inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-white/85 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-amber-950 hover:shadow md:left-4"
      data-path={pathname}
    >
      <ArrowLeft size={14} />
      Volver
    </button>
  );
}

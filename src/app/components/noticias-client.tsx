'use client';

import { useCallback, ReactNode } from 'react';
import { NoticiasEditor } from './noticias-editor';
import { useSession } from '@/hooks/use-session';

interface NoticiasClientProps {
  children: ReactNode;
}

export function NoticiasClient({ children }: NoticiasClientProps) {
  const { isAdmin, isLoading } = useSession();

  const handleRefresh = useCallback(() => {
    // Recargar la página para obtener las noticias actualizadas
    window.location.reload();
  }, []);

  // No mostrar el editor mientras se carga la sesión (evita flash)
  if (isLoading) {
    return children;
  }

  return (
    <>
      {children}
      <NoticiasEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

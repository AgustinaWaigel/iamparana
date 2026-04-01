'use client';

import { useCallback, ReactNode } from 'react';
import { ContenidoEditor } from './contenido-editor';
import { useSession } from '@/app/hooks/use-session';

interface ComunicacionClientProps {
  children: ReactNode;
}

export function ComunicacionClient({ children }: ComunicacionClientProps) {
  const { isAdmin, isLoading } = useSession();

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  if (isLoading) {
    return children;
  }

  return (
    <>
      {children}
      <ContenidoEditor isAdmin={isAdmin} seccion="comunicacion" onRefresh={handleRefresh} />
    </>
  );
}

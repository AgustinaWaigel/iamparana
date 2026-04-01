'use client';

import { useCallback, ReactNode } from 'react';
import { ContenidoEditor } from './contenido-editor';
import { useSession } from '@/app/hooks/use-session';

interface EspiritualidadClientProps {
  children: ReactNode;
}

export function EspiritualidadClient({ children }: EspiritualidadClientProps) {
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
      <ContenidoEditor isAdmin={isAdmin} seccion="espiritualidad" onRefresh={handleRefresh} />
    </>
  );
}

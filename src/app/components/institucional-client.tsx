'use client';

import { useCallback, ReactNode } from 'react';
import { ContenidoEditor } from './contenido-editor';
import { useSession } from '@/hooks/use-session';

interface InstitucionalClientProps {
  children: ReactNode;
}

export function InstitucionalClient({ children }: InstitucionalClientProps) {
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
      <ContenidoEditor isAdmin={isAdmin} seccion="institucional" onRefresh={handleRefresh} />
    </>
  );
}

'use client';

import { useCallback, ReactNode } from 'react';
import { ContenidoEditor } from './contenido-editor';
import { useSession } from '@/app/hooks/use-session';

interface LogisticaClientProps {
  children: ReactNode;
}

export function LogisticaClient({ children }: LogisticaClientProps) {
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
      <ContenidoEditor isAdmin={isAdmin} seccion="logistica" onRefresh={handleRefresh} />
    </>
  );
}

'use client';

import { useCallback, ReactNode } from 'react';
import { FormacionEditor } from './formacion-editor';
import { useSession } from '@/hooks/use-session';

interface FormacionClientProps {
  children: ReactNode;
}

export function FormacionClient({ children }: FormacionClientProps) {
  const { isAdmin, isLoading } = useSession();

  const handleRefresh = useCallback(() => {
    // Recargar la página para obtener los documentos actualizados
    window.location.reload();
  }, []);

  // No mostrar el editor mientras se carga la sesión (evita flash)
  if (isLoading) {
    return children;
  }

  return (
    <>
      {children}
      <FormacionEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

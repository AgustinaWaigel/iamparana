'use client';

import { useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ContenidoEditor } from '@/app/components/common/contenido-editor';
import { useSession } from '@/app/hooks/use-session';

interface ComunicacionClientProps {
  children: ReactNode;
}

export function ComunicacionClient({ children }: ComunicacionClientProps) {
  const router = useRouter();
  const { isAdmin, isLoading } = useSession();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

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

'use client';

import { useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ContenidoEditor } from '@/app/components/common/contenido-editor';
import { useSession } from '@/app/hooks/use-session';

interface EspiritualidadClientProps {
  children: ReactNode;
}

export function EspiritualidadClient({ children }: EspiritualidadClientProps) {
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
      <ContenidoEditor isAdmin={isAdmin} seccion="espiritualidad" onRefresh={handleRefresh} />
    </>
  );
}

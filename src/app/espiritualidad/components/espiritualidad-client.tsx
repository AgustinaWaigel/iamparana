'use client';

import { ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EspiritualidadEditor } from './espiritualidad-editor';
import { useSession } from '@/app/hooks/use-session';

// Conecta la vista pública de formación con el editor flotante de administración.
interface EspiritualidadClientProps {
  children: ReactNode;
}

export function EspiritualidadClient({ children }: EspiritualidadClientProps) {
  const router = useRouter();
  const { isAdmin, user } = useSession();
  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {children}

      <EspiritualidadEditor isAdmin={isAdmin || user?.areas?.includes('espiritualidad') === true} onRefresh={handleRefresh} />
    </>
  );
}

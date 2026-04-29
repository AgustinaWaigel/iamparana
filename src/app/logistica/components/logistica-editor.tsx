'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/hooks/use-session';
import { ContenidoEditor } from '@/app/components/common/contenido-editor';

export function LogisticaEditor() {
  const router = useRouter();
  const { isAdmin, isLoading } = useSession();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (isLoading || !isAdmin) {
    return null;
  }

  return <ContenidoEditor isAdmin={isAdmin} seccion="logistica" onRefresh={handleRefresh} />;
}


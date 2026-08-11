'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/hooks/use-session';
import { AnimacionEditor } from '@/app/animacion/components/animacion-editor';

export function LogisticaEditor() {
  const router = useRouter();
  const { isAdmin, isLoading, user } = useSession();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const canCreate = isAdmin || user?.areas?.includes('logistica') === true;
  if (isLoading || !canCreate) {
    return null;
  }

  return (
    <AnimacionEditor
      isAdmin={canCreate}
      onRefresh={handleRefresh}
      section="logistica"
      documentTypes={[
        { value: 'logistica', label: 'Documento logístico' },
        { value: 'presupuestos', label: 'Presupuesto' },
        { value: 'rendiciones', label: 'Rendición' },
        { value: 'inventario', label: 'Inventario' },
      ]}
      textureUrl="/assets/textures/areasg.webp"
      template="red"
      buttonLabel="Añadir recurso"
    />
  );
}


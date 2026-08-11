'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/hooks/use-session';
import { AnimacionEditor } from '@/app/animacion/components/animacion-editor';

export function LogisticaEditor() {
  const router = useRouter();
  const { isAdmin, isLoading } = useSession();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <AnimacionEditor
      isAdmin={isAdmin}
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


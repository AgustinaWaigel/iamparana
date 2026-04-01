'use client';

import { useCallback, ReactNode, useRef } from 'react';
import { FormacionEditor } from './formacion-editor';
import { FormacionDocumentosTabla } from './formacion-documentos-tabla';
import { useSession } from '@/app/hooks/use-session';

interface FormacionClientProps {
  children: ReactNode;
}

export function FormacionClient({ children }: FormacionClientProps) {
  const { isAdmin } = useSession();
  const refreshRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const handleRefresh = useCallback(() => {
    if (refreshRef.current) {
      refreshRef.current();
    }
  }, []);

  return (
    <>
      {/* Renderizar el contenido estático */}
      {children}
      
      {/* Sección de documentos subidos */}
      <section className="mt-12 px-4 py-8 max-w-7xl mx-auto bg-gradient-to-b from-green-50 to-transparent rounded-xl">
        <h3 className="text-2xl font-bold text-brand-brown mb-8">Documentos Compartidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FormacionDocumentosTabla ref={refreshRef} />
        </div>
      </section>

      {/* Editor flotante */}
      <FormacionEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

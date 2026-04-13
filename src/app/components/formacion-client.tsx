'use client';

import { useCallback, ReactNode, useRef } from 'react';
import { FormacionEditor } from './formacion-editor';
import { FormacionDocumentosTabla } from './formacion-documentos-tabla';
import { FormacionLinksTabla } from './formacion-links-tabla';
import { useSession } from '@/app/hooks/use-session';

interface FormacionClientProps {
  children: ReactNode;
}

export function FormacionClient({ children }: FormacionClientProps) {
  const { isAdmin } = useSession();
  const docsRefreshRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const linksRefreshRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const handleRefresh = useCallback(() => {
    docsRefreshRef.current?.();
    linksRefreshRef.current?.();
  }, []);

  return (
    <>
      {/* Renderizar el contenido estático */}
      {children}
      
      {/* Sección de documentos subidos */}
      <section className="mt-12 px-4 py-8 max-w-7xl mx-auto bg-gradient-to-b from-green-50 to-transparent rounded-xl">
        <h3 className="text-2xl font-bold text-brand-brown mb-8">📄 Documentos Compartidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FormacionDocumentosTabla ref={docsRefreshRef} />
        </div>
      </section>

      {/* Sección de enlaces */}
      <section className="mt-12 px-4 py-8 max-w-7xl mx-auto bg-gradient-to-b from-blue-50 to-transparent rounded-xl">
        <h3 className="text-2xl font-bold text-brand-brown mb-8">🔗 Enlaces Útiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FormacionLinksTabla ref={linksRefreshRef} />
        </div>
      </section>

      {/* Editor flotante */}
      <FormacionEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

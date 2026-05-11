'use client';

import { useState } from 'react';
import { useSessionUser } from '@/app/lib/use-session';

type ResourcePageBootstrapProps = {
  section: string;
  title: string;
  slug: string;
  description?: string;
  textureUrl?: string;
  template?: string;
};

export function ResourcePageBootstrap({
  section,
  title,
  slug,
  description,
  textureUrl,
  template = 'earth',
}: ResourcePageBootstrapProps) {
  const { user, loading, isAdmin } = useSessionUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading || !user || !isAdmin) {
    return null;
  }

  const createPage = async () => {
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/admin/resource-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          section,
          title,
          slug,
          description: description || '',
          textureUrl: textureUrl || '/assets/textures/areasg.webp',
          template,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo crear la pagina de recursos');
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la pagina de recursos');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm backdrop-blur">
      <h2 className="text-lg md:text-xl font-black text-emerald-900 tracking-tight">Recursos de juegos</h2>
      <p className="mt-2 text-sm text-stone-600">
        Todavia no hay una pagina de recursos para Juegos. Creala para poder agregar paginas, enlaces y archivos.
      </p>
      {error && (
        <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={createPage}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
      >
        {busy ? 'Creando...' : 'Crear pagina de recursos'}
      </button>
    </section>
  );
}

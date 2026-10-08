'use client';

import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { JuegosEditor } from './juegos-editor';
import { AreaSection, SectionNote } from './area-sections';
import type { Juego } from '@/server/content/juegos';

// Este componente muestra los juegos agrupados por categoría y activa el editor para admins.
interface JuegosClientContentProps {
  juegos: Juego[];
}

export function JuegosClientContent({ juegos: initialJuegos }: JuegosClientContentProps) {
  const [juegos, setJuegos] = useState(initialJuegos);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.status === 401) {
        setIsAdmin(false);
        return;
      }
      const data = await response.json();
      // Verificar si es admin (puede ser "admin" o role_id 1)
      setIsAdmin(data?.role === 'admin' || data?.role === 1);
    } catch (err) {
      console.error('Error verificando admin:', err);
      setIsAdmin(false);
    }
  };

  const handleRefresh = async () => {
    try {
      // Actualiza la lista de juegos desde el panel administrativo.
      const response = await fetch('/api/admin/juegos', { credentials: 'include' });
      const data = await response.json();
      setJuegos(data);
    } catch (err) {
      console.error('Error al recargar juegos:', err);
    }
  };

  // Agrupa los juegos por seccion creada por admins.
  const juegosPorSeccion = juegos.reduce((acc, juego) => {
    const key = juego.sectionId ? String(juego.sectionId) : 'general';
    if (!acc[key]) {
      acc[key] = {
        id: juego.sectionId ?? null,
        title: juego.sectionTitle || 'General',
        items: [],
      };
    }
    acc[key].items.push(juego);
    return acc;
  }, {} as Record<string, { id: number | null; title: string; items: Juego[] }>);

  return (
    <>
      <JuegosEditor onRefresh={handleRefresh} />

      {juegos.length === 0 ? (
        <SectionNote>No hay juegos disponibles aun.</SectionNote>
      ) : (
        Object.values(juegosPorSeccion).map((section) => (
          <AreaSection
            key={section.id ?? section.title}
            title={section.title}
            meta={`${section.items.length} ${section.items.length === 1 ? 'juego' : 'juegos'}`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {section.items.map((juego) => (
                <article
                  key={juego.id}
                  className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_10px_28px_-20px_rgba(58,21,8,0.4)] ring-1 ring-brand-brown/10"
                >
                  <h3 className="m-0 text-left font-display text-lg font-bold leading-snug text-brand-ink">
                    {juego.title}
                  </h3>
                  <p className="m-0 mt-2 max-w-none flex-1 text-left text-[15px] leading-relaxed text-brand-ink/70">
                    {juego.description}
                  </p>
                  {juego.youtubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${juego.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white no-underline transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                    >
                      <PlayCircle size={16} aria-hidden />
                      Ver en YouTube
                    </a>
                  )}
                </article>
              ))}
            </div>
          </AreaSection>
        ))
      )}
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { JuegosEditor } from './juegos-editor';
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
        <div className="text-center py-10 text-stone-500">
          No hay juegos disponibles aun.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.values(juegosPorSeccion).map((section) => (
            <section
              key={section.id ?? section.title}
              className="rounded-3xl border border-emerald-100/70 bg-white/90 shadow-sm backdrop-blur"
            >
              <div className="flex items-center justify-between gap-4 px-6 pt-6">
                <h2 className="text-lg md:text-xl font-black text-emerald-900 tracking-tight">
                  {section.title}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700/70">
                  {section.items.length} juegos
                </span>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {section.items.map((juego) => (
                  <article
                    key={juego.id}
                    className="group relative rounded-2xl border border-emerald-100/70 bg-emerald-50/40 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/70"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-emerald-600 to-green-700 opacity-0 transition-opacity group-hover:opacity-100" />
                    <h3 className="text-base md:text-lg font-black text-emerald-950 leading-tight">
                      {juego.title}
                    </h3>
                    <p className="text-sm text-emerald-900/75 mt-2 leading-relaxed">
                      {juego.description}
                    </p>
                    {juego.youtubeId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${juego.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-800"
                      >
                        Ver en YouTube
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

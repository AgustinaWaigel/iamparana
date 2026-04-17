'use client';

import { useEffect, useState } from 'react';
import { JuegosEditor } from './juegos-editor';
import type { Juego } from '@/app/lib/juegos';

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
      const response = await fetch('/api/admin/juegos', { credentials: 'include' });
      const data = await response.json();
      setJuegos(data);
    } catch (err) {
      console.error('Error al recargar juegos:', err);
    }
  };

  // Agrupar por categoría
  const juegosPorCategoria = juegos.reduce((acc, juego) => {
    if (!acc[juego.category]) acc[juego.category] = [];
    acc[juego.category].push(juego);
    return acc;
  }, {} as Record<string, Juego[]>);

  const categoriaLabels: Record<string, string> = {
    cooperativo: 'Juegos Cooperativos',
    competitivo: 'Juegos Competitivos',
    ronda: 'Juegos en Ronda',
    general: 'Otros Juegos',
  };

  return (
    <>
      <JuegosEditor onRefresh={handleRefresh} />

      {juegos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay juegos disponibles aún
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(juegosPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="seccion">
              <h2 className="subtitulo-seccion titulo-animacion">{categoriaLabels[categoria] || categoria}</h2>
              <div className="listabotones color space-y-3">
                {items.map((juego) => (
                  <div key={juego.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-green-800">{juego.title}</h3>
                    <p className="text-gray-700 mb-3">{juego.description}</p>
                    {juego.youtubeId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${juego.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 rounded-full font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-green-800/70"
                      >
                        Ver en YouTube
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

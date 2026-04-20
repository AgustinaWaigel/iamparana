'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Lista interactiva del cancionero: filtra por texto y lleva al detalle de cada canción.
type Cancion = {
  title: string;
  slug: string;
};

export default function CancionesLista({ canciones }: { canciones: Cancion[] }) {
  const [busqueda, setBusqueda] = useState('');

  const cancionesFiltradas = useMemo(() => {
    // La búsqueda es simple: coincide por título y ordena alfabéticamente.
    return canciones
      .filter((c) =>
        c.title.toLowerCase().includes(busqueda.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [busqueda, canciones]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        type="text"
        placeholder="🔍 Buscar canciones..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full mb-6 px-4 py-3 border-2 border-brand-gold rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
      />

      {cancionesFiltradas.length === 0 ? (
        <p className="text-center text-gray-500 text-lg p-6">No se encontraron canciones.</p>
      ) : (
        <ul className="space-y-2">
          {cancionesFiltradas.map((cancion) => (
            <li key={cancion.slug} className="py-2 px-4 hover:bg-brand-cream rounded transition-colors border-l-4 border-brand-gold">
              <Link href={`/animacion/canciones/${cancion.slug}`} className="text-brand-brown font-semibold hover:text-brand-gold no-underline">
                ♫ {cancion.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

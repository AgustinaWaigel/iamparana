'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type Cancion = {
  title: string;
  slug: string;
};

export default function CancionesLista({ canciones }: { canciones: Cancion[] }) {
  const [busqueda, setBusqueda] = useState('');

  const cancionesFiltradas = useMemo(() => {
    return canciones
      .filter((c) =>
        c.title.toLowerCase().includes(busqueda.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [busqueda, canciones]);

  return (
    <div className="canciones-lista">
      <input
        type="text"
        placeholder="Buscar canciones..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="busqueda-canciones"
      />

      {cancionesFiltradas.length === 0 ? (
        <p className="mensaje-vacio">No se encontraron canciones.</p>
      ) : (
        <ul className="lista-canciones">
          {cancionesFiltradas.map((cancion) => (
            <li key={cancion.slug} className="item-cancion">
<Link href={`/animacion/canciones/${cancion.slug}`} className="link-cancion">

                {cancion.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

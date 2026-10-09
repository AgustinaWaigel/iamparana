'use client';

import { useMemo, useState } from 'react';
import { Award, Coffee, Gem, KeyRound, NotebookPen, Package, Sparkles, Sticker, type LucideIcon } from 'lucide-react';
import { SearchBar } from '@/app/components/common/search-bar';
import { coincideBusqueda } from '@/lib/busqueda';
import type { ProductoCatalogo } from '@/server/lib/ventas-catalogo';

// Merch de la IAM: lo que se vende en los eventos. Los productos y los precios llegan del sistema
// de ventas de Comunicación; acá solo se muestran.

const ESTILO: Record<string, { icono: LucideIcon; fondo: string }> = {
  Llaveros: { icono: KeyRound, fondo: 'bg-blue-600' },
  Stickers: { icono: Sticker, fondo: 'bg-rose-500' },
  Mates: { icono: Coffee, fondo: 'bg-emerald-600' },
  Librería: { icono: NotebookPen, fondo: 'bg-amber-500' },
  Insignias: { icono: Award, fondo: 'bg-red-600' },
  Decoración: { icono: Sparkles, fondo: 'bg-violet-600' },
  Accesorios: { icono: Gem, fondo: 'bg-sky-600' },
  Otros: { icono: Package, fondo: 'bg-stone-600' },
};

const precio = (valor: number) => `$ ${valor.toLocaleString('es-AR')}`;
const CHIP = 'rounded-full px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800';

export function Catalogo({ productos }: { productos: ProductoCatalogo[] }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  // Fotos que no cargaron: en su lugar se muestra el ícono de la categoría.
  const [sinFoto, setSinFoto] = useState<Set<number>>(new Set());

  const categorias = useMemo(() => [...new Set(productos.map((producto) => producto.categoria))], [productos]);
  const visibles = useMemo(
    () => productos.filter((producto) => (categoria === null || producto.categoria === categoria) && coincideBusqueda(busqueda, producto.nombre, producto.categoria)),
    [productos, categoria, busqueda],
  );

  return (
    <section aria-label="Productos" id="catalogo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <p className="m-0 max-w-xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">
          Buscanos en el puesto de Comunicación de cada evento. Los precios son los de hoy.
        </p>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar un producto..." className="w-full shrink-0 sm:w-72 lg:w-80" />
      </div>

      <div role="group" aria-label="Filtrar por categoría" className="mt-5 flex flex-wrap gap-2">
        {[null, ...categorias].map((item) => {
          const activa = item === categoria;
          return (
            <button key={item ?? 'todo'} type="button" aria-pressed={activa} onClick={() => setCategoria(item)} className={`${CHIP} ${activa ? 'bg-blue-700 text-white' : 'bg-white text-brand-ink ring-1 ring-brand-brown/15 hover:bg-blue-50'}`}>
              {item ?? 'Todo'}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="m-0 mt-4 max-w-none text-left text-sm font-medium tabular-nums text-brand-ink/60">
        {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
      </p>

      {visibles.length === 0 ? (
        <p className="m-0 mt-4 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-10 text-center text-base text-brand-ink/65">
          No encontramos productos con esa búsqueda.
        </p>
      ) : (
        <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {visibles.map((producto) => {
            const { icono: Icono, fondo } = ESTILO[producto.categoria] ?? ESTILO.Otros;
            return (
              <li key={producto.id} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_14px_28px_-22px_rgba(30,64,175,0.7)] ring-1 ring-brand-brown/10 transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none">
                <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden ${fondo}`}>
                  {producto.imagen && !sinFoto.has(producto.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={producto.imagen} alt="" loading="lazy" onError={() => setSinFoto((prev) => new Set(prev).add(producto.id))} className="h-full w-full object-cover" />
                  ) : (
                    <Icono size={46} strokeWidth={1.6} aria-hidden className="text-white/90 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                  <p className="m-0 max-w-none text-left text-xs font-bold text-brand-ink/55">{producto.categoria}</p>
                  <h2 className="m-0 mt-0.5 text-left text-base font-bold leading-snug text-brand-ink">{producto.nombre}</h2>
                  <p className="m-0 mt-auto max-w-none pt-3 text-left font-display text-2xl font-extrabold tabular-nums text-blue-700">{precio(producto.precio)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

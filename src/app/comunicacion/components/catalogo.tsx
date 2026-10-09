'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Check, Coffee, Gem, KeyRound, Minus, NotebookPen, Package, Plus, Share2, ShoppingBag, Sparkles, Sticker, Store, Trash2, X, type LucideIcon } from 'lucide-react';
import { SearchBar } from '@/app/components/common/search-bar';
import { coincideBusqueda } from '@/lib/busqueda';
import type { ProductoCatalogo } from '@/server/lib/ventas-catalogo';

// Merch de la IAM: lo que se vende en los eventos. Los productos y los precios llegan del sistema
// de ventas de Comunicación; acá se muestran como el puesto: un estante por categoría, cada
// producto con su etiqueta de precio, y una lista para saber cuánta plata llevar.
// La lista vive solo en el navegador de quien la arma: no reserva ni compra nada.

const ESTILO: Record<string, { icono: LucideIcon; fondo: string; texto: string }> = {
  Llaveros: { icono: KeyRound, fondo: 'bg-blue-600', texto: 'text-white' },
  Stickers: { icono: Sticker, fondo: 'bg-rose-600', texto: 'text-white' },
  Mates: { icono: Coffee, fondo: 'bg-emerald-700', texto: 'text-white' },
  Librería: { icono: NotebookPen, fondo: 'bg-yellow-400', texto: 'text-brand-deep' },
  Insignias: { icono: Award, fondo: 'bg-red-600', texto: 'text-white' },
  Decoración: { icono: Sparkles, fondo: 'bg-violet-600', texto: 'text-white' },
  Accesorios: { icono: Gem, fondo: 'bg-sky-700', texto: 'text-white' },
  Otros: { icono: Package, fondo: 'bg-stone-600', texto: 'text-white' },
};
const TODO = { icono: Store, fondo: 'bg-brand-deep', texto: 'text-white' };

const ORDENES = [
  { clave: 'categoria', nombre: 'Por estante' },
  { clave: 'menor', nombre: 'Más baratos' },
  { clave: 'mayor', nombre: 'Más caros' },
] as const;
type Orden = (typeof ORDENES)[number]['clave'];

const GUARDADO = 'iam-merch-lista';
const FOCO = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800';
const GRILLA = 'm-0 grid list-none grid-cols-2 gap-x-3 gap-y-5 p-0 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4 xl:grid-cols-5';

const precio = (valor: number) => `$ ${valor.toLocaleString('es-AR')}`;
const cuantos = (cantidad: number) => `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`;

/** Cartel que corre debajo de la portada, con los nombres de lo que hay en el puesto. */
export function CintaMerch({ productos }: { productos: ProductoCatalogo[] }) {
  const paso = Math.max(1, Math.ceil(productos.length / 12));
  const nombres = productos.filter((_, index) => index % paso === 0).map((producto) => producto.nombre);
  if (nombres.length === 0) return null;
  return (
    <div aria-hidden className="overflow-hidden bg-yellow-400 py-2.5 text-brand-deep">
      <div className="evento-marquesina flex w-max">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0 items-center">
            {[0, 1].flatMap((vuelta) =>
              nombres.map((nombre, index) => (
                <span key={`${vuelta}-${index}`} className="flex items-center whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-wide sm:text-base">
                  <span className="px-4">{nombre}</span>
                  <span className="h-2 w-2 rounded-full bg-brand-deep" />
                </span>
              )),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cantidad({ nombre, cantidad, onCambiar, clara = false }: { nombre: string; cantidad: number; onCambiar: (cantidad: number) => void; clara?: boolean }) {
  const boton = `flex h-9 w-9 items-center justify-center rounded-full transition-colors ${FOCO} ${clara ? 'bg-brand-brown/10 text-brand-ink hover:bg-brand-brown/20' : 'bg-white/20 text-white hover:bg-white/35'}`;
  return (
    <div className={`flex items-center justify-between gap-1 rounded-full p-1 ${clara ? '' : 'bg-blue-700'}`}>
      <button type="button" onClick={() => onCambiar(cantidad - 1)} aria-label={`Sacar un ${nombre} de la lista`} className={boton}>
        <Minus size={16} strokeWidth={2.5} aria-hidden />
      </button>
      <span aria-live="polite" className={`min-w-6 text-center font-display text-base font-extrabold tabular-nums ${clara ? 'text-brand-ink' : 'text-white'}`}>
        {cantidad}
      </span>
      <button type="button" onClick={() => onCambiar(cantidad + 1)} aria-label={`Sumar otro ${nombre} a la lista`} className={boton}>
        <Plus size={16} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

function Tarjeta({ producto, cantidad, onCambiar, demora }: { producto: ProductoCatalogo; cantidad: number; onCambiar: (cantidad: number) => void; demora: number }) {
  // Si la foto no carga, en su lugar se muestra el ícono de la categoría.
  const [sinFoto, setSinFoto] = useState(false);
  const { icono: Icono, fondo, texto } = ESTILO[producto.categoria] ?? ESTILO.Otros;
  const enLista = cantidad > 0;
  const conFoto = Boolean(producto.imagen) && !sinFoto;

  return (
    <li className="hero-rise group flex flex-col" style={{ ['--d' as string]: `${demora}ms` }}>
      <div className={`relative transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transform-none ${enLista ? 'rounded-2xl outline outline-[3px] outline-offset-2 outline-blue-700' : ''}`}>
        <div className={`relative aspect-square overflow-hidden rounded-2xl shadow-[0_18px_30px_-20px_rgba(58,21,8,0.75)] ${fondo} ${texto}`}>
          {conFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={producto.imagen ?? ''} alt="" loading="lazy" onError={() => setSinFoto(true)} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none" />
          ) : (
            // Sin foto, el nombre es la tapa: cada producto queda distinto aunque comparta el color del estante.
            <>
              <Icono strokeWidth={1.4} aria-hidden className={`absolute -bottom-6 -right-6 h-[62%] w-[62%] opacity-25 transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transform-none ${producto.id % 2 ? 'rotate-12 group-hover:rotate-0' : '-rotate-12 group-hover:rotate-0'}`} />
              <h3 className={`relative m-0 line-clamp-4 p-3.5 text-left font-display text-[1.35rem] font-extrabold leading-[1.04] tracking-[-0.02em] [overflow-wrap:anywhere] sm:p-4 sm:text-2xl ${texto}`}>{producto.nombre}</h3>
            </>
          )}
        </div>
        {/* La etiqueta de precio, colgada del producto como en el puesto. */}
        <p className="absolute -bottom-3 left-3 m-0 flex max-w-none -rotate-3 items-center gap-2 rounded-lg bg-yellow-400 py-1 pl-2 pr-3 font-display text-xl font-extrabold leading-tight tabular-nums text-brand-deep shadow-[0_8px_14px_-8px_rgba(58,21,8,0.9)] transition-transform duration-300 ease-out group-hover:rotate-2 motion-reduce:transform-none sm:text-2xl">
          <span aria-hidden className="h-2 w-2 rounded-full bg-brand-deep/45" />
          {precio(producto.precio)}
        </p>
        {enLista && (
          <span aria-hidden className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white animate-in zoom-in-50 duration-200">
            <Check size={16} strokeWidth={3} />
          </span>
        )}
      </div>

      {conFoto && <h3 className="m-0 mt-6 text-left font-sans text-base font-bold leading-snug text-brand-ink [overflow-wrap:anywhere]">{producto.nombre}</h3>}

      <div className={conFoto ? 'mt-auto pt-3' : 'mt-auto pt-6'}>
        {enLista ? (
          <Cantidad nombre={producto.nombre} cantidad={cantidad} onCambiar={onCambiar} />
        ) : (
          <button
            type="button"
            onClick={() => onCambiar(1)}
            aria-label={`Sumar ${producto.nombre} a mi lista`}
            className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-extrabold text-brand-ink shadow-[0_8px_16px_-12px_rgba(58,21,8,0.8)] transition-colors hover:bg-brand-deep hover:text-white active:scale-[0.98] ${FOCO}`}
          >
            <Plus size={16} strokeWidth={2.75} aria-hidden />
            A mi lista
          </button>
        )}
      </div>
    </li>
  );
}

export function Catalogo({ productos }: { productos: ProductoCatalogo[] }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('categoria');
  // Lo que cada uno va eligiendo: id del producto → cantidad.
  const [lista, setLista] = useState<Record<number, number>>({});
  const [copiada, setCopiada] = useState(false);
  const cargada = useRef(false);
  const panel = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const guardada: unknown = JSON.parse(localStorage.getItem(GUARDADO) ?? '{}');
      if (guardada && typeof guardada === 'object') {
        const limpia: Record<number, number> = {};
        for (const [id, cantidad] of Object.entries(guardada)) {
          if (Number.isInteger(cantidad) && cantidad > 0) limpia[Number(id)] = Math.min(cantidad, 99);
        }
        setLista(limpia);
      }
    } catch {
      // Sin almacenamiento (modo privado): la lista dura mientras la página esté abierta.
    }
    cargada.current = true;
  }, []);

  useEffect(() => {
    if (!cargada.current) return;
    try {
      localStorage.setItem(GUARDADO, JSON.stringify(lista));
    } catch {
      // Ídem.
    }
  }, [lista]);

  const cambiar = (id: number, cantidad: number) =>
    setLista((prev) => {
      const next = { ...prev };
      if (cantidad <= 0) delete next[id];
      else next[id] = Math.min(cantidad, 99);
      return next;
    });

  const estantes = useMemo(() => {
    const porCategoria = new Map<string, { cantidad: number; desde: number }>();
    for (const producto of productos) {
      const actual = porCategoria.get(producto.categoria);
      porCategoria.set(producto.categoria, { cantidad: (actual?.cantidad ?? 0) + 1, desde: Math.min(actual?.desde ?? Infinity, producto.precio) });
    }
    return [...porCategoria].map(([nombre, datos]) => ({ nombre, ...datos }));
  }, [productos]);

  const visibles = useMemo(() => {
    const filtrados = productos.filter((producto) => (categoria === null || producto.categoria === categoria) && coincideBusqueda(busqueda, producto.nombre, producto.categoria));
    if (orden === 'categoria') return filtrados;
    return [...filtrados].sort((a, b) => (orden === 'menor' ? a.precio - b.precio : b.precio - a.precio));
  }, [productos, categoria, busqueda, orden]);

  // Sin filtros se recorre el puesto estante por estante; con filtros, una sola grilla.
  const porEstante = categoria === null && orden === 'categoria' && busqueda.trim() === '';
  const grupos = porEstante
    ? estantes.map((estante) => ({ nombre: estante.nombre, items: visibles.filter((producto) => producto.categoria === estante.nombre) }))
    : [{ nombre: null, items: visibles }];

  // Solo cuenta lo que sigue a la venta: un producto que se agotó sale de la lista sin avisar de más.
  const elegidos = productos.filter((producto) => lista[producto.id] > 0);
  const unidades = elegidos.reduce((suma, producto) => suma + lista[producto.id], 0);
  const total = elegidos.reduce((suma, producto) => suma + lista[producto.id] * producto.precio, 0);

  const compartir = async () => {
    const texto = ['Mi lista del merch de la IAM', ...elegidos.map((producto) => `• ${lista[producto.id]} × ${producto.nombre}: ${precio(lista[producto.id] * producto.precio)}`), `Total: ${precio(total)}`].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mi lista del merch de la IAM', text: texto });
        return;
      }
      await navigator.clipboard.writeText(texto);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2200);
    } catch {
      // Se canceló el menú de compartir: no hay nada que avisar.
    }
  };

  const limpiarFiltros = () => {
    setCategoria(null);
    setBusqueda('');
  };

  return (
    <section aria-label="Productos" id="catalogo" className="selection:bg-yellow-300 selection:text-brand-deep">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <p className="m-0 max-w-xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">
          Buscanos en el puesto de Comunicación de cada evento. Los precios son los de hoy: armá tu lista y sabé cuánto llevar.
        </p>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar un producto..." className="w-full shrink-0 sm:w-72 lg:w-80" />
      </div>

      {/* Los estantes del puesto: cada categoría con su color. */}
      <div role="group" aria-label="Filtrar por categoría" className="-mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-3 pt-2[scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {[{ nombre: null, cantidad: productos.length, desde: 0 }, ...estantes].map((estante) => {
          const activa = estante.nombre === categoria;
          const { icono: Icono, fondo, texto } = estante.nombre === null ? TODO : (ESTILO[estante.nombre] ?? ESTILO.Otros);
          return (
            <button
              key={estante.nombre ?? 'todo'}
              type="button"
              aria-pressed={activa}
              onClick={() => setCategoria(estante.nombre)}
              className={`group/estante relative flex h-28 w-36 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl p-3.5 text-left transition-[transform,opacity] duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none sm:w-auto sm:flex-1 sm:basis-[13.5rem] ${FOCO} ${fondo} ${texto} ${activa ? 'outline outline-[3px] outline-offset-2 outline-brand-ink' : categoria === null ? '' : 'opacity-60 hover:opacity-100'}`}
            >
              <Icono aria-hidden strokeWidth={1.5} className="absolute -bottom-4 -right-4 h-24 w-24 -rotate-12 opacity-25 transition-transform duration-500 ease-out group-hover/estante:rotate-0 group-hover/estante:scale-110 motion-reduce:transform-none" />
              <span className="relative font-display text-xl font-extrabold leading-none tracking-[-0.02em]">{estante.nombre ?? 'Todo'}</span>
              <span className="relative text-sm font-bold leading-tight tabular-nums">
                {cuantos(estante.cantidad)}
                {estante.nombre !== null && <span className="block font-medium opacity-90">desde {precio(estante.desde)}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" className="m-0 max-w-none text-left text-sm font-medium tabular-nums text-brand-ink/70">
          {cuantos(visibles.length)}
        </p>
        <div role="group" aria-label="Ordenar" className="flex rounded-full bg-brand-brown/10 p-1">
          {ORDENES.map((item) => (
            <button
              key={item.clave}
              type="button"
              aria-pressed={orden === item.clave}
              onClick={() => setOrden(item.clave)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${FOCO} ${orden === item.clave ? 'bg-brand-deep text-white' : 'text-brand-ink/75 hover:text-brand-ink'}`}
            >
              {item.nombre}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-brown/25 px-5 py-10 text-center">
          <p className="m-0 max-w-none text-base text-brand-ink/75">No encontramos productos con esa búsqueda.</p>
          <button type="button" onClick={limpiarFiltros} className={`mt-4 rounded-full bg-brand-deep px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-brand-brown ${FOCO}`}>
            Ver todo el merch
          </button>
        </div>
      ) : (
        // La clave hace que los productos vuelvan a entrar al cambiar de estante u orden, no al escribir.
        <div key={`${categoria}-${orden}`}>
          {grupos.map((grupo) => {
            const estilo = grupo.nombre === null ? null : (ESTILO[grupo.nombre] ?? ESTILO.Otros);
            return (
              <div key={grupo.nombre ?? 'todo'} className={grupo.nombre === null ? 'mt-6' : 'mt-12 first:mt-8 sm:mt-16'}>
                {grupo.nombre !== null && estilo && (
                  <div className="mb-5 flex items-center gap-3 sm:mb-6">
                    <span aria-hidden className={`flex h-11 w-11 shrink-0 -rotate-6 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${estilo.fondo} ${estilo.texto}`}>
                      <estilo.icono className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                    </span>
                    <h2 className="m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-none tracking-[-0.03em] text-brand-ink">{grupo.nombre}</h2>
                    <span aria-hidden className="h-0.5 min-w-4 flex-1 rounded-full bg-brand-brown/15" />
                    <button type="button" onClick={() => setCategoria(grupo.nombre)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-blue-800 transition-colors hover:bg-blue-50 ${FOCO}`}>
                      Ver solo {grupo.nombre.toLowerCase()}
                    </button>
                  </div>
                )}
                <ul className={GRILLA}>
                  {grupo.items.map((producto, index) => (
                    <Tarjeta key={producto.id} producto={producto} cantidad={lista[producto.id] ?? 0} onCambiar={(cantidad) => cambiar(producto.id, cantidad)} demora={Math.min(index, 9) * 45} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* La lista, siempre a mano. El asistente ocupa la esquina derecha: esta va a la izquierda. */}
      {unidades > 0 && (
        <button
          type="button"
          onClick={() => panel.current?.showModal()}
          className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[1000] flex items-center gap-3 rounded-full bg-brand-deep py-2 pl-2 pr-5 text-left text-white shadow-[0_18px_30px_-12px_rgba(58,21,8,0.85)] transition-transform duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:animate-none sm:bottom-6 sm:left-6 ${FOCO}`}
        >
          <span key={unidades} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 text-brand-deep animate-in zoom-in-75 duration-300 motion-reduce:animate-none">
            <ShoppingBag size={20} strokeWidth={2.25} aria-hidden />
            <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-1 text-xs font-extrabold tabular-nums text-white">{unidades}</span>
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-bold text-white/80">Mi lista</span>
            <span className="block font-display text-lg font-extrabold tabular-nums">{precio(total)}</span>
          </span>
        </button>
      )}

      <dialog
        ref={panel}
        aria-labelledby="lista-titulo"
        onClick={(event) => event.target === panel.current && panel.current?.close()}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-brand-paper p-0 text-brand-ink shadow-2xl backdrop:bg-brand-deep/60 open:animate-in open:slide-in-from-right open:duration-300 motion-reduce:open:animate-none"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 bg-yellow-400 px-5 pb-5 pt-6 text-brand-deep">
            <div>
              <h2 id="lista-titulo" className="m-0 text-left font-display text-3xl font-extrabold leading-none tracking-[-0.03em] text-brand-deep">Mi lista</h2>
              <p className="m-0 mt-2 max-w-none text-left text-sm font-medium leading-snug text-brand-deep/85">Mostrala en el puesto. No reserva los productos.</p>
            </div>
            <button type="button" onClick={() => panel.current?.close()} aria-label="Cerrar la lista" className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-deep/10 text-brand-deep transition-colors hover:bg-brand-deep/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep">
              <X size={20} aria-hidden />
            </button>
          </div>

          {elegidos.length === 0 ? (
            <p className="m-0 max-w-none px-5 py-12 text-center text-base text-brand-ink/75">Tu lista está vacía. Sumá productos desde el catálogo.</p>
          ) : (
            <ul className="m-0 flex-1 list-none divide-y divide-brand-brown/10 overflow-y-auto overscroll-contain p-0 px-5">
              {elegidos.map((producto) => {
                const estilo = ESTILO[producto.categoria] ?? ESTILO.Otros;
                return (
                  <li key={producto.id} className="flex items-center gap-3 py-3.5">
                    <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estilo.fondo} ${estilo.texto}`}>
                      <estilo.icono size={22} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold leading-snug [overflow-wrap:anywhere]">{producto.nombre}</span>
                      <span className="block text-sm tabular-nums text-brand-ink/70">
                        {precio(producto.precio)} c/u · <strong className="font-extrabold text-brand-ink">{precio(producto.precio * lista[producto.id])}</strong>
                      </span>
                    </span>
                    <Cantidad clara nombre={producto.nombre} cantidad={lista[producto.id]} onCambiar={(cantidad) => cambiar(producto.id, cantidad)} />
                  </li>
                );
              })}
            </ul>
          )}

          {elegidos.length > 0 && (
            <div className="bg-brand-deep px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-white">
              <p className="m-0 flex max-w-none items-end justify-between gap-4 text-left">
                <span className="text-sm font-bold text-white/80">Para llevar · {cuantos(unidades)}</span>
                <span aria-live="polite" className="font-display text-4xl font-extrabold leading-none tabular-nums text-yellow-400">{precio(total)}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={compartir} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-yellow-400 text-base font-extrabold text-brand-deep transition-colors hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  {copiada ? <Check size={18} aria-hidden /> : <Share2 size={18} aria-hidden />}
                  <span aria-live="polite">{copiada ? 'Lista copiada' : 'Compartir la lista'}</span>
                </button>
                <button type="button" onClick={() => setLista({})} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <Trash2 size={16} aria-hidden />
                  Vaciar
                </button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </section>
  );
}

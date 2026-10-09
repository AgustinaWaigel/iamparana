import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Paginación para las listas largas (noticias, canciones, recursos). Sirve de las dos formas:
// con enlaces (`hrefDe`), cuando la página la arma el servidor, o con botones (`onCambiar`).
// Si hay una sola página, no se muestra.

interface PaginacionProps {
  pagina: number;
  paginas: number;
  /** A qué dirección lleva cada página. */
  hrefDe?: (pagina: number) => string;
  /** Qué hacer al elegir una página, cuando no se navega. */
  onCambiar?: (pagina: number) => void;
  /** Qué se está paginando, para los lectores de pantalla: "noticias", "canciones"... */
  de: string;
  className?: string;
}

const BASE = 'flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-extrabold tabular-nums no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown';
const LIBRE = 'bg-white text-brand-ink shadow-[0_8px_16px_-12px_rgba(58,21,8,0.8)] hover:bg-brand-deep hover:text-white';
const ACTUAL = 'bg-brand-deep text-white';
const APAGADO = 'bg-brand-brown/10 text-brand-ink/40';

/** Qué números mostrar: siempre la primera, la última y las vecinas de la actual; null es un salto. */
function numeros(pagina: number, paginas: number): Array<number | null> {
  const visibles = [...new Set([1, pagina - 1, pagina, pagina + 1, paginas])].filter((numero) => numero >= 1 && numero <= paginas).sort((a, b) => a - b);
  return visibles.flatMap((numero, indice) => (indice > 0 && numero - visibles[indice - 1] > 1 ? [null, numero] : [numero]));
}

export function Paginacion({ pagina, paginas, hrefDe, onCambiar, de, className = '' }: PaginacionProps) {
  if (paginas <= 1) return null;

  const boton = (destino: number, contenido: React.ReactNode, etiqueta: string, clave: string, actual = false) => {
    const fuera = destino < 1 || destino > paginas;
    if (fuera) return <span key={clave} aria-hidden className={`${BASE} ${APAGADO}`}>{contenido}</span>;
    const clase = `${BASE} ${actual ? ACTUAL : LIBRE}`;
    return hrefDe ? (
      <Link key={clave} href={hrefDe(destino)} aria-label={etiqueta} aria-current={actual ? 'page' : undefined} className={clase}>{contenido}</Link>
    ) : (
      <button key={clave} type="button" onClick={() => onCambiar?.(destino)} aria-label={etiqueta} aria-current={actual ? 'page' : undefined} className={clase}>{contenido}</button>
    );
  };

  return (
    // role="navigation" en un div: las reglas globales de `nav` son del encabezado.
    <div role="navigation" aria-label={`Páginas de ${de}`} className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {boton(pagina - 1, <ChevronLeft size={20} aria-hidden />, 'Página anterior', 'anterior')}
      {numeros(pagina, paginas).map((numero, indice) =>
        numero === null
          ? <span key={`salto-${indice}`} aria-hidden className="px-1 text-sm font-bold text-brand-ink/50">…</span>
          : boton(numero, numero, `Página ${numero} de ${paginas}`, `p-${numero}`, numero === pagina),
      )}
      {boton(pagina + 1, <ChevronRight size={20} aria-hidden />, 'Página siguiente', 'siguiente')}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Backpack, Check, ExternalLink, Map, Printer } from 'lucide-react';

// Partes de la información del evento que necesitan el navegador: el mapa (que se carga
// recién cuando se pide) y la lista de qué llevar, que cada uno va tildando en su dispositivo.

export function MapaEvento({ consulta, enlace }: { consulta: string; enlace: string }) {
  const [visible, setVisible] = useState(false);
  const abrir = enlace || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
  const BOTON = 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown';

  return (
    <div className="mt-4">
      {visible && (
        <iframe
          title="Mapa del lugar"
          src={`https://www.google.com/maps?q=${encodeURIComponent(consulta)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="mb-3 aspect-[4/3] w-full rounded-2xl border-0 bg-brand-cream"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {/* El mapa recién se pide a Google cuando alguien lo quiere ver. */}
        {!visible && (
          <button type="button" onClick={() => setVisible(true)} className={`${BOTON} bg-brand-brown text-white hover:bg-brand-wood`}>
            <Map size={16} aria-hidden /> Ver el mapa
          </button>
        )}
        <a href={abrir} target="_blank" rel="noopener noreferrer" className={`${BOTON} border border-brand-brown/25 text-brand-brown hover:bg-brand-brown/10`}>
          <ExternalLink size={16} aria-hidden /> Abrir en Google Maps
        </a>
      </div>
    </div>
  );
}

export function QueLlevar({ eventoId, items }: { eventoId: string; items: string[] }) {
  const clave = `iam-que-llevar:${eventoId}`;
  const [listos, setListos] = useState<string[]>([]);

  // Lo tildado queda guardado en este dispositivo; si el navegador no deja guardar, la lista funciona igual.
  useEffect(() => {
    try {
      const guardado = JSON.parse(window.localStorage.getItem(clave) || '[]');
      if (Array.isArray(guardado)) setListos(guardado.filter((item) => items.includes(item)));
    } catch {
      /* sin guardado */
    }
  }, [clave, items]);

  const alternar = (item: string) => {
    setListos((prev) => {
      const nuevo = prev.includes(item) ? prev.filter((otro) => otro !== item) : [...prev, item];
      try {
        window.localStorage.setItem(clave, JSON.stringify(nuevo));
      } catch {
        /* sin guardado */
      }
      return nuevo;
    });
  };

  // Para imprimir solo la lista: se marca la página, se imprime y se desmarca (ver globals.css).
  const imprimir = () => {
    document.body.classList.add('imprimir-lista');
    const limpiar = () => { document.body.classList.remove('imprimir-lista'); window.removeEventListener('afterprint', limpiar); };
    window.addEventListener('afterprint', limpiar);
    window.print();
  };

  return (
    <section aria-labelledby="info-llevar" className="lista-para-imprimir rounded-[24px] bg-white p-5 ring-1 ring-brand-brown/10 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="info-llevar" className="m-0 flex items-center gap-2.5 text-left font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><Backpack size={21} aria-hidden /></span>
          Qué llevar
        </h2>
        <button type="button" onClick={imprimir} className="no-imprimir inline-flex items-center gap-2 rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
          <Printer size={16} aria-hidden /> Imprimir
        </button>
      </div>
      <p aria-live="polite" className="no-imprimir m-0 mt-2 max-w-none text-left text-sm font-medium tabular-nums text-brand-ink/65">
        {listos.length === items.length ? '¡Ya tenés todo!' : `${listos.length} de ${items.length} listos`}
      </p>
      <ul className="m-0 mt-3 list-none p-0">
        {items.map((item) => {
          const listo = listos.includes(item);
          return (
            <li key={item} className="border-b border-brand-brown/10 last:border-0">
              <label className="flex cursor-pointer items-center gap-3 py-2.5">
                <input type="checkbox" checked={listo} onChange={() => alternar(item)} className="peer sr-only" />
                <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-brown ${listo ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 bg-white text-transparent'}`}>
                  <Check size={17} strokeWidth={3} />
                </span>
                <span className={`text-base ${listo ? 'text-brand-ink/50 line-through' : 'text-brand-ink'}`}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

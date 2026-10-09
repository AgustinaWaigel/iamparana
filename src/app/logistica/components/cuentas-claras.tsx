'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { formatMonto } from '@/app/inscripciones/montos';
import type { Movimiento, Rendicion } from '@/server/db/rendiciones-repository';

// Cuentas claras: cuánto entró, cuánto salió y en qué se gastó en cada evento.
// Lo carga el equipo de Logística (o un administrador) desde acá mismo.

// Colores de los gastos, siempre en este orden (paleta comprobada para daltonismo).
// El color nunca va solo: cada porción tiene al lado su nombre, su monto y su porcentaje.
const COLORES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];
const COLOR_OTROS = '#a8a29e';
const MAX_PORCIONES = 6;
const RADIO = 72;
const GROSOR = 30;
const CONTORNO = 2 * Math.PI * RADIO;

const CAMPO = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-brand-ink placeholder:text-stone-400 focus:border-brand-brown focus:outline-none focus:ring-4 focus:ring-brand-gold/25';
const ETIQUETA = 'mb-1 block text-sm font-bold text-brand-ink';

function fechaLarga(ymd: string) {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const suma = (movimientos: Movimiento[], tipo: Movimiento['tipo']) => movimientos.filter((item) => item.tipo === tipo).reduce((total, item) => total + item.monto, 0);

/** Junta los movimientos con el mismo concepto y los ordena de mayor a menor. */
function agrupar(movimientos: Movimiento[], tipo: Movimiento['tipo']) {
  const porConcepto = new Map<string, { concepto: string; monto: number }>();
  for (const item of movimientos) {
    if (item.tipo !== tipo) continue;
    const clave = item.concepto.trim().toLowerCase();
    const actual = porConcepto.get(clave);
    if (actual) actual.monto += item.monto;
    else porConcepto.set(clave, { concepto: item.concepto.trim(), monto: item.monto });
  }
  return [...porConcepto.values()].sort((a, b) => b.monto - a.monto);
}

export function CuentasClaras({ rendiciones }: { rendiciones: Rendicion[] }) {
  const { user, isAdmin } = useSession();
  const puedeEditar = isAdmin || Boolean(user?.areas?.includes('logistica'));
  const [elegida, setElegida] = useState<string | null>(null);
  const [activa, setActiva] = useState<number | null>(null);
  const [editando, setEditando] = useState<Rendicion | 'nueva' | null>(null);

  const actual = rendiciones.find((item) => item.id === elegida) ?? rendiciones[0] ?? null;

  const { entro, salio, porciones, ingresos } = useMemo(() => {
    const movimientos = actual?.movimientos ?? [];
    const egresos = agrupar(movimientos, 'egreso');
    // Más de seis gastos distintos no se leen en una torta: los más chicos se juntan en "Otros".
    const principales = egresos.slice(0, egresos.length > MAX_PORCIONES ? MAX_PORCIONES - 1 : MAX_PORCIONES);
    const resto = egresos.slice(principales.length);
    const lista = principales.map((item, index) => ({ ...item, color: COLORES[index] }));
    if (resto.length > 0) lista.push({ concepto: `Otros (${resto.length})`, monto: resto.reduce((total, item) => total + item.monto, 0), color: COLOR_OTROS });
    const total = suma(movimientos, 'egreso');
    // Cada porción arranca donde termina la anterior, medido sobre el contorno del círculo.
    let recorrido = 0;
    const conArco = lista.map((item) => {
      const largo = total > 0 ? (item.monto / total) * CONTORNO : 0;
      const arco = { ...item, inicio: recorrido, largo };
      recorrido += largo;
      return arco;
    });
    return { entro: suma(movimientos, 'ingreso'), salio: total, porciones: conArco, ingresos: agrupar(movimientos, 'ingreso') };
  }, [actual]);

  if (!actual && !puedeEditar) return null;

  const saldo = entro - salio;
  const porcentaje = (monto: number) => (salio > 0 ? Math.round((monto / salio) * 100) : 0);

  return (
    <section aria-labelledby="cuentas-titulo" className="mb-14 sm:mb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="cuentas-titulo" className="m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink">Cuentas claras</h2>
          <p className="m-0 mt-3 max-w-xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">Cuánto entró, cuánto salió y en qué se usó la plata de cada evento.</p>
        </div>
        {puedeEditar && (
          <div className="flex flex-wrap gap-2">
            {actual && (
              <button type="button" onClick={() => setEditando(actual)} className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
                <Pencil size={15} aria-hidden /> Editar
              </button>
            )}
            <button type="button" onClick={() => setEditando('nueva')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-brown px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
              <Plus size={15} aria-hidden /> Cargar un evento
            </button>
          </div>
        )}
      </div>

      {!actual ? (
        <p className="m-0 mt-6 max-w-none rounded-2xl border-2 border-dashed border-brand-brown/25 px-5 py-10 text-center text-base text-brand-ink/70">
          Todavía no hay ninguna rendición cargada. Nadie más ve esta sección hasta que cargues la primera.
        </p>
      ) : (
        <>
          {rendiciones.length > 1 && (
            <div role="group" aria-label="Elegir el evento" className="mt-5 flex flex-wrap gap-2">
              {rendiciones.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === actual.id}
                  onClick={() => { setElegida(item.id); setActiva(null); }}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown ${item.id === actual.id ? 'bg-red-600 text-white' : 'bg-white text-brand-ink ring-1 ring-brand-brown/15 hover:bg-red-50'}`}
                >
                  {item.evento}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-[28px] bg-white p-5 ring-1 ring-brand-brown/10 sm:p-8">
            <h3 className="m-0 text-left font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-3xl">{actual.evento}</h3>
            <p className="m-0 mt-1 max-w-none text-left text-sm text-brand-ink/65">{fechaLarga(actual.fecha)}</p>

            <dl className="m-0 mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-brand-cream p-4">
                <dt className="text-sm font-bold text-brand-ink/70">Entró</dt>
                <dd className="m-0 mt-1 font-display text-3xl font-extrabold tabular-nums text-brand-ink">{formatMonto(entro)}</dd>
              </div>
              <div className="rounded-2xl bg-brand-cream p-4">
                <dt className="text-sm font-bold text-brand-ink/70">Salió</dt>
                <dd className="m-0 mt-1 font-display text-3xl font-extrabold tabular-nums text-brand-ink">{formatMonto(salio)}</dd>
              </div>
              <div className="rounded-2xl bg-brand-deep p-4 text-white">
                <dt className="text-sm font-bold text-white/75">{saldo >= 0 ? 'Quedó' : 'Faltó'}</dt>
                <dd className="m-0 mt-1 font-display text-3xl font-extrabold tabular-nums">{formatMonto(Math.abs(saldo))}</dd>
              </div>
            </dl>

            {porciones.length > 0 && (
              <div className="mt-8 grid items-center gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-10">
                <h4 className="m-0 text-left font-display text-xl font-extrabold text-brand-ink lg:col-span-2">En qué se gastó</h4>
                <div className="relative mx-auto w-full max-w-[15rem]" onMouseLeave={() => setActiva(null)}>
                  <svg viewBox="0 0 200 200" role="img" aria-label={`Gastos de ${actual.evento}: ${porciones.map((item) => `${item.concepto} ${porcentaje(item.monto)} por ciento`).join(', ')}`} className="block w-full -rotate-90">
                    {porciones.map((item, index) => {
                      const { inicio, largo } = item;
                      return (
                        <circle
                          key={item.concepto}
                          cx="100"
                          cy="100"
                          r={RADIO}
                          fill="none"
                          stroke={item.color}
                          strokeWidth={activa === index ? GROSOR + 6 : GROSOR}
                          // Dos unidades menos por porción: queda una separación del color del fondo entre una y otra.
                          strokeDasharray={`${Math.max(largo - 2, 0.5)} ${CONTORNO}`}
                          strokeDashoffset={-(inicio + 1)}
                          opacity={activa === null || activa === index ? 1 : 0.35}
                          className="transition-[opacity,stroke-width] duration-200 motion-reduce:transition-none"
                          onMouseEnter={() => setActiva(index)}
                        />
                      );
                    })}
                  </svg>
                  <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
                    <span className="line-clamp-2 text-xs font-bold leading-tight text-brand-ink/65">{activa === null ? 'Salió' : porciones[activa].concepto}</span>
                    <span className="font-display text-xl font-extrabold tabular-nums leading-tight text-brand-ink">{formatMonto(activa === null ? salio : porciones[activa].monto)}</span>
                    {activa !== null && <span className="text-sm font-bold tabular-nums text-brand-ink/65">{porcentaje(porciones[activa].monto)} %</span>}
                  </div>
                </div>

                <ul className="m-0 list-none p-0" onMouseLeave={() => setActiva(null)}>
                  {porciones.map((item, index) => (
                    <li key={item.concepto} className="border-b border-brand-brown/10 last:border-0">
                      <button
                        type="button"
                        onMouseEnter={() => setActiva(index)}
                        onFocus={() => setActiva(index)}
                        onBlur={() => setActiva(null)}
                        onClick={() => setActiva(activa === index ? null : index)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown ${activa === index ? 'bg-brand-cream' : ''}`}
                      >
                        <span aria-hidden className="h-4 w-4 shrink-0 rounded" style={{ backgroundColor: item.color }} />
                        <span className="min-w-0 flex-1 text-base text-brand-ink">{item.concepto}</span>
                        <span className="shrink-0 text-sm tabular-nums text-brand-ink/60">{porcentaje(item.monto)} %</span>
                        <span className="w-28 shrink-0 text-right font-bold tabular-nums text-brand-ink">{formatMonto(item.monto)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ingresos.length > 0 && (
              <div className="mt-8">
                <h4 className="m-0 mb-2 text-left font-display text-xl font-extrabold text-brand-ink">De dónde entró</h4>
                <ul className="m-0 list-none p-0">
                  {ingresos.map((item) => (
                    <li key={item.concepto} className="flex items-baseline justify-between gap-4 border-b border-brand-brown/10 px-2 py-2.5 last:border-0">
                      <span className="text-base text-brand-ink">{item.concepto}</span>
                      <span className="shrink-0 font-bold tabular-nums text-brand-ink">{formatMonto(item.monto)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {actual.nota && <p className="m-0 mt-6 max-w-none whitespace-pre-line rounded-2xl bg-brand-cream p-4 text-left text-sm leading-relaxed text-brand-ink/80">{actual.nota}</p>}
          </div>
        </>
      )}

      {editando && <EditorRendicion inicial={editando === 'nueva' ? null : editando} onCerrar={() => setEditando(null)} onGuardada={(id) => { setElegida(id); setActiva(null); }} />}
    </section>
  );
}

type Fila = { tipo: Movimiento['tipo']; concepto: string; monto: string };

function EditorRendicion({ inicial, onCerrar, onGuardada }: { inicial: Rendicion | null; onCerrar: () => void; onGuardada: (id: string | null) => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [evento, setEvento] = useState(inicial?.evento ?? '');
  const [fecha, setFecha] = useState(inicial?.fecha ?? '');
  const [nota, setNota] = useState(inicial?.nota ?? '');
  const [filas, setFilas] = useState<Fila[]>(() =>
    inicial ? inicial.movimientos.map((item) => ({ tipo: item.tipo, concepto: item.concepto, monto: String(item.monto) })) : [{ tipo: 'ingreso', concepto: 'Inscripciones', monto: '' }, { tipo: 'egreso', concepto: '', monto: '' }],
  );
  const [ocupado, setOcupado] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const cambiar = (index: number, campo: keyof Fila, valor: string) => setFilas((prev) => prev.map((fila, i) => (i === index ? { ...fila, [campo]: valor } : fila)));

  const pedir = async (method: 'PUT' | 'DELETE', body: unknown) => {
    setOcupado(true);
    setError('');
    try {
      const response = await fetch('/api/admin/rendiciones', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'No se pudo guardar.');
      onGuardada(method === 'DELETE' ? null : data.id);
      router.refresh();
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      setOcupado(false);
    }
  };

  const guardar = (event: FormEvent) => {
    event.preventDefault();
    // Las filas vacías se ignoran; las que están a medias las rechaza el servidor con su explicación.
    const movimientos = filas.filter((fila) => fila.concepto.trim() || fila.monto.trim()).map((fila) => ({ tipo: fila.tipo, concepto: fila.concepto.trim(), monto: Number(fila.monto) }));
    pedir('PUT', { id: inicial?.id, evento, fecha, nota, movimientos });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="rendicion-titulo"
      onClose={onCerrar}
      onCancel={(event) => { if (ocupado) event.preventDefault(); }}
      className="m-auto w-[min(44rem,calc(100vw-1.5rem))] max-w-none rounded-3xl bg-brand-paper p-0 text-brand-ink shadow-2xl backdrop:bg-black/60"
    >
      <form onSubmit={guardar} className="flex max-h-[calc(100svh-1.5rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-brand-brown/10 px-5 py-4 sm:px-7">
          <h2 id="rendicion-titulo" className="m-0 text-left font-display text-2xl font-extrabold text-brand-ink">{inicial ? 'Editar la rendición' : 'Cargar un evento'}</h2>
          <button type="button" onClick={onCerrar} disabled={ocupado} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <div>
              <label htmlFor="rendicion-evento" className={ETIQUETA}>Evento</label>
              <input id="rendicion-evento" required maxLength={120} value={evento} onChange={(e) => setEvento(e.target.value)} className={CAMPO} />
            </div>
            <div>
              <label htmlFor="rendicion-fecha" className={ETIQUETA}>Fecha</label>
              <input id="rendicion-fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={CAMPO} />
            </div>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1 p-0 font-display text-lg font-extrabold text-brand-ink">Movimientos</legend>
            <p className="m-0 mb-3 max-w-none text-left text-sm text-brand-ink/65">Los gastos con el mismo concepto se suman solos. Los montos van en pesos, sin puntos ni centavos.</p>
            <ul className="m-0 list-none space-y-2 p-0">
              {filas.map((fila, index) => (
                <li key={index} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-white p-3 ring-1 ring-brand-brown/10 sm:grid-cols-[8.5rem_1fr_9rem_auto] sm:items-center">
                  <select aria-label={`Tipo del movimiento ${index + 1}`} value={fila.tipo} onChange={(e) => cambiar(index, 'tipo', e.target.value)} className={`${CAMPO} col-span-2 sm:col-span-1`}>
                    <option value="ingreso">Entró</option>
                    <option value="egreso">Salió</option>
                  </select>
                  <input aria-label={`Concepto del movimiento ${index + 1}`} maxLength={80} value={fila.concepto} onChange={(e) => cambiar(index, 'concepto', e.target.value)} placeholder={fila.tipo === 'ingreso' ? 'Por ejemplo: Inscripciones' : 'Por ejemplo: Comida'} className={`${CAMPO} col-span-2 sm:col-span-1`} />
                  <input aria-label={`Monto del movimiento ${index + 1}`} inputMode="numeric" pattern="[0-9]*" maxLength={10} value={fila.monto} onChange={(e) => cambiar(index, 'monto', e.target.value.replace(/\D/g, ''))} placeholder="Monto" className={`${CAMPO} tabular-nums`} />
                  <button type="button" aria-label={`Quitar el movimiento ${index + 1}`} onClick={() => setFilas((prev) => prev.filter((_, i) => i !== index))} className="flex h-11 w-11 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown">
                    <Trash2 size={17} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilas((prev) => [...prev, { tipo: 'ingreso', concepto: '', monto: '' }])} className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10"><Plus size={15} aria-hidden /> Algo que entró</button>
              <button type="button" onClick={() => setFilas((prev) => [...prev, { tipo: 'egreso', concepto: '', monto: '' }])} className="inline-flex items-center gap-1.5 rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10"><Plus size={15} aria-hidden /> Algo que salió</button>
            </div>
          </fieldset>

          <div>
            <label htmlFor="rendicion-nota" className={ETIQUETA}>Aclaración (opcional)</label>
            <textarea id="rendicion-nota" rows={2} maxLength={600} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Por ejemplo: lo que quedó se guarda para el próximo campamento." className={`${CAMPO} resize-none`} />
          </div>
        </div>

        <div className="border-t border-brand-brown/10 px-5 py-4 sm:px-7">
          {error && <p role="alert" className="m-0 mb-3 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {inicial ? (
              confirmarBorrado ? (
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-red-800">
                  ¿Borrarla para todos?
                  <button type="button" disabled={ocupado} onClick={() => pedir('DELETE', { id: inicial.id })} className="rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-800">Sí, borrar</button>
                  <button type="button" disabled={ocupado} onClick={() => setConfirmarBorrado(false)} className="rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown">No</button>
                </span>
              ) : (
                <button type="button" disabled={ocupado} onClick={() => setConfirmarBorrado(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-50"><Trash2 size={15} aria-hidden /> Borrar</button>
              )
            ) : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={onCerrar} disabled={ocupado} className="rounded-full border border-brand-brown/25 px-5 py-2.5 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10">Cancelar</button>
              <button type="submit" disabled={ocupado} className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood disabled:opacity-60">
                {ocupado && <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      </form>
    </dialog>
  );
}

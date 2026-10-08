'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, BookOpen, ChevronDown, Loader2, Pencil, Plus, X } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import type { TemarioAnio, TemarioItem } from '@/server/db/temario-repository';

// Temario de Formación: el lema del año y la ficha de cada mes (tema, objetivos, iluminación,
// aprendizajes, virtudes, Sagrada Familia, herramientas, festividades y eventos).
// Lo carga y lo edita el equipo de Formación (o un administrador) desde acá mismo.

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const VACIO: TemarioItem = { tema: '', cita: '', detalle: '', materialUrl: '', eje: '', objetivo: '', virtudes: '', sagradaFamilia: '', herramientas: '', festividades: '', eventos: '' };
const CAMPO = 'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base text-brand-ink placeholder:text-stone-400 focus:border-brand-brown focus:outline-none focus:ring-4 focus:ring-brand-gold/25';
const ETIQUETA = 'mb-1 block text-sm font-bold text-brand-ink';

/** Bloques de la ficha de un mes, con los colores del temario impreso. */
const BLOQUES: Array<{ campo: keyof TemarioItem; titulo: string; clase: string; ancho?: boolean }> = [
  { campo: 'objetivo', titulo: 'Objetivos', clase: 'bg-yellow-100' },
  { campo: 'cita', titulo: 'Iluminación', clase: 'bg-yellow-100' },
  { campo: 'virtudes', titulo: 'Virtudes', clase: 'bg-rose-100' },
  { campo: 'detalle', titulo: 'Aprendizajes y vida', clase: 'bg-green-100', ancho: true },
  { campo: 'sagradaFamilia', titulo: 'Sagrada Familia', clase: 'bg-sky-100' },
  { campo: 'herramientas', titulo: 'Herramientas', clase: 'bg-sky-100' },
  { campo: 'festividades', titulo: 'Festividades', clase: 'bg-stone-100' },
  { campo: 'eventos', titulo: 'Eventos', clase: 'bg-stone-100' },
];

/** Campos del formulario de cada mes, en el orden del temario impreso. */
const CAMPOS_MES: Array<{ campo: keyof TemarioItem; etiqueta: string; max: number; largo?: boolean; ancho?: boolean; ayuda?: string }> = [
  { campo: 'tema', etiqueta: 'Tema', max: 140, ancho: true },
  { campo: 'eje', etiqueta: 'Eje del año (opcional)', max: 200, ancho: true, ayuda: 'Por ejemplo: Unidos en Cristo: fortalecer la amistad con Jesús.' },
  { campo: 'objetivo', etiqueta: 'Objetivos', max: 300, ancho: true },
  { campo: 'cita', etiqueta: 'Iluminación (citas bíblicas)', max: 400, ancho: true },
  { campo: 'detalle', etiqueta: 'Aprendizajes y vida', max: 800, largo: true, ancho: true },
  { campo: 'virtudes', etiqueta: 'Virtudes', max: 200 },
  { campo: 'herramientas', etiqueta: 'Herramientas', max: 200 },
  { campo: 'sagradaFamilia', etiqueta: 'Sagrada Familia', max: 200, ancho: true },
  { campo: 'festividades', etiqueta: 'Festividades', max: 500, ancho: true, ayuda: 'Cargalas también en el calendario del sitio: de ahí las toma la página de Espiritualidad.' },
  { campo: 'eventos', etiqueta: 'Eventos', max: 400, ancho: true },
  { campo: 'materialUrl', etiqueta: 'Enlace al material (opcional)', max: 500, ancho: true },
];

interface TemarioProps {
  temario: TemarioAnio[];
  /** Fecha de hoy según el servidor; el navegador la corrige al cargar. */
  anioHoy: number;
  mesHoy: number;
}

function Material({ url, children, className }: { url: string; children: ReactNode; className: string }) {
  return (
    <a href={url} {...(url.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })} className={className}>
      {children}
    </a>
  );
}

export function Temario({ temario, anioHoy, mesHoy }: TemarioProps) {
  const { user, isAdmin } = useSession();
  const puedeEditar = isAdmin || Boolean(user?.areas?.includes('formacion'));
  const [hoy, setHoy] = useState({ anio: anioHoy, mes: mesHoy });
  const [anioElegido, setAnioElegido] = useState<number | null>(null);
  const [mesElegido, setMesElegido] = useState<number | null>(null);
  const [editando, setEditando] = useState<TemarioAnio | null>(null);
  const fichaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ahora = new Date();
    setHoy({ anio: ahora.getFullYear(), mes: ahora.getMonth() + 1 });
  }, []);

  // Por defecto se muestra el año en curso; si no está cargado, el más nuevo que haya.
  const actual = useMemo(
    () => temario.find((item) => item.anio === anioElegido) ?? temario.find((item) => item.anio === hoy.anio) ?? temario[0] ?? null,
    [temario, anioElegido, hoy.anio],
  );

  const nuevoAnio = () => {
    const anio = temario.some((item) => item.anio === hoy.anio) ? Math.max(...temario.map((item) => item.anio)) + 1 : hoy.anio;
    setEditando({ anio, general: { ...VACIO }, meses: [] });
  };

  if (!actual) {
    if (!puedeEditar) return null;
    return (
      <>
        <section className="mb-12 rounded-[28px] border-2 border-dashed border-brand-brown/25 px-6 py-10 text-center sm:mb-16">
          <h2 className="m-0 text-center font-display text-2xl font-extrabold text-brand-ink">Todavía no hay temario cargado</h2>
          <p className="m-0 mx-auto mt-2 max-w-md text-center text-base text-brand-ink/70">Cargá el lema del año y la ficha de cada mes. Nadie más lo ve hasta que lo guardes.</p>
          <button type="button" onClick={nuevoAnio} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
            <Plus size={17} aria-hidden /> Cargar el temario {hoy.anio}
          </button>
        </section>
        {editando && <EditorTemario inicial={editando} esNuevo onCerrar={() => setEditando(null)} />}
      </>
    );
  }

  const esEsteAnio = actual.anio === hoy.anio;
  // Se abre el mes en curso; si ese mes no tiene ficha, el próximo que la tenga.
  const porDefecto = esEsteAnio
    ? actual.meses.find((item) => item.mes >= hoy.mes) ?? actual.meses[actual.meses.length - 1]
    : actual.meses[0];
  const ficha = actual.meses.find((item) => item.mes === mesElegido) ?? porDefecto ?? null;
  const lema = actual.general.tema;

  const elegirMes = (mes: number) => {
    setMesElegido(mes);
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fichaRef.current?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'nearest' });
  };

  return (
    <section aria-labelledby="temario-titulo" className="mb-12 sm:mb-16">
      <div className="relative overflow-hidden rounded-[28px] bg-brand-brown px-6 py-8 text-white shadow-[0_26px_50px_-28px_rgba(58,21,8,0.8)] sm:px-10 sm:py-11">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/25" />
        <div aria-hidden className="absolute -bottom-24 right-28 h-56 w-56 rounded-full bg-yellow-400/15" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          {temario.length > 1 ? (
            <div role="group" aria-label="Elegir el año del temario" className="flex flex-wrap gap-2">
              {temario.map((item) => (
                <button
                  key={item.anio}
                  type="button"
                  aria-pressed={item.anio === actual.anio}
                  onClick={() => { setAnioElegido(item.anio); setMesElegido(null); }}
                  className={`rounded-full px-4 py-1.5 text-sm font-extrabold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${item.anio === actual.anio ? 'bg-yellow-400 text-brand-deep' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {item.anio}
                </button>
              ))}
            </div>
          ) : <span />}
          {puedeEditar && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditando(actual)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-brand-deep transition-colors hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Pencil size={14} aria-hidden /> Editar {actual.anio}
              </button>
              <button type="button" onClick={nuevoAnio} className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-4 py-1.5 text-sm font-extrabold text-white transition-colors hover:bg-white hover:text-brand-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Plus size={14} aria-hidden /> Otro año
              </button>
            </div>
          )}
        </div>

        <div className="relative mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <h2 id="temario-titulo" className="m-0 text-balance text-left font-display text-[clamp(2rem,5.4vw,3.6rem)] font-extrabold leading-[1] tracking-[-0.03em] text-white">
              {lema || `Temario ${actual.anio}`}
            </h2>
            <p className="m-0 mt-4 max-w-xl text-left text-base leading-relaxed text-white/80 sm:text-lg">
              {lema && <strong className="font-bold text-yellow-300">Temario {actual.anio}. </strong>}
              {actual.general.detalle || 'El lema del año y lo que trabajamos cada mes.'}
            </p>
            {actual.general.materialUrl && (
              <Material url={actual.general.materialUrl} className="group mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-extrabold text-brand-deep no-underline transition-colors hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Ver el temario completo
                <ArrowUpRight size={16} aria-hidden className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
              </Material>
            )}
          </div>
          {actual.general.cita && (
            <figure className="m-0 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 sm:p-6">
              <BookOpen size={22} aria-hidden className="text-yellow-300" />
              {/* Párrafo y no <blockquote>: el estilo global de las citas le pone fondo claro. */}
              <p className="m-0 mt-3 max-w-none text-left font-display text-xl font-bold leading-snug text-white sm:text-2xl">{actual.general.cita}</p>
            </figure>
          )}
        </div>
      </div>

      {actual.meses.length > 0 && (
        <div role="group" aria-label="Elegir el mes" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {actual.meses.map((item) => {
            const esHoy = esEsteAnio && item.mes === hoy.mes;
            const abierto = ficha?.mes === item.mes;
            return (
              <button
                key={item.mes}
                type="button"
                aria-pressed={abierto}
                onClick={() => elegirMes(item.mes)}
                className={`flex flex-col rounded-2xl p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown ${abierto ? 'bg-yellow-400 text-brand-deep' : 'bg-white text-brand-ink ring-1 ring-brand-brown/10 hover:bg-amber-50'}`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold">
                  {MESES[item.mes - 1]}
                  {esHoy && <span className={`rounded-full px-2 py-0.5 text-xs ${abierto ? 'bg-brand-deep text-white' : 'bg-yellow-400 text-brand-deep'}`}>Ahora</span>}
                </span>
                <span className="mt-1 line-clamp-3 text-sm leading-snug opacity-85">{item.tema}</span>
              </button>
            );
          })}
        </div>
      )}

      {ficha && (
        <div ref={fichaRef} aria-live="polite" className="mt-4 scroll-mt-24 overflow-hidden rounded-[28px] bg-white ring-1 ring-brand-brown/10">
          <div key={ficha.mes} className="duration-500 ease-out animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none">
            <div className="bg-yellow-400 px-6 py-6 text-brand-deep sm:px-9 sm:py-8">
              <p className="m-0 max-w-none text-left text-sm font-extrabold">
                {MESES[ficha.mes - 1]} {actual.anio}
                {ficha.eje && <span className="font-semibold"> · {ficha.eje}</span>}
              </p>
              <h3 className="m-0 mt-1.5 text-balance text-left font-display text-[clamp(1.6rem,4vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">{ficha.tema}</h3>
            </div>
            <dl className="m-0 grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
              {BLOQUES.filter((bloque) => ficha[bloque.campo]).map((bloque) => (
                <div key={bloque.campo} className={`rounded-2xl p-4 sm:p-5 ${bloque.clase} ${bloque.ancho ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                  <dt className="text-sm font-extrabold text-brand-deep">{bloque.titulo}</dt>
                  <dd className="m-0 mt-1 text-left text-base leading-relaxed text-brand-ink">{ficha[bloque.campo]}</dd>
                </div>
              ))}
            </dl>
            {ficha.materialUrl && (
              <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                <Material url={ficha.materialUrl} className="group inline-flex items-center gap-2 rounded-full bg-brand-brown px-5 py-2.5 text-sm font-extrabold text-white no-underline transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
                  Material de {MESES[ficha.mes - 1].toLowerCase()}
                  <ArrowUpRight size={16} aria-hidden className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </Material>
              </div>
            )}
          </div>
        </div>
      )}

      {editando && <EditorTemario inicial={editando} esNuevo={!temario.some((item) => item.anio === editando.anio)} onCerrar={() => setEditando(null)} />}
    </section>
  );
}

function EditorTemario({ inicial, esNuevo, onCerrar }: { inicial: TemarioAnio; esNuevo: boolean; onCerrar: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [anio, setAnio] = useState(String(inicial.anio));
  const [general, setGeneral] = useState<TemarioItem>({ ...VACIO, ...inicial.general });
  const [meses, setMeses] = useState<TemarioItem[]>(() =>
    MESES.map((_, index) => {
      const cargado = inicial.meses.find((item) => item.mes === index + 1);
      if (!cargado) return { ...VACIO };
      return Object.fromEntries((Object.keys(VACIO) as Array<keyof TemarioItem>).map((campo) => [campo, cargado[campo] ?? ''])) as unknown as TemarioItem;
    }),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const cambiarMes = (index: number, campo: keyof TemarioItem, valor: string) =>
    setMeses((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    const sinTema = meses.findIndex((item) => !item.tema.trim() && Object.values(item).some((valor) => valor.trim()));
    if (sinTema >= 0) {
      setError(`A ${MESES[sinTema].toLowerCase()} le falta el tema. Escribilo o borrá los otros datos de ese mes.`);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const response = await fetch('/api/admin/temario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anio: Number(anio),
          general,
          meses: meses.map((item, index) => ({ ...item, mes: index + 1 })).filter((item) => item.tema.trim()),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo guardar el temario.');
      }
      router.refresh();
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el temario.');
      setGuardando(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="temario-editor-titulo"
      onClose={onCerrar}
      onCancel={(event) => { if (guardando) event.preventDefault(); }}
      className="m-auto w-[min(46rem,calc(100vw-1.5rem))] max-w-none rounded-3xl bg-brand-paper p-0 text-brand-ink shadow-2xl backdrop:bg-black/60"
    >
      <form onSubmit={guardar} className="flex max-h-[calc(100svh-1.5rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-brand-brown/10 px-5 py-4 sm:px-7">
          <div>
            <h2 id="temario-editor-titulo" className="m-0 text-left font-display text-2xl font-extrabold text-brand-ink">{esNuevo ? 'Cargar un temario' : `Editar el temario ${inicial.anio}`}</h2>
            <p className="m-0 mt-1 max-w-none text-left text-sm text-brand-ink/65">Abrí cada mes para cargarlo. Los meses sin tema no se muestran.</p>
          </div>
          <button type="button" onClick={onCerrar} disabled={guardando} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-5 sm:px-7">
          <fieldset className="m-0 mb-3 grid gap-4 border-0 p-0 sm:grid-cols-[8rem_1fr]">
            <legend className="sr-only">Datos del año</legend>
            <div>
              <label htmlFor="temario-anio" className={ETIQUETA}>Año</label>
              <input id="temario-anio" type="number" min={2000} max={2100} required disabled={!esNuevo} value={anio} onChange={(e) => setAnio(e.target.value)} className={`${CAMPO} disabled:bg-stone-100 disabled:text-stone-500`} />
            </div>
            <div>
              <label htmlFor="temario-lema" className={ETIQUETA}>Lema del año</label>
              <input id="temario-lema" maxLength={140} value={general.tema} onChange={(e) => setGeneral({ ...general, tema: e.target.value })} className={CAMPO} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="temario-cita" className={ETIQUETA}>Cita bíblica del año (opcional)</label>
              <input id="temario-cita" maxLength={400} value={general.cita} onChange={(e) => setGeneral({ ...general, cita: e.target.value })} className={CAMPO} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="temario-detalle" className={ETIQUETA}>De qué se trata (opcional)</label>
              <textarea id="temario-detalle" rows={2} maxLength={800} value={general.detalle} onChange={(e) => setGeneral({ ...general, detalle: e.target.value })} className={`${CAMPO} resize-none`} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="temario-material" className={ETIQUETA}>Enlace al temario completo (opcional)</label>
              <input id="temario-material" maxLength={500} value={general.materialUrl} onChange={(e) => setGeneral({ ...general, materialUrl: e.target.value })} placeholder="https://drive.google.com/..." className={CAMPO} />
            </div>
          </fieldset>

          {MESES.map((nombre, index) => (
            <details key={nombre} className="group rounded-2xl bg-white ring-1 ring-brand-brown/10 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown sm:px-5">
                <span className="min-w-0">
                  <span className="block font-display text-lg font-extrabold text-brand-ink">{nombre}</span>
                  <span className="block truncate text-sm text-brand-ink/65">{meses[index].tema.trim() || 'Sin cargar'}</span>
                </span>
                <ChevronDown size={20} aria-hidden className="shrink-0 text-brand-brown transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <div className="grid gap-3 px-4 pb-5 pt-1 sm:grid-cols-2 sm:px-5">
                {CAMPOS_MES.map(({ campo, etiqueta, max, largo, ancho, ayuda }) => {
                  const id = `mes-${index}-${campo}`;
                  return (
                    <div key={campo} className={ancho ? 'sm:col-span-2' : ''}>
                      <label htmlFor={id} className={ETIQUETA}>{etiqueta}</label>
                      {largo ? (
                        <textarea id={id} rows={4} maxLength={max} value={meses[index][campo]} onChange={(e) => cambiarMes(index, campo, e.target.value)} className={`${CAMPO} resize-y`} />
                      ) : (
                        <input id={id} maxLength={max} value={meses[index][campo]} onChange={(e) => cambiarMes(index, campo, e.target.value)} placeholder={campo === 'materialUrl' ? 'https://...' : undefined} aria-describedby={ayuda ? `${id}-ayuda` : undefined} className={CAMPO} />
                      )}
                      {ayuda && <p id={`${id}-ayuda`} className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">{ayuda}</p>}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>

        <div className="border-t border-brand-brown/10 px-5 py-4 sm:px-7">
          {error && <p role="alert" className="m-0 mb-3 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onCerrar} disabled={guardando} className="rounded-full border border-brand-brown/25 px-5 py-2.5 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">Cancelar</button>
            <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60">
              {guardando && <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" />}
              {guardando ? 'Guardando...' : 'Guardar temario'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

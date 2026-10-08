'use client';

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { ERROR_CLASS, HELP_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON } from './ui';

// Formulario de una pregunta por pantalla, con barra de avance y transición entre preguntas.

export interface Paso {
  id: string;
  /** Texto corto arriba de la pregunta, p. ej. de qué persona se está hablando. */
  etiqueta?: string;
  /** La pregunta, en grande. */
  titulo: string;
  ayuda?: string;
  contenido: ReactNode;
  /** Mensaje si falta algo en este paso; null si está completo. */
  validar: () => string | null;
}

export const OPCION_CLASS =
  'flex w-full items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left text-base font-bold transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown motion-reduce:transition-none motion-reduce:active:scale-100';
export const opcionClass = (activa: boolean) =>
  `${OPCION_CLASS} ${activa ? 'border-brand-brown bg-brand-brown text-white' : 'border-stone-300 bg-white text-brand-ink hover:border-brand-brown/60 hover:bg-brand-cream'}`;

/** Primer paso con algo pendiente, para saltar a él antes de enviar. */
export function primerPendiente(pasos: Paso[]): { indice: number; mensaje: string } | null {
  for (const [indice, paso] of pasos.entries()) {
    const mensaje = paso.validar();
    if (mensaje) return { indice, mensaje };
  }
  return null;
}

export function usePasoAPaso() {
  const [indice, setIndice] = useState(0);
  const [sentido, setSentido] = useState<'adelante' | 'atras'>('adelante');
  const [error, setError] = useState('');
  // Los avances automáticos corren después de que el estado ya cambió: necesitan la cantidad de pasos del momento.
  const totalRef = useRef(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return {
    indice,
    sentido,
    error,
    setError,
    totalRef,
    ir(destino: number, desde: number) {
      setError('');
      setSentido(destino >= desde ? 'adelante' : 'atras');
      setIndice(Math.max(0, destino));
    },
    /** Tras elegir una opción, pasa a la pregunta siguiente con una pausa corta para que se vea lo elegido. */
    avanzarSolo() {
      setError('');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSentido('adelante');
        setIndice((prev) => Math.min(prev + 1, totalRef.current - 1));
      }, 220);
    },
  };
}

interface PasoAPasoVistaProps {
  wizard: ReturnType<typeof usePasoAPaso>;
  pasos: Paso[];
  busy: boolean;
  /** Texto del botón en el último paso. */
  finalLabel: string;
  busyLabel: string;
  /** Se llama al confirmar el último paso, con ese paso ya validado. */
  onFinish: () => void;
}

export function PasoAPasoVista({ wizard, pasos, busy, finalLabel, busyLabel, onFinish }: PasoAPasoVistaProps) {
  const actual = Math.min(wizard.indice, pasos.length - 1);
  const paso = pasos[actual];
  const esUltimo = actual === pasos.length - 1;
  const { totalRef } = wizard;

  useEffect(() => { totalRef.current = pasos.length; });

  // Al cambiar de paso, el foco va a su primer campo (no al cargar la página, para no robar el foco).
  const contenedorRef = useRef<HTMLDivElement>(null);
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    // En las preguntas de opciones el foco va al título: si fuera a un botón, un Enter de más elegiría esa opción sin querer.
    const campo = contenedorRef.current?.querySelector<HTMLElement>('input:not([type="checkbox"]):not([type="radio"]), select, textarea') ?? contenedorRef.current?.querySelector<HTMLElement>('h3');
    campo?.focus({ preventScroll: true });
    contenedorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [paso.id]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problema = paso.validar();
    if (problema) {
      wizard.setError(problema);
      return;
    }
    if (esUltimo) onFinish();
    else wizard.ir(actual + 1, actual);
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuemin={1} aria-valuemax={pasos.length} aria-valuenow={actual + 1} aria-label="Avance de la inscripción">
          <div className="h-full rounded-full bg-brand-brown transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${((actual + 1) / pasos.length) * 100}%` }} />
        </div>
        <p className="m-0 mt-2 max-w-none text-left text-xs font-bold uppercase tracking-wide text-brand-ink/55">Paso {actual + 1} de {pasos.length}</p>
      </div>

      <div
        key={paso.id}
        ref={contenedorRef}
        className={`min-h-[14rem] scroll-mt-28 duration-300 ease-out animate-in fade-in-0 motion-reduce:animate-none ${wizard.sentido === 'adelante' ? 'slide-in-from-right-6' : 'slide-in-from-left-6'}`}
      >
        {paso.etiqueta && (
          <p className="m-0 mb-3 inline-flex max-w-none rounded-full bg-brand-cream px-3 py-1 text-left text-xs font-bold text-brand-brown">{paso.etiqueta}</p>
        )}
        <h3 tabIndex={-1} className="m-0 text-balance text-left font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink outline-none sm:text-[1.75rem]">{paso.titulo}</h3>
        {paso.ayuda && <p className={`${HELP_CLASS} mt-2`}>{paso.ayuda}</p>}
        <div className="mt-6">{paso.contenido}</div>
      </div>

      {wizard.error && <p role="alert" className={`${ERROR_CLASS} mt-5`}>{wizard.error}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
          {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {busy ? busyLabel : esUltimo ? finalLabel : 'Siguiente'}
          {!busy && !esUltimo && <ArrowRight size={18} aria-hidden />}
        </button>
        {actual > 0 && (
          <button type="button" disabled={busy} onClick={() => wizard.ir(actual - 1, actual)} className={SECONDARY_BUTTON}>
            <ArrowLeft size={16} aria-hidden />
            Atrás
          </button>
        )}
      </div>
    </form>
  );
}

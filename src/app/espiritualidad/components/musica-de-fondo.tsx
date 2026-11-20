'use client';

import { useEffect, useRef, useState } from 'react';
import { Music, Pause, Volume1, Volume2 } from 'lucide-react';

// Melodía de fondo para rezar el Rosario. Nunca arranca sola: la enciende quien quiere.
// El archivo va en public/assets/audio/rosario.mp3; mientras no esté, el botón no aparece.

const ARCHIVO = '/assets/audio/rosario.mp3';
// Safari (sobre todo en iPhone) reproduce mejor AAC; el resto usa el MP3.
const ARCHIVO_AAC = '/assets/audio/rosario.m4a';
const VOLUMEN_GUARDADO = 'iam-rosario-volumen';

export function MusicaDeFondo() {
  const audio = useRef<HTMLAudioElement>(null);
  const [hay, setHay] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [volumen, setVolumen] = useState(0.4);
  const [error, setError] = useState(false);
  // En iPhone/iPad, Safari ignora audio.volume (siempre suena al 100 %). Ahí el volumen
  // se controla con Web Audio: el audio pasa por un nodo de ganancia.
  const ganancia = useRef<GainNode | null>(null);
  const contexto = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Se pregunta si el archivo existe sin descargarlo.
    fetch(ARCHIVO, { method: 'HEAD' }).then((response) => setHay(response.ok && (response.headers.get('content-type') ?? '').startsWith('audio'))).catch(() => setHay(false));
    try {
      const guardado = Number(localStorage.getItem(VOLUMEN_GUARDADO));
      if (guardado > 0 && guardado <= 1) setVolumen(guardado);
    } catch {
      // Sin almacenamiento: se usa el volumen por defecto.
    }
  }, []);

  useEffect(() => {
    if (ganancia.current) ganancia.current.gain.value = volumen;
    else if (audio.current) audio.current.volume = volumen;
  }, [volumen, hay]);

  useEffect(() => () => { contexto.current?.close().catch(() => {}); }, []);

  /** Se arma en el primer toque (Safari solo deja crear el audio dentro de un gesto). */
  const prepararVolumen = (elemento: HTMLAudioElement) => {
    if (ganancia.current) {
      contexto.current?.resume().catch(() => {});
      return;
    }
    // Si el navegador respeta audio.volume, no hace falta nada más.
    const antes = elemento.volume;
    elemento.volume = 0.5;
    const respeta = Math.abs(elemento.volume - 0.5) < 0.01;
    elemento.volume = antes;
    if (respeta) return;
    try {
      const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Contexto) return;
      const ctx = new Contexto();
      const nodo = ctx.createGain();
      nodo.gain.value = volumen;
      ctx.createMediaElementSource(elemento).connect(nodo).connect(ctx.destination);
      contexto.current = ctx;
      ganancia.current = nodo;
      ctx.resume().catch(() => {});
    } catch {
      // Sin Web Audio: se queda con el volumen del teléfono.
    }
  };

  if (!hay) return null;

  const alternar = async () => {
    const elemento = audio.current;
    if (!elemento) return;
    setError(false);
    if (sonando) {
      elemento.pause();
      return;
    }
    prepararVolumen(elemento);
    try {
      await elemento.play();
    } catch {
      setError(true);
    }
  };

  const cambiarVolumen = (valor: number) => {
    setVolumen(valor);
    try {
      localStorage.setItem(VOLUMEN_GUARDADO, String(valor));
    } catch {
      // Ídem.
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <audio ref={audio} loop preload="none" playsInline onPlay={() => setSonando(true)} onPause={() => setSonando(false)}>
        <source src={ARCHIVO_AAC} type="audio/mp4" />
        <source src={ARCHIVO} type="audio/mpeg" onError={() => { setSonando(false); setError(true); }} />
      </audio>
      <button
        type="button"
        onClick={alternar}
        aria-pressed={sonando}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown ${sonando ? 'bg-brand-deep text-white hover:bg-brand-brown' : 'bg-white text-brand-ink shadow-[0_8px_16px_-12px_rgba(58,21,8,0.8)] hover:bg-brand-cream'}`}
      >
        {sonando ? <Pause size={16} aria-hidden /> : <Music size={16} aria-hidden />}
        {sonando ? 'Pausar la música' : 'Rezar con música de fondo'}
      </button>
      {sonando && (
        <label className="flex items-center gap-2 text-sm font-bold text-brand-ink/75 duration-300 animate-in fade-in motion-reduce:animate-none">
          {volumen < 0.5 ? <Volume1 size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
          <span className="sr-only">Volumen de la música</span>
          <input type="range" min={0.05} max={1} step={0.05} value={volumen} onChange={(event) => cambiarVolumen(Number(event.target.value))} className="h-11 w-32 accent-brand-brown" />
        </label>
      )}
      {error && <p role="alert" className="m-0 max-w-none text-left text-sm font-medium text-red-800">No se pudo reproducir la música. Probá de nuevo.</p>}
    </div>
  );
}

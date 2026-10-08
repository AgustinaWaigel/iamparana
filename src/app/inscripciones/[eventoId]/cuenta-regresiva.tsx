'use client';

import { useEffect, useState } from 'react';

// Cuenta regresiva hasta que empieza el evento, con un dígito por ficha (como un tablero).
// Antes de montarse muestra guiones: la hora del servidor y la del navegador no coinciden.

interface CuentaRegresivaProps {
  /** Comienzo del evento, como fecha ISO con zona horaria. */
  inicio: string;
  /** Fin del evento (último día, inclusive), como fecha ISO con zona horaria. */
  fin: string;
}

const UNIDADES = [
  { key: 'dias', label: 'Días' },
  { key: 'horas', label: 'Horas' },
  { key: 'minutos', label: 'Minutos' },
  { key: 'segundos', label: 'Segundos' },
] as const;

function partes(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

export function CuentaRegresiva({ inicio, fin }: CuentaRegresivaProps) {
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    setAhora(Date.now());
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const empieza = new Date(inicio).getTime();
  const termina = new Date(fin).getTime();

  if (ahora !== null && ahora >= empieza) {
    return ahora < termina ? (
      <p className="m-0 max-w-none text-center font-display text-2xl font-extrabold text-[#f6c445] sm:text-3xl">¡Está pasando ahora!</p>
    ) : null;
  }

  const valores = ahora === null ? null : partes(empieza - ahora);

  return (
    <div role="timer" aria-live="off" aria-label={valores ? `Faltan ${valores.dias} días, ${valores.horas} horas y ${valores.minutos} minutos` : 'Cuenta regresiva'} className="flex flex-wrap items-start justify-center gap-x-3 gap-y-3 sm:gap-x-7">
      {UNIDADES.map((unidad) => {
        const valor = valores ? valores[unidad.key] : null;
        const digitos = valor === null ? '--' : String(valor).padStart(2, '0');
        return (
          <div key={unidad.key} className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {digitos.split('').map((digito, index) => (
                <span
                  key={`${index}-${digito}`}
                  className="flex h-12 w-8 items-center justify-center rounded-lg bg-black/45 font-display text-[1.6rem] font-extrabold tabular-nums text-[#f6c445] shadow-[inset_0_-2px_0_rgba(255,255,255,0.06),0_8px_18px_-8px_rgba(0,0,0,0.6)] ring-1 ring-white/10 duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none sm:h-[4.5rem] sm:w-[3.25rem] sm:text-[2.6rem]"
                >
                  {digito}
                </span>
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] text-white/75">{unidad.label}</span>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

/** Número que cuenta desde cero hasta su valor cuando aparece en pantalla. */
export function Contador({ hasta }: { hasta: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Arranca en el valor final: si no hay JavaScript o se pidió menos movimiento, el número ya está bien.
  const [valor, setValor] = useState(hasta);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const inicio = performance.now();
      const duracion = 1100;
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duracion);
        // Frena al llegar, sin rebote.
        setValor(Math.round(hasta * (1 - Math.pow(1 - t, 4))));
        if (t < 1) frame = requestAnimationFrame(paso);
      };
      setValor(0);
      frame = requestAnimationFrame(paso);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [hasta]);

  return <span ref={ref}>{valor}</span>;
}

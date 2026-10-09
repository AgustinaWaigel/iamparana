'use client';

import { useEffect, useState } from 'react';
import { Download, Share, Smartphone } from 'lucide-react';

// Tarjeta para instalar el sitio como aplicación en el celular o la computadora.
// Aparece solo donde tiene sentido: no se muestra si ya está instalada ni si el navegador no lo permite.

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstalarApp({ className = '' }: { className?: string }) {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [esIos, setEsIos] = useState(false);
  const [instalada, setInstalada] = useState(true);
  const [pasos, setPasos] = useState(false);

  useEffect(() => {
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalada(yaInstalada);
    // En iPhone y iPad no hay botón automático: se instala a mano desde el menú Compartir de Safari.
    setEsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent));

    const alOfrecer = (event: Event) => {
      event.preventDefault();
      setEvento(event as EventoInstalar);
    };
    const alInstalar = () => { setInstalada(true); setEvento(null); };
    window.addEventListener('beforeinstallprompt', alOfrecer);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alOfrecer);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  if (instalada || (!evento && !esIos)) return null;

  const instalar = async () => {
    if (!evento) {
      setPasos((valor) => !valor);
      return;
    }
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === 'accepted') setInstalada(true);
    setEvento(null);
  };

  return (
    <div className={`flex flex-col rounded-[22px] bg-brand-deep p-5 text-white sm:p-6 ${className}`}>
      <Smartphone size={26} aria-hidden className="text-brand-gold" />
      <h3 className="m-0 mt-3 text-left font-display text-xl font-extrabold leading-tight">Llevá la IAM en tu celular</h3>
      <p className="m-0 mt-1.5 max-w-none text-left text-sm leading-relaxed text-white/80">Instalá el sitio como una aplicación: queda con su ícono en la pantalla y se abre más rápido.</p>
      <button
        type="button"
        onClick={instalar}
        aria-expanded={evento ? undefined : pasos}
        className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-brand-gold px-5 py-2.5 text-sm font-extrabold text-brand-deep transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none"
      >
        <Download size={16} aria-hidden />
        {evento ? 'Instalar la app' : 'Cómo instalarla'}
      </button>
      {!evento && pasos && (
        <ol className="m-0 mt-4 list-decimal space-y-1.5 pl-5 text-left text-sm leading-relaxed text-white/90">
          <li>Abrí esta página en Safari.</li>
          <li>Tocá el botón Compartir <Share size={14} aria-hidden className="inline align-[-2px]" />, abajo en la pantalla.</li>
          <li>Elegí «Agregar a inicio» y confirmá.</li>
        </ol>
      )}
    </div>
  );
}

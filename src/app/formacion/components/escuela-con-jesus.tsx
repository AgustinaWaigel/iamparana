import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { FadeInSection } from '@/app/components/common/fade-in-section';

// La Escuela con Jesús: sus cuatro encuentros y los diez momentos de cada encuentro.

const TRAZO = '#3a1508';

/** Dibujos simples, a mano alzada, uno por encuentro. */
const DIBUJOS: Record<string, ReactNode> = {
  libro: (
    <>
      <path d="M40 30c-9-7-20-8-30-5v38c10-3 21-2 30 5 9-7 20-8 30-5V25c-10-3-21-2-30 5Z" fill="#fff" />
      <path d="M40 30v38M17 35c6-1 11 0 16 3M17 45c6-1 11 0 16 3M47 38c5-3 10-4 16-3M47 48c5-3 10-4 16-3" fill="none" />
      <path d="M40 6v14M34 12h12" fill="none" strokeWidth="3.5" />
    </>
  ),
  vela: (
    <>
      <path d="M40 8c7 8 10 13 10 18a10 10 0 0 1-20 0c0-5 3-10 10-18Z" fill="#f6c445" />
      <path d="M40 20c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1-4 4-7Z" fill="#fff" />
      <rect x="30" y="38" width="20" height="30" rx="4" fill="#fff" />
      <path d="M40 31v7M12 24l7 3M68 24l-7 3M16 8l6 6M64 8l-6 6M22 72h36" fill="none" />
    </>
  ),
  huellas: (
    <>
      <path d="M24 44c-6 0-9 6-8 13s5 11 10 10 7-6 6-13-3-10-8-10Z" fill="#fff" />
      <circle cx="14" cy="38" r="2.6" fill="#fff" /><circle cx="21" cy="34" r="3" fill="#fff" /><circle cx="29" cy="35" r="2.6" fill="#fff" />
      <path d="M56 16c-6 0-9 6-8 13s5 11 10 10 7-6 6-13-3-10-8-10Z" fill="#fff" />
      <circle cx="46" cy="10" r="2.6" fill="#fff" /><circle cx="53" cy="6" r="3" fill="#fff" /><circle cx="61" cy="7" r="2.6" fill="#fff" />
      <path d="M40 72c10-3 20-9 26-18" fill="none" strokeDasharray="3 6" />
    </>
  ),
  ronda: (
    <>
      <circle cx="40" cy="14" r="7" fill="#fff" /><circle cx="14" cy="34" r="7" fill="#fff" /><circle cx="66" cy="34" r="7" fill="#fff" />
      <circle cx="24" cy="62" r="7" fill="#fff" /><circle cx="56" cy="62" r="7" fill="#fff" />
      <path d="M33 17 20 29M47 17l13 12M14 42l6 13M66 42l-6 13M31 63h18" fill="none" />
      <path d="M40 34c-3-4-9-1-7 4 1 3 4 5 7 8 3-3 6-5 7-8 2-5-4-8-7-4Z" fill="#d62828" />
    </>
  ),
};

const ENCUENTROS = [
  {
    nombre: 'Catequesis misionera',
    clave: 'Estudio y reflexión',
    dibujo: 'libro',
    color: '#2563eb',
    texto: 'text-white',
    que: 'Se presenta el tema para conocer más a Jesús, a la Iglesia y a la misión. La Palabra de Dios ocupa el lugar más importante.',
    verbos: ['Conocer', 'Escuchar', 'Aprender', 'Descubrir'],
  },
  {
    nombre: 'Espiritualidad misionera',
    clave: 'Celebración',
    dibujo: 'vela',
    color: '#d62828',
    texto: 'text-white',
    que: 'Lo aprendido en Catequesis se interioriza, se vive y se celebra, profundizando la Palabra de Dios.',
    verbos: ['Celebrar', 'Vivir', 'Interiorizar', 'Profundizar'],
  },
  {
    nombre: 'Proyección misionera',
    clave: 'Servicio',
    dibujo: 'huellas',
    color: '#2e9e4f',
    texto: 'text-white',
    que: 'De ser amigos de Jesús a hacer amigos para Jesús: se comparte lo aprendido y vivido con evangelización, animación y cooperación.',
    verbos: ['Anunciar', 'Compartir', 'Ayudar', 'Llevar'],
    nota: 'A veces ocupa dos encuentros: uno para organizar y otro para salir.',
  },
  {
    nombre: 'Comunión misionera',
    clave: 'Comunidad',
    dibujo: 'ronda',
    color: '#f6c445',
    texto: 'text-brand-deep',
    que: 'Se vuelve al grupo para fortalecer los vínculos, compartir, crecer en valores y limar asperezas.',
    verbos: ['Festejar', 'Compartir', 'Fortalecer', 'Afianzar'],
    nota: 'Es el mejor momento para la merienda compartida.',
  },
] as const;

const MOMENTOS = [
  ['Objetivo', 'Uno solo, simple, concreto y que se pueda evaluar.'],
  ['Ambientación', 'Crea el clima y reserva un lugar especial para la Palabra.'],
  ['Animación', 'Un juego o canto breve para romper el hielo.'],
  ['Oración inicial', 'Dispone el corazón.'],
  ['Testimonio', 'Se comparte la vida y se revisan los compromisos.'],
  ['Experiencia de vida', 'Un recurso creativo para descubrir el mensaje.'],
  ['Iluminación', 'Una cita bíblica que se entienda.'],
  ['Dinámica', 'Une la vida con la Palabra.'],
  ['Compromisos', 'Cada uno los elige libremente y los anota en su Cuaderno Misionero.'],
  ['Oración final', 'Agradece y sella el compromiso.'],
] as const;

export function EscuelaConJesus() {
  return (
    <section aria-labelledby="escuela-titulo" className="mt-16 sm:mt-24">
      <FadeInSection>
        <h2 id="escuela-titulo" className="m-0 text-left font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink">
          La Escuela con Jesús
        </h2>
        <p className="m-0 mt-3 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">
          Cada tema se recorre en cuatro encuentros, siempre en este orden. Los cuatro son igual de importantes: ninguno se saltea.
        </p>
      </FadeInSection>

      <FadeInSection>
        <ol className="m-0 mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {ENCUENTROS.map((encuentro, index) => (
            <li
              key={encuentro.nombre}
              className={`pop-in group relative flex flex-col overflow-hidden rounded-[26px] p-6 shadow-[0_22px_40px_-26px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transform-none ${encuentro.texto}`}
              style={{ backgroundColor: encuentro.color, ['--d' as string]: `${index * 110}ms` }}
            >
              <span aria-hidden className="absolute -right-3 -top-7 font-display text-[9rem] font-extrabold leading-none opacity-15">{index + 1}</span>
              <svg viewBox="0 0 80 80" aria-hidden className="relative h-24 w-24 transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none" stroke={TRAZO} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {DIBUJOS[encuentro.dibujo]}
              </svg>
              <h3 className="relative m-0 mt-5 text-left font-display text-2xl font-extrabold leading-tight">{encuentro.nombre}</h3>
              <p className="relative m-0 mt-1 max-w-none text-left text-sm font-bold opacity-85">{encuentro.clave}</p>
              <p className="relative m-0 mt-3 max-w-none text-left text-[15px] leading-relaxed opacity-95">{encuentro.que}</p>
              <ul aria-label="Verbos para pensar el objetivo" className="relative m-0 mt-4 flex list-none flex-wrap gap-1.5 p-0">
                {encuentro.verbos.map((verbo) => (
                  <li key={verbo} className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-brand-deep">{verbo}</li>
                ))}
              </ul>
              {'nota' in encuentro && (
                <p className="relative m-0 mt-auto max-w-none pt-5 text-left text-sm font-semibold opacity-90">{encuentro.nota}</p>
              )}
            </li>
          ))}
        </ol>
      </FadeInSection>

      <details className="group mt-6 rounded-[22px] bg-white ring-1 ring-brand-brown/10 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[22px] px-6 py-5 text-left transition-colors hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
          <span>
            <span className="block font-display text-xl font-extrabold text-brand-ink">Los diez momentos de cada encuentro</span>
            <span className="mt-0.5 block text-sm text-brand-ink/65">El orden que sigue cualquiera de los cuatro, de principio a fin.</span>
          </span>
          <ChevronDown size={22} aria-hidden className="shrink-0 text-brand-brown transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <ol className="m-0 grid list-none gap-x-8 gap-y-4 px-6 pb-6 pt-2 sm:grid-cols-2">
          {MOMENTOS.map(([nombre, detalle], index) => (
            <li key={nombre} className="flex gap-3">
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 font-display text-base font-extrabold text-brand-deep">{index + 1}</span>
              <span>
                <span className="block font-bold text-brand-ink">{nombre}</span>
                <span className="block text-sm leading-relaxed text-brand-ink/70">{detalle}</span>
              </span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

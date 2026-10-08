import { ArrowDown } from 'lucide-react';
import type { EstadoInscripcion } from '@/server/lib/inscripciones-eventos';
import { formatFecha } from '../ui';
import { CuentaRegresiva } from './cuenta-regresiva';

// Portada de la página de un evento: los colores misioneros (uno por continente), el nombre
// en grande, la cuenta regresiva y el llamado a inscribirse.

const VERDE = '#2e9e4f';
const ROJO = '#d62828';
const BLANCO = '#ffffff';
const AZUL = '#2563eb';
const AMARILLO = '#f6c445';
const COLORES = [VERDE, ROJO, BLANCO, AZUL, AMARILLO];

interface EventoHeroProps {
  nombre: string;
  fecha: string;
  fechaFin: string | null;
  descripcion: string | null;
  estado: EstadoInscripcion;
  abreAt: string | null;
  cierraAt: string | null;
}

/** Separa un año al final del nombre ("Campamento 2026") para mostrarlo aparte, en grande. */
function partirNombre(nombre: string): { texto: string; anio: string | null } {
  const match = /^(.*?)[\s,–-]*((?:19|20)\d{2})\s*$/.exec(nombre.trim());
  return match && match[1].trim() ? { texto: match[1].trim(), anio: match[2] } : { texto: nombre.trim(), anio: null };
}

function fechaCorta(ymd: string) {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

export function EventoHero({ nombre, fecha, fechaFin, descripcion, estado, abreAt, cierraAt }: EventoHeroProps) {
  const { texto, anio } = partirNombre(nombre);
  const palabras = texto.split(/\s+/);
  const ultima = palabras.length > 1 ? palabras.pop()! : null;
  const cuando = fechaFin && fechaFin !== fecha ? `Del ${fechaCorta(fecha)} al ${fechaCorta(fechaFin)}` : formatFecha(fecha);
  // El evento empieza a las 0 h de su primer día y termina al final del último, en hora de Argentina.
  const inicio = `${fecha}T00:00:00-03:00`;
  const fin = `${fechaFin ?? fecha}T23:59:59-03:00`;

  const aviso =
    estado === 'abierta' && cierraAt ? `La inscripción cierra el ${fechaCorta(cierraAt)}`
    : estado === 'proxima' && abreAt ? `La inscripción abre el ${fechaCorta(abreAt)}`
    : estado === 'cerrada' ? 'La inscripción ya cerró'
    : null;

  const cinta = ['¡Inscribite!', nombre, cuando];

  return (
    <section aria-labelledby="evento-titulo" className="relative isolate overflow-hidden bg-[#1f0b04] text-white">
      {/* Las cintas de los cinco colores misioneros, en abanico detrás del título */}
      <svg aria-hidden viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-20 h-full w-full">
        {COLORES.map((color, index) => (
          <polygon
            key={color}
            points={`${-200 + index * 260},860 ${60 + index * 260},860 ${1020 + index * 140},-120 ${880 + index * 140},-120`}
            fill={color}
            opacity={color === BLANCO ? 0.5 : 0.85}
            className="evento-cinta"
            style={{ ['--d' as string]: `${index * 110}ms` }}
          />
        ))}
      </svg>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(31,11,4,0.62)_0%,rgba(31,11,4,0.8)_55%,rgba(31,11,4,0.94)_100%)]" />

      <div className="mx-auto max-w-5xl px-4 pb-12 pt-20 text-center sm:px-6 sm:pb-16 sm:pt-16">
        <h1 id="evento-titulo" className="m-0 text-balance text-center font-display font-extrabold leading-[0.95] tracking-[-0.035em] sm:mt-10">
          <span className="hero-rise block text-[clamp(2.4rem,8vw,5.5rem)]" style={{ ['--d' as string]: '80ms' }}>
            {palabras.join(' ')}{ultima && <> <span style={{ color: ROJO }} className="[text-shadow:0_2px_0_rgba(0,0,0,0.25)]">{ultima}</span></>}
          </span>
          {anio && (
            <span className="hero-rise mt-1 block text-[clamp(3.6rem,13vw,8.5rem)] leading-[0.9]" style={{ color: AMARILLO, ['--d' as string]: '200ms' }}>
              {anio}
            </span>
          )}
        </h1>

        <p className="hero-rise m-0 mx-auto mt-5 max-w-none text-center font-display text-xl font-bold first-letter:uppercase sm:text-2xl" style={{ color: AMARILLO, ['--d' as string]: '300ms' }}>
          {cuando}
        </p>
        {descripcion && (
          <p className="hero-rise m-0 mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-white/80 sm:text-lg" style={{ ['--d' as string]: '380ms' }}>
            {descripcion}
          </p>
        )}

        {estado !== 'finalizado' && (
          <div className="hero-rise mx-auto mt-8 max-w-2xl rounded-3xl bg-white/[0.06] px-4 py-6 ring-1 ring-white/10 sm:mt-10 sm:px-8 sm:py-7" style={{ ['--d' as string]: '460ms' }}>
            <p className="m-0 mb-4 max-w-none text-center text-xs font-bold uppercase tracking-[0.2em] text-white/70">Falta para el evento</p>
            <CuentaRegresiva inicio={inicio} fin={fin} />
          </div>
        )}

        <div className="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ ['--d' as string]: '560ms' }}>
          {estado === 'abierta' && (
            <a href="#inscripcion" className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-extrabold no-underline shadow-[0_12px_28px_-10px_rgba(246,196,69,0.75)] transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none" style={{ backgroundColor: AMARILLO, color: '#1f0b04' }}>
              ¡Inscribirme!
              <ArrowDown size={18} aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-y-0.5 motion-reduce:transform-none" />
            </a>
          )}
          {aviso && <span className="rounded-full border border-white/25 px-4 py-2 text-sm font-bold text-white/90">{aviso}</span>}
        </div>
      </div>

      {/* Cinta que corre, como un cartel */}
      <div aria-hidden className="overflow-hidden py-2.5" style={{ backgroundColor: AMARILLO, color: '#1f0b04' }}>
        <div className="evento-marquesina flex w-max">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex shrink-0 items-center">
              {Array.from({ length: 4 }).flatMap((_, vuelta) =>
                cinta.map((frase, index) => (
                  <span key={`${copia}-${vuelta}-${index}`} className="flex items-center whitespace-nowrap font-display text-sm font-extrabold uppercase tracking-wide sm:text-base">
                    <span className="px-4 first-letter:uppercase">{frase}</span>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORES[(vuelta * cinta.length + index) % 4 === 2 ? 0 : (vuelta * cinta.length + index) % 4] }} />
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { MISION_DEL_ANIO } from '@/app/components/common/mision-del-anio';
import {
  AVEMARIA, GLORIA, JACULATORIA, LETANIA, MISTERIOS, ORACION_A_MARIA, ORACION_FINAL,
  PADRENUESTRO, SENAL_DE_LA_CRUZ, TRES_AVEMARIAS,
} from './rosario-datos';

// El Rosario Misionero para rezarlo cuenta por cuenta: cinco misterios, uno por continente,
// cada uno con su color. Se avanza con los botones o tocando una cuenta del dibujo.
//
// El recorrido sigue al rosario de verdad: la cruz, una cuenta (Gloria), tres cuentas
// (Avemarías), una cuenta (Padrenuestro del primer misterio) y la medalla, que no lleva oración.
// En el círculo van las diez Avemarías de cada misterio y, entre uno y otro, la cuenta del Padrenuestro.

interface Paso {
  /** Cuenta del dibujo que corresponde a este paso; null cuando el paso abarca todo el misterio. */
  cuenta: string | null;
  /** Misterio al que pertenece (0 a 4), o null en el comienzo y en el final. */
  misterio: number | null;
  titulo: string;
  /** Línea chica sobre la oración: la intención del misterio o una indicación. */
  apoyo?: string;
  oraciones: Array<{ nombre?: string; texto: string }>;
}

const CENTRO = { x: 200, y: 190 };
const RADIO = 150;
/** Lugares del círculo: la medalla, cincuenta Avemarías y los cuatro Padrenuestros que van entre misterios. */
const LUGARES = 55;
const continenteDelAnio = MISION_DEL_ANIO.datos.find((dato) => dato.label === 'Continente')?.valor;

function armarPasos(): Paso[] {
  // Las tres Avemarías del comienzo tienen cada una su variación; la última frase acompaña a la tercera.
  const [primera, segunda, tercera, cierre] = TRES_AVEMARIAS.split('\n\n');
  const pasos: Paso[] = [
    { cuenta: 'cruz', misterio: null, titulo: 'La señal de la cruz', apoyo: 'Nos disponemos a rezar el Santo Rosario.', oraciones: [{ texto: SENAL_DE_LA_CRUZ }] },
    { cuenta: 'gloria', misterio: null, titulo: 'Gloria', oraciones: [{ texto: GLORIA }] },
    ...[primera, segunda, `${tercera}\n\n${cierre}`].map((texto, indice) => ({
      cuenta: `ave-${indice + 1}`, misterio: null, titulo: `Avemaría ${indice + 1} de 3`, apoyo: 'Tres Avemarías con una pequeña variación.', oraciones: [{ texto }],
    })),
  ];
  MISTERIOS.forEach((misterio, indice) => {
    const nombre = `${misterio.orden} misterio: ${misterio.continente}`;
    pasos.push({ cuenta: `m${indice}-0`, misterio: indice, titulo: nombre, apoyo: misterio.intencion, oraciones: [{ nombre: 'Padrenuestro', texto: PADRENUESTRO }] });
    for (let ave = 1; ave <= 10; ave++) {
      pasos.push({ cuenta: `m${indice}-${ave}`, misterio: indice, titulo: `Avemaría ${ave} de 10`, apoyo: `${nombre}. ${misterio.intencion}`, oraciones: [{ texto: AVEMARIA }] });
    }
    pasos.push({ cuenta: null, misterio: indice, titulo: 'Gloria y jaculatoria', apoyo: `Así termina el ${misterio.orden.toLowerCase()} misterio.`, oraciones: [{ nombre: 'Gloria', texto: GLORIA }, { nombre: 'Jaculatoria', texto: JACULATORIA }] });
  });
  // El final se reza volviendo a la cruz.
  pasos.push(
    { cuenta: 'cruz', misterio: null, titulo: 'Oración a María, Reina de las Misiones', apoyo: 'Después de los cinco misterios.', oraciones: [{ texto: ORACION_A_MARIA }] },
    { cuenta: 'cruz', misterio: null, titulo: 'Letanía del Rosario Misionero', oraciones: [{ texto: LETANIA }] },
    { cuenta: 'cruz', misterio: null, titulo: 'Oración final', oraciones: [{ texto: ORACION_FINAL }] },
  );
  return pasos;
}

/**
 * Posición de una cuenta del círculo. La medalla está abajo de todo; desde ahí, en sentido horario,
 * van las diez Avemarías de cada misterio (cuenta 1 a 10) y, antes de cada misterio menos el primero,
 * la cuenta de su Padrenuestro (cuenta 0).
 */
function posicion(misterio: number, cuenta: number) {
  const lugar = misterio * 11 + cuenta;
  const angulo = Math.PI / 2 + (lugar / LUGARES) * Math.PI * 2;
  // Redondeado: el servidor y el navegador tienen que escribir exactamente el mismo número.
  return { cx: Math.round((CENTRO.x + RADIO * Math.cos(angulo)) * 100) / 100, cy: Math.round((CENTRO.y + RADIO * Math.sin(angulo)) * 100) / 100 };
}

const CUENTA = 'cursor-pointer transition-[transform,opacity] duration-300 ease-out [transform-box:fill-box] [transform-origin:center] motion-reduce:transition-none';

export function RosarioMisionero() {
  const pasos = useMemo(armarPasos, []);
  const [actual, setActual] = useState(0);
  const paso = pasos[actual];
  const misterio = paso.misterio === null ? null : MISTERIOS[paso.misterio];
  const acento = misterio?.hex ?? '#f6c445';
  const esUltimo = actual === pasos.length - 1;
  const etapa = misterio ? misterio.continente : actual < 5 ? 'Comienzo' : 'Final';

  // Paso al que lleva cada cuenta del dibujo (el primero, si varios pasos comparten cuenta).
  const pasoDe = (cuenta: string) => pasos.findIndex((item) => item.cuenta === cuenta);
  // Una cuenta está encendida si ya se rezó o es la actual; durante el Gloria se enciende todo el misterio.
  const estilo = (cuenta: string) => {
    const indice = pasoDe(cuenta);
    const esActual = paso.cuenta === cuenta;
    return { opacity: indice <= actual ? 1 : 0.35, transform: esActual ? 'scale(1.75)' : 'none' };
  };
  const anillo = (cuenta: string) => (paso.cuenta === cuenta ? { stroke: '#ffffff', strokeWidth: 1.6 } : {});

  return (
    <section aria-labelledby="rosario-titulo" className="relative mt-14 scroll-mt-24 overflow-clip rounded-[28px] bg-stone-800 px-4 py-8 text-white shadow-[0_26px_50px_-28px_rgba(28,25,23,0.9)] sm:mt-20 sm:px-10 sm:py-12">
      <div aria-hidden className="absolute inset-0 opacity-25 transition-[background] duration-700 motion-reduce:transition-none" style={{ background: `radial-gradient(circle at 22% 40%, ${acento}, transparent 55%)` }} />

      <div className="relative">
        <h2 id="rosario-titulo" className="m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
          El Rosario Misionero
        </h2>
        <p className="m-0 mt-3 max-w-2xl text-left text-base leading-relaxed text-white/80 sm:text-lg">
          Cinco misterios, cinco colores, cinco continentes. Rezalo cuenta por cuenta: avanzá con los botones o tocá una cuenta del rosario.
        </p>

        <div role="group" aria-label="Ir a un misterio" className="mt-6 flex flex-wrap gap-2">
          {MISTERIOS.map((item, indice) => {
            const activo = paso.misterio === indice;
            return (
              <button
                key={item.continente}
                type="button"
                aria-pressed={activo}
                onClick={() => setActual(pasoDe(`m${indice}-0`))}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${activo ? 'bg-white text-stone-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <span aria-hidden className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20" style={{ backgroundColor: item.hex }} />
                {indice + 1}.º {item.continente}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-6 grid items-center gap-6 lg:mt-8 lg:grid-cols-[minmax(0,19rem)_1fr] lg:gap-12">
        <svg viewBox="30 22 340 506" aria-hidden className="mx-auto w-full max-w-[15rem] sm:max-w-[19rem] lg:max-w-none">
          <circle cx={CENTRO.x} cy={CENTRO.y} r={RADIO} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
          <path d="M200 340 V462" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />

          {MISTERIOS.map((item, indice) => (
            <g key={item.continente}>
              {Array.from({ length: 11 }, (_, cuenta) => {
                // El Padrenuestro del primer misterio no está en el círculo: es la cuenta que cuelga junto a la medalla.
                if (indice === 0 && cuenta === 0) return null;
                const id = `m${indice}-${cuenta}`;
                const grande = cuenta === 0;
                return (
                  <circle
                    key={id}
                    {...posicion(indice, cuenta)}
                    r={grande ? 8.5 : 6}
                    fill={grande ? '#d6d3d1' : item.hex}
                    className={CUENTA}
                    style={estilo(id)}
                    {...anillo(id)}
                    onClick={() => setActual(pasoDe(id))}
                  />
                );
              })}
            </g>
          ))}

          {/* La medalla no lleva oración: une el círculo con las cuentas que cuelgan. */}
          <circle cx="200" cy="340" r="11" fill="#f6c445" />
          {/* De la medalla hacia la cruz: Padrenuestro, tres Avemarías y Gloria. */}
          <circle cx="200" cy="366" r="8.5" fill="#d6d3d1" className={CUENTA} style={estilo('m0-0')} {...anillo('m0-0')} onClick={() => setActual(pasoDe('m0-0'))} />
          {[3, 2, 1].map((ave, lugar) => (
            <circle key={ave} cx="200" cy={387 + lugar * 17} r="6" fill="#d6d3d1" className={CUENTA} style={estilo(`ave-${ave}`)} {...anillo(`ave-${ave}`)} onClick={() => setActual(pasoDe(`ave-${ave}`))} />
          ))}
          <circle cx="200" cy="443" r="8.5" fill="#d6d3d1" className={CUENTA} style={estilo('gloria')} {...anillo('gloria')} onClick={() => setActual(pasoDe('gloria'))} />
          <g className={CUENTA} style={{ ...estilo('cruz'), transform: paso.cuenta === 'cruz' ? 'scale(1.2)' : 'none' }} onClick={() => setActual(0)}>
            <path d="M200 462 v56 M184 480 h32" stroke="#f6c445" strokeWidth="7" strokeLinecap="round" />
            <rect x="176" y="456" width="48" height="68" fill="transparent" />
          </g>

          <text x={CENTRO.x} y={CENTRO.y - 4} textAnchor="middle" fill="#fff" className="font-display text-[34px] font-extrabold">{etapa}</text>
          {misterio && <text x={CENTRO.x} y={CENTRO.y + 26} textAnchor="middle" fill={misterio.hex} className="text-[17px] font-bold">{misterio.orden} misterio</text>}
        </svg>

        <div>
          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 sm:p-7">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                <span className="block h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${((actual + 1) / pasos.length) * 100}%`, backgroundColor: acento }} />
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-white/75">{actual + 1} de {pasos.length}</span>
            </div>

            {/* Alto fijo en pantallas grandes: así los botones no se mueven al pasar de una oración corta a una larga. */}
            <div aria-live="polite" className="mt-5 flex min-h-[13rem] flex-col lg:h-[20rem]">
              <div key={actual} className="flex min-h-0 flex-1 flex-col duration-300 ease-out animate-in fade-in-0 slide-in-from-right-2 motion-reduce:animate-none">
                <h3 className="m-0 text-balance text-left font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">{paso.titulo}</h3>
                {paso.apoyo && <p className="m-0 mt-2 max-w-none text-left text-base font-semibold leading-relaxed" style={{ color: acento }}>{paso.apoyo}</p>}
                {misterio && paso.cuenta === `m${paso.misterio}-0` && (
                  <p className="m-0 mt-2 max-w-none text-left text-sm text-white/75">
                    Este misterio es de color {misterio.color}.
                    {misterio.continente === continenteDelAnio && ` Este año rezamos especialmente por ${MISION_DEL_ANIO.pais}.`}
                  </p>
                )}
                <div className="mt-4 max-h-[24rem] min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 lg:max-h-none">
                  {paso.oraciones.map((oracion) => (
                    <div key={oracion.nombre ?? paso.titulo}>
                      {oracion.nombre && <p className="m-0 mb-1 max-w-none text-left text-sm font-extrabold text-white/75">{oracion.nombre}</p>}
                      <p className="m-0 max-w-none whitespace-pre-line text-left text-lg leading-relaxed text-white">{oracion.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* En el celular quedan fijos abajo mientras se lee la oración. */}
          <div className="sticky bottom-3 z-10 mt-4 flex items-center justify-between gap-3 rounded-full bg-stone-900/90 p-2 shadow-lg backdrop-blur lg:static lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <button
              type="button"
              onClick={() => setActual((valor) => Math.max(0, valor - 1))}
              disabled={actual === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/35 px-4 py-3 text-sm font-extrabold sm:px-5 text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40"
            >
              <ArrowLeft size={17} aria-hidden /> Anterior
            </button>
            <button
              type="button"
              onClick={() => setActual((valor) => (esUltimo ? 0 : valor + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-extrabold sm:px-7 text-stone-900 transition-colors hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {esUltimo ? <>Volver a empezar <RotateCcw size={17} aria-hidden /></> : <>Siguiente <ArrowRight size={17} aria-hidden /></>}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

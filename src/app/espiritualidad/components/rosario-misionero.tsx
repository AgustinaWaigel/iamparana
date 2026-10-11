'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { MISION_DEL_ANIO } from '@/app/components/common/mision-del-anio';
import { MusicaDeFondo } from './musica-de-fondo';
import {
  ACTO_DE_CONTRICION, AVEMARIA, CREDO, GLORIA, INTENCIONES_DEL_PAPA, LETANIA, MISTERIOS, MISTERIOS_DEL_DIA, type GrupoDeMisterios,
  OH_JESUS_MIO, ORACION_FINAL, PADRENUESTRO, SALVE, SENAL_DE_LA_CRUZ,
} from './rosario-datos';

// El Rosario Misionero para rezarlo cuenta por cuenta: cinco misterios, uno por continente,
// cada uno con su color. Se avanza con los botones o tocando una cuenta del dibujo.
//
// El orden es el que pasó el equipo. En la cruz: la señal de la cruz, el acto de contrición y el Credo.
// En las cuentas que cuelgan, yendo hacia la medalla: la primera grande es el Padrenuestro, las tres
// chicas son Avemarías y la última grande es el Gloria. En la medalla empieza el primer misterio, y el
// círculo lleva los cinco (Padrenuestro, diez Avemarías, Gloria y "Oh Jesús mío"). Al terminar, de vuelta
// en la medalla: las intenciones del Papa, la Salve y las letanías; y en la cruz, la oración final.

interface Paso {
  /** Cuenta del dibujo que corresponde a este paso; null cuando el paso abarca todo el misterio. */
  cuenta: string | null;
  /** Misterio al que pertenece (0 a 4), o null en el comienzo y en el final. */
  misterio: number | null;
  titulo: string;
  /** Línea chica sobre la oración: la intención del misterio o una indicación. */
  apoyo?: string;
  oraciones: Array<{ nombre?: string; texto: string }>;
  /** Es el anuncio de un misterio (antes de su Padrenuestro). */
  anuncio?: boolean;
}

const CENTRO = { x: 200, y: 190 };
const RADIO = 150;
/** Lugares del círculo: la medalla, cincuenta Avemarías y los cuatro Padrenuestros que van entre misterios. */
const LUGARES = 55;
const continenteDelAnio = MISION_DEL_ANIO.datos.find((dato) => dato.label === 'Continente')?.valor;

/**
 * Reparte entre las dos voces una oración que se divide en dos mitades. Quien empieza dice la primera;
 * se va alternando: en un misterio empieza quien guía y en el siguiente, el resto.
 */
function aDosVoces(texto: string, empiezaGuia: boolean) {
  const [primera, segunda] = texto.split('\n//\n');
  if (segunda === undefined) return texto;
  return `${empiezaGuia ? 'Guía' : 'Todos'}: ${primera}\n${empiezaGuia ? 'Todos' : 'Guía'}: ${segunda}`;
}

// Quien guía va en negrita y con el color del misterio (lo pasa quien usa <Oracion>); el resto, en el color del texto.
const VOZ = { guia: 'font-bold', todos: 'text-brand-ink' };

/** Texto de una oración, con cada voz de su color. Si no marca voces, va todo como "todos". */
function Oracion({ texto, tinta }: { texto: string; tinta: string }) {
  let voz: keyof typeof VOZ = 'todos';
  let anterior: keyof typeof VOZ | null = null;
  const conVoces = /^(Guía|Todos): /m.test(texto) || texto.includes(' — ');
  // Para quien no distingue los colores (o usa lector de pantalla), el cambio de voz también se dice.
  const tramo = (quien: keyof typeof VOZ, contenido: string, clave: string) => {
    const cambia = conVoces && quien !== anterior;
    anterior = quien;
    return (
      <span key={clave} className={VOZ[quien]} style={quien === 'guia' ? { color: tinta } : undefined}>
        {cambia && <span className="sr-only">{quien === 'guia' ? 'Guía: ' : 'Todos: '}</span>}
        {contenido}
      </span>
    );
  };
  return (
    <p className="m-0 max-w-none whitespace-pre-line text-left text-lg leading-relaxed">
      {texto.split('\n').map((linea, indice) => {
        const marca = linea.match(/^(Guía|Todos): /);
        if (marca) voz = marca[1] === 'Guía' ? 'guia' : 'todos';
        const contenido = marca ? linea.slice(marca[0].length) : linea;
        // Letanías: la invocación la dice quien guía y la respuesta, todos.
        const [invocacion, respuesta] = contenido.split(' — ');
        return (
          <span key={indice}>
            {respuesta ? <>{tramo('guia', invocacion, 'i')} {tramo('todos', respuesta, 'r')}</> : tramo(voz, contenido, 'l')}
            {'\n'}
          </span>
        );
      })}
    </p>
  );
}

function armarPasos(grupo: GrupoDeMisterios | null): Paso[] {
  const pasos: Paso[] = [
    { cuenta: 'cruz', misterio: null, titulo: 'La señal de la cruz', apoyo: 'Nos disponemos a rezar el Rosario Misionero.', oraciones: [{ texto: SENAL_DE_LA_CRUZ }] },
    { cuenta: 'cruz', misterio: null, titulo: 'Acto de contrición', apoyo: 'Le pedimos perdón a Jesús, todos juntos.', oraciones: [{ texto: ACTO_DE_CONTRICION }] },
    { cuenta: 'cruz', misterio: null, titulo: 'Credo', oraciones: [{ texto: CREDO }] },
    { cuenta: 'padre', misterio: null, titulo: 'Padrenuestro', apoyo: 'En la primera cuenta grande.', oraciones: [{ texto: aDosVoces(PADRENUESTRO, true) }] },
    ...[1, 2, 3].map((ave) => ({ cuenta: `ave-${ave}`, misterio: null, titulo: `Avemaría ${ave} de 3`, apoyo: 'En las tres cuentas chicas.', oraciones: [{ texto: aDosVoces(AVEMARIA, true) }] })),
    { cuenta: 'gloria', misterio: null, titulo: 'Gloria', apoyo: 'En la última cuenta grande, antes de la medalla.', oraciones: [{ texto: aDosVoces(GLORIA, true) }] },
  ];
  MISTERIOS.forEach((misterio, indice) => {
    const nombre = `${misterio.orden} misterio: ${misterio.continente}`;
    // Un misterio lo empieza quien guía y el siguiente, el resto.
    const empiezaGuia = indice % 2 === 0;
    // El misterio del día que toca en esta decena (se sabe recién en el navegador, por la fecha).
    const delDia = grupo?.misterios[indice];
    // Primero se anuncia el misterio y se piensa en el continente; después, en la misma cuenta, el Padrenuestro.
    pasos.push({
      cuenta: `m${indice}-0`,
      misterio: indice,
      anuncio: true,
      titulo: nombre,
      apoyo: delDia && grupo ? `Misterios ${grupo.nombre}: ${delDia.titulo}` : undefined,
      oraciones: [
        // De qué trata el misterio, y después por qué se reza.
        ...(delDia?.relato ? [{ nombre: delDia.cita ? `${delDia.titulo} (${delDia.cita})` : delDia.titulo, texto: `Guía: ${delDia.relato}` }] : []),
        ...(delDia?.reflexion ? [{ nombre: 'Reflexión', texto: `Guía: ${delDia.reflexion}` }] : []),
        ...(delDia?.intencion ? [{ nombre: 'Intención misionera de este misterio', texto: `Guía: ${delDia.intencion}` }] : []),
        { nombre: `Por ${misterio.continente}`, texto: `Guía: ${misterio.intencion}` },
      ],
    });
    pasos.push({ cuenta: `m${indice}-0`, misterio: indice, titulo: 'Padrenuestro', apoyo: delDia ? `${nombre} · ${delDia.titulo}` : nombre, oraciones: [{ texto: aDosVoces(PADRENUESTRO, empiezaGuia) }] });
    for (let ave = 1; ave <= 10; ave++) {
      pasos.push({ cuenta: `m${indice}-${ave}`, misterio: indice, titulo: `Avemaría ${ave} de 10`, apoyo: delDia ? `${nombre} · ${delDia.titulo}` : nombre, oraciones: [{ texto: aDosVoces(AVEMARIA, empiezaGuia) }] });
    }
    pasos.push({ cuenta: null, misterio: indice, titulo: 'Gloria y «Oh Jesús mío»', apoyo: `Así termina el ${misterio.orden.toLowerCase()} misterio.`, oraciones: [{ nombre: 'Gloria', texto: aDosVoces(GLORIA, empiezaGuia) }, { nombre: 'Oh Jesús mío (si es la costumbre del grupo)', texto: OH_JESUS_MIO }] });
  });
  pasos.push(
    { cuenta: 'm0-0', misterio: null, titulo: 'Por las intenciones del Papa', apoyo: INTENCIONES_DEL_PAPA, oraciones: [{ nombre: 'Padrenuestro', texto: aDosVoces(PADRENUESTRO, true) }, { nombre: 'Avemaría', texto: aDosVoces(AVEMARIA, true) }, { nombre: 'Gloria', texto: aDosVoces(GLORIA, true) }] },
    { cuenta: 'm0-0', misterio: null, titulo: 'Dios te salve, Reina y Madre', oraciones: [{ texto: SALVE }] },
    { cuenta: 'm0-0', misterio: null, titulo: 'Letanías de la Virgen María', apoyo: 'A cada invocación respondemos todos juntos.', oraciones: [{ texto: LETANIA }] },
    // El final se reza volviendo a la cruz.
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

/** Tinta de cada misterio, en el orden de MISTERIOS: verde, rojo, gris (Europa es blanco), azul y ocre. */
const TINTAS = ['#15803d', '#b91c1c', '#57534e', '#1d4ed8', '#a16207'];
const TINTA_BASE = '#7a3a13';
/** Borde de las cuentas: sin él, la blanca y la amarilla no se ven sobre el fondo claro. */
const BORDE = { stroke: '#3a1508', strokeOpacity: 0.45, strokeWidth: 1 };

const CUENTA = 'cursor-pointer transition-[transform,opacity] duration-300 ease-out [transform-box:fill-box] [transform-origin:center] motion-reduce:transition-none';

export function RosarioMisionero() {
  // Los misterios que tocan hoy (gozosos, luminosos, dolorosos o gloriosos) se eligen solos por el día
  // de la semana. Se calcula en el navegador: el día depende de dónde esté quien reza.
  const [grupo, setGrupo] = useState<GrupoDeMisterios | null>(null);
  useEffect(() => {
    setGrupo(MISTERIOS_DEL_DIA[new Date().getDay()]);
  }, []);
  const pasos = useMemo(() => armarPasos(grupo), [grupo]);
  const [actual, setActual] = useState(0);
  const paso = pasos[actual];
  const misterio = paso.misterio === null ? null : MISTERIOS[paso.misterio];
  const acento = misterio?.hex ?? '#f6c445';
  const tinta = paso.misterio === null ? TINTA_BASE : TINTAS[paso.misterio];
  const esUltimo = actual === pasos.length - 1;
  const etapa = misterio ? misterio.continente : actual < pasos.findIndex((item) => item.misterio !== null) ? 'Comienzo' : 'Final';

  // Paso al que lleva cada cuenta del dibujo (el primero, si varios pasos comparten cuenta).
  const pasoDe = (cuenta: string) => pasos.findIndex((item) => item.cuenta === cuenta);
  // Una cuenta está encendida si ya se rezó o es la actual; durante el Gloria se enciende todo el misterio.
  const estilo = (cuenta: string) => {
    const indice = pasoDe(cuenta);
    const esActual = paso.cuenta === cuenta;
    return { opacity: indice <= actual ? 1 : 0.5, transform: esActual ? 'scale(1.75)' : 'none' };
  };
  const anillo = (cuenta: string) => (paso.cuenta === cuenta ? { stroke: '#3a1508', strokeWidth: 2 } : BORDE);

  return (
    // Ocupa toda la página: es la pantalla para rezar, sin nada alrededor que distraiga.
    <section aria-labelledby="rosario-titulo" className="relative min-h-screen overflow-clip bg-brand-paper px-[max(1rem,calc((100vw-72rem)/2))] pb-16 pt-16 text-brand-ink sm:pb-20 sm:pt-20">
      <div aria-hidden className="absolute inset-0 opacity-20 transition-[background] duration-700 motion-reduce:transition-none" style={{ background: `radial-gradient(circle at 22% 40%, ${acento}, transparent 55%)` }} />

      <div className="relative">
        <h1 id="rosario-titulo" className="m-0 text-left font-display text-[clamp(2.4rem,7vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-brand-ink">
          El Rosario Misionero
        </h1>
        <p className="m-0 mt-4 max-w-2xl text-left text-base leading-relaxed text-brand-ink/80 sm:text-lg">
          Cinco misterios, cinco colores, cinco continentes. Rezalo cuenta por cuenta: avanzá con los botones o tocá una cuenta del rosario.
        </p>
        {/* Los misterios cambian según el día de la semana; acá se avisa cuáles tocan hoy. */}
        {grupo && (
          <p className="m-0 mt-5 inline-flex max-w-none flex-wrap items-baseline gap-x-2 rounded-2xl bg-yellow-400 px-4 py-2.5 text-left text-base font-medium text-brand-deep duration-300 animate-in fade-in motion-reduce:animate-none">
            <span className="first-letter:uppercase">Hoy, {new Date().toLocaleDateString('es-AR', { weekday: 'long' })}, rezamos los</span>
            <strong className="font-display text-xl font-extrabold text-brand-deep">misterios {grupo.nombre}</strong>
          </p>
        )}

        <MusicaDeFondo />

        <div role="group" aria-label="Ir a un misterio" className="mt-6 flex flex-wrap gap-2">
          {MISTERIOS.map((item, indice) => {
            const activo = paso.misterio === indice;
            return (
              <button
                key={item.continente}
                type="button"
                aria-pressed={activo}
                onClick={() => setActual(pasoDe(`m${indice}-0`))}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown ${activo ? 'bg-brand-deep text-white' : 'bg-white text-brand-ink shadow-[0_8px_16px_-12px_rgba(58,21,8,0.8)] hover:bg-brand-cream'}`}
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
          <circle cx={CENTRO.x} cy={CENTRO.y} r={RADIO} fill="none" stroke="rgba(58,21,8,0.25)" strokeWidth="2" />
          <path d="M200 340 V462" stroke="rgba(58,21,8,0.25)" strokeWidth="2" />

          {MISTERIOS.map((item, indice) => (
            <g key={item.continente}>
              {Array.from({ length: 11 }, (_, cuenta) => {
                // El Padrenuestro del primer misterio no tiene cuenta en el círculo: se reza en la medalla.
                if (indice === 0 && cuenta === 0) return null;
                const id = `m${indice}-${cuenta}`;
                const grande = cuenta === 0;
                return (
                  <circle
                    key={id}
                    {...posicion(indice, cuenta)}
                    r={grande ? 8.5 : 6}
                    fill={grande ? '#a8a29e' : item.hex}
                    className={CUENTA}
                    style={estilo(id)}
                    {...anillo(id)}
                    onClick={() => setActual(pasoDe(id))}
                  />
                );
              })}
            </g>
          ))}

          {/* En la medalla empieza el primer misterio y, al final, se rezan las intenciones del Papa, la Salve y las letanías. */}
          <circle cx="200" cy="340" r="11" fill={MISTERIOS[0].hex} className={CUENTA} style={{ ...estilo('m0-0'), transform: paso.cuenta === 'm0-0' ? 'scale(1.45)' : 'none' }} {...anillo('m0-0')} onClick={() => setActual(pasoDe('m0-0'))} />
          {/* De la cruz hacia la medalla: Padrenuestro, tres Avemarías y Gloria. */}
          <circle cx="200" cy="443" r="8.5" fill="#a8a29e" className={CUENTA} style={estilo('padre')} {...anillo('padre')} onClick={() => setActual(pasoDe('padre'))} />
          {[1, 2, 3].map((ave) => (
            <circle key={ave} cx="200" cy={438 - ave * 17} r="6" fill="#a8a29e" className={CUENTA} style={estilo(`ave-${ave}`)} {...anillo(`ave-${ave}`)} onClick={() => setActual(pasoDe(`ave-${ave}`))} />
          ))}
          <circle cx="200" cy="366" r="8.5" fill="#a8a29e" className={CUENTA} style={estilo('gloria')} {...anillo('gloria')} onClick={() => setActual(pasoDe('gloria'))} />
          <g className={CUENTA} style={{ ...estilo('cruz'), transform: paso.cuenta === 'cruz' ? 'scale(1.2)' : 'none' }} onClick={() => setActual(0)}>
            <path d="M200 462 v56 M184 480 h32" stroke="#a16207" strokeWidth="7" strokeLinecap="round" />
            <rect x="176" y="456" width="48" height="68" fill="transparent" />
          </g>

          <text x={CENTRO.x} y={CENTRO.y - 4} textAnchor="middle" fill="#2c1d11" className="font-display text-[34px] font-extrabold">{etapa}</text>
          {misterio && <text x={CENTRO.x} y={CENTRO.y + 26} textAnchor="middle" fill={tinta} className="text-[17px] font-bold">{misterio.orden} misterio</text>}
        </svg>

        <div>
          <div className="rounded-2xl bg-white p-5 shadow-[0_22px_40px_-28px_rgba(58,21,8,0.7)] sm:p-7">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-brand-brown/15">
                <span className="block h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${((actual + 1) / pasos.length) * 100}%`, backgroundColor: tinta }} />
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-brand-ink/70">{actual + 1} de {pasos.length}</span>
            </div>

            {/* Alto fijo en pantallas grandes: así los botones no se mueven al pasar de una oración corta a una larga. */}
            <div aria-live="polite" className="mt-5 flex min-h-[13rem] flex-col lg:h-[20rem]">
              <div key={actual} className="flex min-h-0 flex-1 flex-col duration-300 ease-out animate-in fade-in-0 slide-in-from-right-2 motion-reduce:animate-none">
                <h3 className="m-0 text-balance text-left font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-3xl">{paso.titulo}</h3>
                {paso.apoyo && <p className="m-0 mt-2 max-w-none text-left text-base font-semibold leading-relaxed" style={{ color: tinta }}>{paso.apoyo}</p>}
                {misterio && paso.anuncio && (
                  <p className="m-0 mt-2 max-w-none text-left text-sm text-brand-ink/75">
                    Este misterio es de color {misterio.color}.
                    {misterio.continente === continenteDelAnio && ` Este año rezamos especialmente por ${MISION_DEL_ANIO.pais}.`}
                  </p>
                )}
                {paso.oraciones.some((oracion) => /^(Guía|Todos): /m.test(oracion.texto) || oracion.texto.includes(' — ')) && (
                  <p aria-hidden className="m-0 mt-3 flex max-w-none flex-wrap gap-x-4 gap-y-1 text-left text-sm font-bold">
                    <span className="flex items-center gap-1.5" style={{ color: tinta }}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tinta }} />Quien guía</span>
                    <span className="flex items-center gap-1.5 text-brand-ink"><span className="h-2.5 w-2.5 rounded-full bg-brand-ink" />Todos</span>
                  </p>
                )}
                <div className="mt-4 max-h-[24rem] min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 lg:max-h-none">
                  {paso.oraciones.map((oracion) => (
                    <div key={oracion.nombre ?? paso.titulo}>
                      {oracion.nombre && <p className="m-0 mb-1 max-w-none text-left text-sm font-extrabold text-brand-ink/70">{oracion.nombre}</p>}
                      <Oracion texto={oracion.texto} tinta={tinta} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* En el celular quedan fijos abajo mientras se lee la oración. */}
          <div className="sticky bottom-3 z-10 mt-4 flex items-center justify-between gap-3 rounded-full bg-white/95 p-2 shadow-[0_12px_28px_-10px_rgba(58,21,8,0.6)] backdrop-blur lg:static lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <button
              type="button"
              onClick={() => setActual((valor) => Math.max(0, valor - 1))}
              disabled={actual === 0}
              className="inline-flex items-center gap-2 rounded-full border border-brand-brown/30 px-4 py-3 text-sm font-extrabold sm:px-5 text-brand-brown transition-colors hover:bg-brand-brown/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-40"
            >
              <ArrowLeft size={17} aria-hidden /> Anterior
            </button>
            <button
              type="button"
              onClick={() => setActual((valor) => (esUltimo ? 0 : valor + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-5 py-3 text-base font-extrabold sm:px-7 text-white transition-colors hover:bg-brand-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
            >
              {esUltimo ? <>Volver a empezar <RotateCcw size={17} aria-hidden /></> : <>Siguiente <ArrowRight size={17} aria-hidden /></>}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

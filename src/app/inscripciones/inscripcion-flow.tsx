'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2 } from 'lucide-react';
import type { EventoConfig, GrupoIam, InscripcionConFirmas, PersonaView } from '@/server/db/inscripciones-repository';
import { BajaBoton } from './baja-boton';
import { Familia } from './familia';
import { FirmaPad } from './firma-pad';
import { GRADOS, grupoDeGrado } from './grados';
import { formatMonto, hayMontos, montoPara } from './montos';
import { PasoAPasoVista, opcionClass, primerPendiente, usePasoAPaso, type Paso } from './paso-a-paso';
import { PersonaAvatar, colorPersona } from './persona-avatar';
import { CONDICIONES, CondicionesCampos, condicionSinResponder, type Condiciones } from './salud-campos';
import { AREA_LABEL, CARD_CLASS, ESTADO_LABEL, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, ROL_LABEL, SECONDARY_BUTTON, TEXT_BUTTON, ageOn, formatFecha, postJson } from './ui';

// Inscripción a un evento, una pregunta por pantalla: a quiénes se anota, los datos de cada
// uno para este evento (cómo participa, salud al día, contacto) y, al final, el monto y la
// firma de la autorización. Todo se envía junto: no se puede inscribir sin firmar.

const TEXTO_CLASS = 'm-0 max-h-72 max-w-none overflow-y-auto whitespace-pre-line rounded-xl border border-stone-200 bg-brand-paper p-4 text-left text-[15px] leading-relaxed text-brand-ink';
const CONDICION_CORTA: Record<string, string> = { enfermedad: 'Enfermedad o condición', medicacion: 'Medicación', alergias: 'Alergias', dieta: 'Dieta especial' };
const TELEFONO = /^[0-9+()\s-]{6,25}$/;

/** Claves que el sistema guarda junto a las respuestas del evento; no son preguntas. */
const RESPUESTAS_INTERNAS = ['lleva_comida', 'rol_area', 'rol_anima_a'];

interface Seleccion {
  rol: string;
  area: string;
  animaA: string;
  grado: string;
  condiciones: Condiciones;
  /** true = confirmó que la ficha está al día; false = la está corrigiendo; null = todavía no respondió. */
  saludOk: boolean | null;
  llevaComida: boolean;
  respuestas: Record<string, string>;
  /** true = suma a otra persona a quien avisar; false = alcanza con quien inscribe; null = todavía no respondió. */
  otroContacto: boolean | null;
  contacto: { nombre: string; telefono: string; vinculo: string };
}

interface InscripcionFlowProps {
  eventoId: string;
  eventoFecha: string;
  config: Pick<EventoConfig, 'roles' | 'edadMin' | 'edadMax' | 'preguntas' | 'pideSalud' | 'montos' | 'cierraAt'>;
  personas: PersonaView[];
  grupos: GrupoIam[];
  inscripciones: InscripcionConFirmas[];
  tieneConsentimiento: boolean;
  /** Personas que ya tienen firmada la autorización de este evento (aunque se hayan dado de baja). */
  firmadas: string[];
  /** Permiso de imagen que cada persona ya tiene este año; quien no figura todavía no respondió. */
  imagenVigente: Record<string, boolean>;
  textoEvento: string;
  textoImagen: string;
  /** true si quien inscribe todavía es menor: no firma él, firma un adulto desde su email. */
  titularMenor: boolean;
  /** Adultos a los que ya se les pidió la firma (solo si el titular es menor). */
  adultos: string[];
}

interface Resultado {
  items: Array<{ personaId: string; estado: string }>;
  emailEnviado: boolean;
  esperaAdulto: boolean;
}

export function InscripcionFlow({ eventoId, eventoFecha, config, personas, grupos, inscripciones, tieneConsentimiento, firmadas, imagenVigente, textoEvento, textoImagen, titularMenor, adultos }: InscripcionFlowProps) {
  const router = useRouter();
  const wizard = usePasoAPaso();
  const [seleccion, setSeleccion] = useState<Record<string, Seleccion>>({});
  const [busy, setBusy] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const estadoActual = new Map(inscripciones.filter((item) => item.estado !== 'cancelada').map((item) => [item.personaId, item]));
  const titular = personas.find((persona) => persona.esTitular);

  const [firmante, setFirmante] = useState({ nombre: titular ? `${titular.nombre} ${titular.apellido}` : '', dni: '' });
  const [acepto, setAcepto] = useState(false);
  const [firma, setFirma] = useState<string | null>(null);
  const [imagen, setImagen] = useState<Record<string, boolean>>({});
  const [adulto, setAdulto] = useState({ email: '', email2: '' });

  // Se respeta el orden en que se muestran las personas, no el orden en que se tildaron.
  const elegidas = personas.filter((persona) => seleccion[persona.id]);
  const elegidasIds = elegidas.map((persona) => persona.id);
  const faltaFirma = elegidasIds.filter((id) => !firmadas.includes(id));
  const faltaImagen = elegidasIds.filter((id) => imagenVigente[id] === undefined);
  const hayQueFirmar = faltaFirma.length > 0 || faltaImagen.length > 0;
  // true si todo lo elegido son personas que ya estaban inscriptas: se están corrigiendo datos, no inscribiendo.
  const soloCambios = elegidasIds.length > 0 && elegidasIds.every((id) => estadoActual.has(id));
  const nombreDe = (id: string) => personas.find((persona) => persona.id === id)?.nombre ?? '';
  const edadDe = (persona: PersonaView) => (persona.fechaNacimiento ? ageOn(persona.fechaNacimiento, eventoFecha) : null);
  /** Monto que le toca a alguien por su ciudad. Los de jardín no pagan: 0. null si el evento no tiene monto para esa ciudad. */
  const montoDe = (persona: PersonaView) => {
    const edad = edadDe(persona);
    const grado = seleccion[persona.id]?.grado || persona.grado;
    if (edad !== null && edad < 18 && grado && grupoDeGrado(grado) === 'jardin') return 0;
    return montoPara(config.montos, persona.ciudad);
  };

  /**
   * Rol que se propone. Es solo un punto de partida: cambia de un evento a otro y con los años.
   * Los menores, como niño/adolescente; los adultos, como acompañantes.
   */
  const rolInicial = (persona: PersonaView) => {
    const edad = edadDe(persona);
    const orden = edad !== null && edad < 18 ? ['participante'] : ['acompanante', 'animador', 'area'];
    return orden.find((rol) => (config.roles as string[]).includes(rol)) ?? config.roles[0];
  };

  const toggle = (persona: PersonaView) => {
    const previa = estadoActual.get(persona.id);
    wizard.setError('');
    setSeleccion((prev) => {
      const next = { ...prev };
      if (next[persona.id]) delete next[persona.id];
      else {
        // Se parte de lo último que se respondió, para revisarlo y no escribirlo de nuevo.
        next[persona.id] = {
          rol: previa?.rol ?? rolInicial(persona),
          area: previa?.respuestas.rol_area ?? persona.area ?? '',
          animaA: previa?.respuestas.rol_anima_a ?? persona.animaA ?? '',
          grado: persona.grado ?? '',
          condiciones: {
            enfermedad: persona.salud?.enfermedad ?? null,
            medicacion: persona.salud?.medicacion ?? null,
            alergias: persona.salud?.alergias ?? null,
            dieta: persona.salud?.dieta ?? null,
          },
          saludOk: null,
          llevaComida: previa?.respuestas.lleva_comida === 'si',
          respuestas: Object.fromEntries(Object.entries(previa?.respuestas ?? {}).filter(([key]) => !RESPUESTAS_INTERNAS.includes(key))),
          otroContacto: persona.esTitular || persona.contacto ? true : null,
          contacto: {
            nombre: persona.contacto?.nombre ?? '',
            telefono: persona.contacto?.telefono ?? '',
            vinculo: persona.contacto?.vinculo ?? '',
          },
        };
      }
      return next;
    });
  };

  const update = (personaId: string, patch: Partial<Seleccion>) =>
    setSeleccion((prev) => (prev[personaId] ? { ...prev, [personaId]: { ...prev[personaId], ...patch } } : prev));

  // ── Pasos ──────────────────────────────────────────────────────────────

  const pasos: Paso[] = [
    {
      id: 'quienes',
      titulo: '¿A quiénes inscribís?',
      ayuda: 'Marcá a todos los que van. A quien ya está inscripto le podés modificar los datos o darlo de baja.',
      contenido: (
        <div className="space-y-3">
          {personas.map((persona, indice) => {
            const elegida = Boolean(seleccion[persona.id]);
            const color = colorPersona(indice).fondo;
            const previa = estadoActual.get(persona.id);
            const edad = edadDe(persona);
            const monto = hayMontos(config.montos) && !persona.soloContacto ? montoDe(persona) : null;

            if (previa) {
              // Ya está inscripto: no se vuelve a tildar, se modifica o se da de baja.
              return (
                <div key={persona.id} className="rounded-2xl border-2 p-4" style={{ borderColor: elegida ? color : '#d6d3d1', backgroundColor: elegida ? `${color}14` : '#ffffff' }}>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <PersonaAvatar nombre={persona.nombre} indice={indice} />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 max-w-none text-left font-display text-lg font-extrabold leading-snug text-brand-ink">{persona.nombre} {persona.apellido}</p>
                      <p className="m-0 mt-1.5 flex max-w-none flex-wrap items-center gap-2 text-left text-sm text-brand-ink/65">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                          <CheckCircle2 size={14} aria-hidden /> Ya está inscripto/a
                        </span>
                        <span>{ROL_LABEL[previa.rol] ?? previa.rol} · {ESTADO_LABEL[previa.estado] ?? previa.estado}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <button type="button" onClick={() => toggle(persona)} aria-pressed={elegida} className={TEXT_BUTTON}>
                        {elegida ? 'No modificar' : 'Modificar datos'}
                      </button>
                      {!elegida && <BajaBoton eventoId={eventoId} personaId={persona.id} nombre={persona.nombre} fueraDeTermino={false} />}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <label
                key={persona.id}
                className={`flex items-center gap-3.5 rounded-2xl border-2 p-4 transition-colors motion-reduce:transition-none ${persona.soloContacto ? 'opacity-75' : 'cursor-pointer'}`}
                style={{ borderColor: elegida ? color : '#d6d3d1', backgroundColor: elegida ? `${color}14` : persona.soloContacto ? '#fafaf9' : '#ffffff' }}
              >
                <PersonaAvatar nombre={persona.nombre} indice={indice} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-extrabold leading-snug text-brand-ink">{persona.nombre} {persona.apellido}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-brand-ink/70">
                    {persona.soloContacto
                      ? 'Cargaste solo tu contacto. Si vos también vas, corregí tus datos arriba, en «Tu familia».'
                      : [edad !== null ? `${edad} años en el evento` : '', monto === null ? '' : monto === 0 ? 'No paga (jardín)' : `Inscripción: ${formatMonto(monto)}`].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <input type="checkbox" checked={elegida} onChange={() => toggle(persona)} disabled={persona.soloContacto} className="peer sr-only" />
                {!persona.soloContacto && (
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-white transition-transform duration-200 ease-out peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-brown motion-reduce:transition-none"
                    style={{ borderColor: elegida ? color : '#a8a29e', backgroundColor: elegida ? color : '#ffffff', transform: elegida ? 'scale(1.08)' : 'none' }}
                  >
                    {elegida && <Check size={20} strokeWidth={3.5} />}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      ),
      validar: () => (elegidasIds.length > 0 ? null : 'Elegí al menos una persona para seguir.'),
    },
  ];

  elegidas.forEach((persona, orden) => {
    const item = seleccion[persona.id];
    const id = persona.id;
    const etiqueta = elegidas.length > 1 ? `${persona.nombre} · ${orden + 1} de ${elegidas.length}` : persona.nombre;
    const edad = edadDe(persona);
    const esMenor = edad !== null && edad < 18;
    const vos = persona.esTitular;

    if (config.roles.length > 1) {
      pasos.push({
        id: `${id}:rol`,
        etiqueta,
        titulo: vos ? '¿Cómo participás en este evento?' : `¿Cómo participa ${persona.nombre} en este evento?`,
        contenido: (
          <div className="grid gap-3 sm:grid-cols-2">
            {config.roles.map((rol) => (
              <button key={rol} type="button" aria-pressed={item.rol === rol} onClick={() => { update(id, { rol }); wizard.avanzarSolo(); }} className={opcionClass(item.rol === rol)}>
                {ROL_LABEL[rol] ?? rol} {item.rol === rol && <Check size={18} aria-hidden />}
              </button>
            ))}
          </div>
        ),
        validar: () => ((config.roles as string[]).includes(item.rol) ? null : 'Elegí una opción para seguir.'),
      });
    }

    if (item.rol === 'area') {
      pasos.push({
        id: `${id}:area`,
        etiqueta,
        titulo: '¿En qué área?',
        contenido: (
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(AREA_LABEL).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={item.area === value} onClick={() => { update(id, { area: value }); wizard.avanzarSolo(); }} className={opcionClass(item.area === value)}>
                {label} {item.area === value && <Check size={18} aria-hidden />}
              </button>
            ))}
          </div>
        ),
        validar: () => (item.area ? null : 'Elegí el área para seguir.'),
      });
    }

    if (item.rol === 'animador') {
      pasos.push({
        id: `${id}:anima`,
        etiqueta,
        titulo: '¿A qué grupo o etapa anima?',
        ayuda: 'Es opcional.',
        contenido: (
          <div className="sm:max-w-sm">
            <label htmlFor={`anima-${id}`} className={LABEL_CLASS}>Grupo o etapa</label>
            <input id={`anima-${id}`} className={INPUT_CLASS} value={item.animaA} onChange={(e) => update(id, { animaA: e.target.value })} maxLength={80} placeholder="Ej.: 3° y 4° grado" />
          </div>
        ),
        validar: () => null,
      });
    }

    if (esMenor) {
      pasos.push({
        id: `${id}:grado`,
        etiqueta,
        titulo: vos ? '¿En qué grado o año estás?' : `¿En qué grado o año está ${persona.nombre}?`,
        contenido: (
          <div className="sm:max-w-xs">
            <label htmlFor={`grado-${id}`} className={LABEL_CLASS}>Grado o año escolar</label>
            <select id={`grado-${id}`} className={INPUT_CLASS} value={(GRADOS as readonly string[]).includes(item.grado) ? item.grado : ''} onChange={(e) => update(id, { grado: e.target.value })} required>
              <option value="" disabled>Elegí una opción</option>
              {GRADOS.map((grado) => <option key={grado} value={grado}>{grado}</option>)}
            </select>
          </div>
        ),
        validar: () => ((GRADOS as readonly string[]).includes(item.grado) ? null : 'Elegí el grado o año.'),
      });
    }

    if (config.pideSalud) {
      const incompleta = Boolean(condicionSinResponder(item.condiciones));
      const editando = incompleta || item.saludOk === false;
      pasos.push({
        id: `${id}:salud`,
        etiqueta,
        titulo: vos ? '¿Tu ficha de salud sigue igual?' : `¿La ficha de salud de ${persona.nombre} sigue igual?`,
        ayuda: 'Es lo que tenemos cargado. Si cambió algo (una medicación nueva, otra dosis, una alergia), corregilo acá.',
        contenido: (
          <div className="space-y-5">
            {editando ? (
              <CondicionesCampos uid={id} value={item.condiciones} onChange={(condiciones) => update(id, { condiciones, saludOk: false })} />
            ) : (
              <>
                <dl className="m-0 divide-y divide-brand-brown/10 rounded-xl border border-stone-200 bg-white">
                  {CONDICIONES.map((condicion) => {
                    const valor = item.condiciones[condicion.key];
                    return (
                      <div key={condicion.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                        <dt className="text-sm font-bold text-brand-ink">{CONDICION_CORTA[condicion.key]}</dt>
                        <dd className="m-0 text-right text-sm text-brand-ink/80">{valor?.tiene ? valor.detalle : 'No'}</dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" aria-pressed={item.saludOk === true} onClick={() => { update(id, { saludOk: true }); if (!item.condiciones.dieta?.tiene) wizard.avanzarSolo(); }} className={opcionClass(item.saludOk === true)}>
                    Sí, está al día {item.saludOk === true && <Check size={18} aria-hidden />}
                  </button>
                  <button type="button" onClick={() => update(id, { saludOk: false })} className={opcionClass(false)}>
                    Hay que cambiar algo
                  </button>
                </div>
              </>
            )}

            {item.condiciones.dieta?.tiene && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-cream p-4">
                <input type="checkbox" checked={item.llevaComida} onChange={(e) => update(id, { llevaComida: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-400 accent-brand-brown" />
                <span className="text-sm leading-relaxed text-brand-ink/85">Por su dieta, lleva su propia comida al evento.</span>
              </label>
            )}
          </div>
        ),
        validar: () => {
          const sinResponder = condicionSinResponder(item.condiciones);
          if (sinResponder) return `Falta responder: ${sinResponder.pregunta}`;
          if (CONDICIONES.some((condicion) => item.condiciones[condicion.key]?.tiene && !item.condiciones[condicion.key]?.detalle.trim())) return 'Contanos el detalle de lo que marcaste con «Sí».';
          return item.saludOk === null ? 'Decinos si la ficha sigue igual o si hay que cambiar algo.' : null;
        },
      });
    }

    for (const pregunta of config.preguntas) {
      // Hay preguntas que son solo para algunos (p. ej. el nivel, solo para animadores).
      if (pregunta.roles?.length && !pregunta.roles.includes(item.rol as (typeof pregunta.roles)[number])) continue;
      const valor = item.respuestas[pregunta.id] ?? '';
      const setValor = (value: string) => update(id, { respuestas: { ...item.respuestas, [pregunta.id]: value } });
      const opciones = pregunta.tipo === 'si_no' ? [{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }] : pregunta.opciones.map((opcion) => ({ value: opcion, label: opcion }));
      pasos.push({
        id: `${id}:p:${pregunta.id}`,
        etiqueta,
        titulo: pregunta.texto,
        ayuda: pregunta.obligatoria ? undefined : 'Es opcional.',
        contenido: pregunta.tipo === 'texto' ? (
          <div>
            <label htmlFor={`p-${id}-${pregunta.id}`} className="sr-only">{pregunta.texto}</label>
            <input id={`p-${id}-${pregunta.id}`} className={INPUT_CLASS} value={valor} onChange={(e) => setValor(e.target.value)} maxLength={500} required={pregunta.obligatoria} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {opciones.map((opcion) => (
              <button key={opcion.value} type="button" aria-pressed={valor === opcion.value} onClick={() => { setValor(opcion.value); wizard.avanzarSolo(); }} className={opcionClass(valor === opcion.value)}>
                {opcion.label} {valor === opcion.value && <Check size={18} aria-hidden />}
              </button>
            ))}
          </div>
        ),
        validar: () => (pregunta.obligatoria && !valor.trim() ? (pregunta.tipo === 'texto' ? 'Completá la respuesta para seguir.' : 'Elegí una opción para seguir.') : null),
      });
    }

    pasos.push({
      id: `${id}:contacto`,
      etiqueta,
      titulo: vos ? '¿A quién avisamos si te pasa algo?' : `Si pasa algo con ${persona.nombre}, ¿a quién llamamos?`,
      ayuda: vos
        ? 'Otra persona a quien avisar durante el evento.'
        : titular ? `Te llamamos a vos: ${titular.nombre} ${titular.apellido}${titular.telefono ? `, ${titular.telefono}` : ''}.` : undefined,
      contenido: (
        <div className="space-y-5">
          {!vos && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" aria-pressed={item.otroContacto === false} onClick={() => { update(id, { otroContacto: false }); wizard.avanzarSolo(); }} className={opcionClass(item.otroContacto === false)}>
                Con mi teléfono alcanza {item.otroContacto === false && <Check size={18} aria-hidden />}
              </button>
              <button type="button" aria-pressed={item.otroContacto === true} onClick={() => update(id, { otroContacto: true })} className={opcionClass(item.otroContacto === true)}>
                Agregar a otra persona {item.otroContacto === true && <Check size={18} aria-hidden />}
              </button>
            </div>
          )}
          {item.otroContacto === true && (
            <div className="grid gap-4 duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none sm:grid-cols-3">
              <div>
                <label htmlFor={`c-nombre-${id}`} className={LABEL_CLASS}>Nombre y apellido</label>
                <input id={`c-nombre-${id}`} className={INPUT_CLASS} value={item.contacto.nombre} onChange={(e) => update(id, { contacto: { ...item.contacto, nombre: e.target.value } })} maxLength={120} required />
              </div>
              <div>
                <label htmlFor={`c-telefono-${id}`} className={LABEL_CLASS}>Teléfono</label>
                <input id={`c-telefono-${id}`} type="tel" className={INPUT_CLASS} value={item.contacto.telefono} onChange={(e) => update(id, { contacto: { ...item.contacto, telefono: e.target.value } })} maxLength={25} required />
              </div>
              <div>
                <label htmlFor={`c-vinculo-${id}`} className={LABEL_CLASS}>Relación</label>
                <input id={`c-vinculo-${id}`} className={INPUT_CLASS} value={item.contacto.vinculo} onChange={(e) => update(id, { contacto: { ...item.contacto, vinculo: e.target.value } })} maxLength={60} placeholder="Ej.: abuela, tío" required />
              </div>
            </div>
          )}
        </div>
      ),
      validar: () => {
        if (item.otroContacto === null) return 'Elegí una opción para seguir.';
        if (!item.otroContacto) return null;
        if (!item.contacto.nombre.trim() || !item.contacto.vinculo.trim()) return 'Completá el nombre y la relación del contacto.';
        return TELEFONO.test(item.contacto.telefono.trim()) ? null : 'El teléfono del contacto no parece válido.';
      },
    });
  });

  // Monto: se avisa por las personas que se están inscribiendo ahora (no por las que solo corrigen datos).
  const nuevas = elegidas.filter((persona) => !estadoActual.has(persona.id));
  const conMonto = nuevas.map((persona) => ({ persona, monto: montoDe(persona) })).filter((fila): fila is { persona: PersonaView; monto: number } => fila.monto !== null);
  if (hayMontos(config.montos) && conMonto.length > 0) {
    const total = conMonto.reduce((suma, fila) => suma + fila.monto, 0);
    pasos.push({
      id: 'monto',
      titulo: 'Monto de la inscripción',
      ayuda: 'Depende de la ciudad donde vive cada persona.',
      contenido: (
        <div className="space-y-4">
          <ul className="m-0 list-none divide-y divide-brand-brown/10 rounded-xl border border-stone-200 bg-white p-0">
            {conMonto.map(({ persona, monto }) => (
              <li key={persona.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                <span className="min-w-0 text-base text-brand-ink"><strong className="font-bold">{persona.nombre}</strong> <span className="text-sm text-brand-ink/65">· {persona.ciudad}</span></span>
                <span className="shrink-0 text-base font-bold tabular-nums text-brand-ink">{monto === 0 ? 'No paga (jardín)' : formatMonto(monto)}</span>
              </li>
            ))}
            {conMonto.length > 1 && (
              <li className="flex items-baseline justify-between gap-4 bg-brand-cream px-4 py-3">
                <span className="text-base font-bold text-brand-ink">Total</span>
                <span className="text-lg font-extrabold tabular-nums text-brand-ink">{formatMonto(total)}</span>
              </li>
            )}
          </ul>
          <p className={`${HELP_CLASS} mt-0`}>
            {config.cierraAt
              ? `Podés dar de baja la inscripción sin costo hasta el ${formatFecha(config.cierraAt)}, que es cuando cierra. Después de esa fecha, igual corresponde pagar.`
              : 'El equipo de IAM te va a indicar cómo pagarlo.'}
          </p>
        </div>
      ),
      validar: () => null,
    });
  }

  if (hayQueFirmar && titularMenor) {
    pasos.push({
      id: 'adulto',
      titulo: '¿Qué adulto va a firmar tu autorización?',
      ayuda: adultos.length > 0
        ? `Ya le avisamos a ${adultos.join(', ')}. Si querés que firme otro adulto, escribí su email; si no, dejalo vacío.`
        : 'Como todavía sos menor de edad, la firma un adulto responsable. Le escribimos para que entre con su email y firme; hasta entonces tu inscripción queda pendiente.',
      contenido: (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="flow-adulto-email" className={LABEL_CLASS}>Email del adulto{adultos.length > 0 ? ' (opcional)' : ''}</label>
              <input id="flow-adulto-email" type="email" className={INPUT_CLASS} value={adulto.email} onChange={(e) => setAdulto((prev) => ({ ...prev, email: e.target.value }))} maxLength={254} autoComplete="off" required={adultos.length === 0} />
            </div>
            <div>
              <label htmlFor="flow-adulto-email-2" className={LABEL_CLASS}>Repetí el email</label>
              <input id="flow-adulto-email-2" type="email" className={INPUT_CLASS} value={adulto.email2} onChange={(e) => setAdulto((prev) => ({ ...prev, email2: e.target.value }))} maxLength={254} autoComplete="off" required={adultos.length === 0} />
            </div>
          </div>
          <p className={HELP_CLASS}>Escribilo con cuidado: esa persona va a poder ver tus datos de inscripción.</p>
        </div>
      ),
      validar: () => {
        if (adultos.length === 0 && !adulto.email.trim()) return 'Indicá el email del adulto que va a firmar tu autorización.';
        return adulto.email.trim().toLowerCase() === adulto.email2.trim().toLowerCase() ? null : 'Los dos emails del adulto no coinciden. Revisalos.';
      },
    });
  } else if (hayQueFirmar) {
    if (faltaImagen.length > 0) {
      pasos.push({
        id: 'imagen',
        titulo: '¿Autorizás el uso de imagen?',
        ayuda: 'Es opcional: si decís que no, la inscripción sigue igual.',
        contenido: (
          <div>
            <p className={TEXTO_CLASS} tabIndex={0}>{textoImagen}</p>
            <div className="mt-4 space-y-3">
              {faltaImagen.map((id) => (
                <fieldset key={id} className="m-0 flex min-w-0 flex-wrap items-center justify-between gap-3 border-0 p-0">
                  <legend className="sr-only">Uso de imagen de {nombreDe(id)}</legend>
                  <span aria-hidden className="text-base font-bold text-brand-ink">{nombreDe(id)}</span>
                  <div className="flex gap-2">
                    {[{ label: 'Autorizo', value: true }, { label: 'No autorizo', value: false }].map((opcion) => (
                      <label key={opcion.label} className="cursor-pointer">
                        <input type="radio" name={`imagen-${id}`} className="peer sr-only" checked={imagen[id] === opcion.value} onChange={() => setImagen((prev) => ({ ...prev, [id]: opcion.value }))} />
                        <span className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-brand-ink transition-colors peer-checked:border-brand-brown peer-checked:bg-brand-brown peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-brown">
                          {opcion.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        ),
        validar: () => {
          const sinResponder = faltaImagen.find((id) => imagen[id] === undefined);
          return sinResponder ? `Indicá si autorizás el uso de imagen de ${nombreDe(sinResponder)}.` : null;
        },
      });
    }

    pasos.push({
      id: 'firma',
      titulo: 'Autorización y firma',
      ayuda: faltaFirma.length > 0 ? `Es obligatoria y vale para: ${faltaFirma.map(nombreDe).join(', ')}.` : 'Con tu firma queda registrada tu decisión sobre el uso de imagen.',
      contenido: (
        <div className="space-y-5">
          {faltaFirma.length > 0 && <p className={TEXTO_CLASS} tabIndex={0}>{textoEvento}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="flow-firmante" className={LABEL_CLASS}>Tu nombre y apellido</label>
              <input id="flow-firmante" className={INPUT_CLASS} value={firmante.nombre} onChange={(e) => setFirmante((prev) => ({ ...prev, nombre: e.target.value }))} maxLength={120} autoComplete="off" required />
            </div>
            <div>
              <label htmlFor="flow-dni" className={LABEL_CLASS}>Tu DNI</label>
              <input id="flow-dni" className={INPUT_CLASS} value={firmante.dni} onChange={(e) => setFirmante((prev) => ({ ...prev, dni: e.target.value }))} inputMode="numeric" maxLength={11} autoComplete="off" placeholder="Solo números" required />
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-cream p-4">
            <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-400 accent-brand-brown" />
            <span className="text-sm leading-relaxed text-brand-ink/85">Leí el texto completo y lo acepto. Soy mayor de edad y, si autorizo a menores, los tengo a mi cargo.</span>
          </label>
          <div>
            <p id="flow-firma-titulo" className={LABEL_CLASS}>Firma</p>
            <FirmaPad onChange={setFirma} labelledBy="flow-firma-titulo" />
          </div>
        </div>
      ),
      validar: () => {
        if (!firmante.nombre.trim()) return 'Completá tu nombre y apellido.';
        if (!/^\d{7,8}$/.test(firmante.dni.replace(/[.\s]/g, ''))) return 'El DNI tiene que tener 7 u 8 números.';
        if (!acepto) return 'Para inscribir tenés que marcar que leíste y aceptás la autorización.';
        return firma ? null : 'Falta la firma. Dibujala en el recuadro.';
      },
    });
  }

  // ── Envío ──────────────────────────────────────────────────────────────

  const enviar = async () => {
    const pendiente = primerPendiente(pasos);
    if (pendiente) {
      wizard.ir(pendiente.indice, wizard.indice);
      wizard.setError(pendiente.mensaje);
      return;
    }

    setBusy(true);
    wizard.setError('');
    const result = await postJson<{ inscripciones: Array<{ personaId: string; estado: string }>; emailEnviado: boolean; esperaAdulto: boolean }>('/api/inscripciones/inscribir', {
      eventoId,
      ...(hayQueFirmar && titularMenor ? { adultoEmail: adulto.email } : {}),
      ...(hayQueFirmar && !titularMenor ? { firma: { firmanteNombre: firmante.nombre, firmanteDni: firmante.dni, acepto, firma, imagen } } : {}),
      personas: elegidas.map((persona) => {
        const item = seleccion[persona.id];
        return {
          personaId: persona.id,
          rol: item.rol,
          llevaComida: item.llevaComida,
          respuestas: item.respuestas,
          area: item.rol === 'area' ? item.area : '',
          animaA: item.rol === 'animador' ? item.animaA : '',
          grado: item.grado,
          ...(config.pideSalud ? { salud: item.condiciones } : {}),
          ...(item.otroContacto ? { otroContacto: item.contacto } : {}),
        };
      }),
    });
    setBusy(false);

    if (!result.ok) {
      wizard.setError(result.error);
      return;
    }
    setResultado({ items: result.data.inscripciones.filter((item) => seleccion[item.personaId]), emailEnviado: result.data.emailEnviado, esperaAdulto: result.data.esperaAdulto });
    setSeleccion({});
    setAcepto(false);
    setFirma(null);
    setImagen({});
    setAdulto({ email: '', email2: '' });
    wizard.ir(0, 0);
    router.refresh();
  };

  if (resultado) {
    return (
      <section className={`${CARD_CLASS} p-6 duration-300 ease-out animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none sm:p-8`}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={26} strokeWidth={3} aria-hidden /></span>
          <h2 className="m-0 text-left font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-3xl">¡Listo! Inscripción registrada</h2>
        </div>
        <ul className="m-0 mt-5 list-none space-y-2 p-0">
          {resultado.items.map((item) => {
            const persona = personas.find((p) => p.id === item.personaId);
            return (
              <li key={item.personaId} className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-cream px-4 py-3">
                {persona && <PersonaAvatar nombre={persona.nombre} indice={personas.indexOf(persona)} size="sm" />}
                <span className="flex-1 font-bold text-brand-ink">{persona ? `${persona.nombre} ${persona.apellido}` : 'Persona'}</span>
                <span className="text-sm font-semibold text-brand-ink/75">{ESTADO_LABEL[item.estado] ?? item.estado}</span>
              </li>
            );
          })}
        </ul>
        <p className="m-0 mt-5 max-w-none text-left text-base leading-relaxed text-brand-ink">
          {resultado.esperaAdulto
            ? 'Falta que el adulto firme tu autorización: le avisamos por email. Hasta entonces la inscripción queda pendiente.'
            : resultado.emailEnviado
              ? 'Te mandamos por email una copia en PDF de cada autorización firmada.'
              : 'Las copias en PDF de las autorizaciones están en tu cuenta, en «Mis inscripciones».'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setResultado(null)} className={SECONDARY_BUTTON}>Inscribir a alguien más</button>
          <Link href="/inscripciones/cuenta" className={SECONDARY_BUTTON}>Ver mi cuenta</Link>
        </div>
      </section>
    );
  }

  // Las tres etapas, para que siempre se sepa por dónde se va.
  const faltaTitular = !personas.some((persona) => persona.esTitular);
  const etapa = personas.length === 0 || faltaTitular ? 0 : wizard.indice === 0 ? 1 : 2;
  const ETAPAS = ['Tu familia', 'Quiénes van', 'Datos y firma'];

  return (
    <div className="space-y-8">
      <ol aria-label="Etapas de la inscripción" className="m-0 grid list-none grid-cols-3 gap-2 p-0">
        {ETAPAS.map((nombre, indice) => {
          const hecha = indice < etapa;
          const actual = indice === etapa;
          return (
            <li key={nombre} aria-current={actual ? 'step' : undefined} className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center sm:flex-row sm:justify-center sm:gap-2.5 sm:py-3.5 ${actual ? 'bg-yellow-400 text-brand-deep' : hecha ? 'bg-emerald-100 text-emerald-900' : 'bg-white text-brand-ink/60 ring-1 ring-brand-brown/10'}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${actual ? 'bg-brand-deep text-white' : hecha ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-brand-ink/70'}`}>
                {hecha ? <Check size={16} strokeWidth={3.5} aria-hidden /> : indice + 1}
              </span>
              <span className="text-xs font-extrabold leading-tight sm:text-sm">{nombre}{hecha && <span className="sr-only"> (listo)</span>}</span>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="paso-familia">
        <h2 id="paso-familia" className="m-0 mb-1 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">Tu familia</h2>
        <p className={`${HELP_CLASS} mb-4 mt-0`}>
          {personas.length === 0
            ? 'Empezá por cargar tus datos. Se guardan para los próximos eventos.'
            : `${personas.length === 1 ? 'Hay 1 persona' : `Hay ${personas.length} personas`} en tu cuenta. Quedan guardadas para los próximos eventos.`}
        </p>
        <Familia personas={personas} grupos={grupos} tieneConsentimiento={tieneConsentimiento} compacta />
      </section>

      {personas.length > 0 && (
        <section aria-labelledby="paso-inscripcion">
          <h2 id="paso-inscripcion" className="m-0 mb-4 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">Inscripción</h2>
          <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(58,21,8,0.6)] ring-1 ring-brand-brown/10 sm:p-8">
            <PasoAPasoVista
              wizard={wizard}
              pasos={pasos}
              busy={busy}
              busyLabel="Guardando..."
              finalLabel={elegidas.length === 0 ? 'Siguiente' : soloCambios ? 'Guardar cambios' : hayQueFirmar && !titularMenor ? 'Firmar e inscribir' : 'Inscribir'}
              onFinish={() => void enviar()}
            />
          </div>
        </section>
      )}
    </div>
  );
}

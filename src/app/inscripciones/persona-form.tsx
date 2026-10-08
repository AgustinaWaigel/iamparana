'use client';

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import type { GrupoIam, PersonaView } from '@/server/db/inscripciones-repository';
import { CONDICIONES, type CondicionKey, type Condiciones } from './salud-campos';
import { ERROR_CLASS, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_BUTTON, ageOn, localTodayYmd, postJson } from './ui';

// Carga de una persona de la cuenta, paso a paso: una pregunta por pantalla, con su
// ficha de salud al final. Se completa una vez; en cada inscripción se elige cómo
// participa y se revisa que la ficha de salud siga al día.

const OTRA_CIUDAD = '__otra__';
const SIN_IAM = '__sin_iam__';
const EDAD_MINIMA_TITULAR = 17;
const VINCULOS = ['Hijo/a', 'Nieto/a', 'Sobrino/a', 'Hermano/a', 'A mi cargo (tutor/a)', 'Otro'];
const SEXOS = [{ value: 'F', label: 'Femenino' }, { value: 'M', label: 'Masculino' }, { value: 'X', label: 'X' }];

const OPCION_CLASS =
  'flex w-full items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left text-base font-bold transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown motion-reduce:transition-none motion-reduce:active:scale-100';
const opcionClass = (activa: boolean) =>
  `${OPCION_CLASS} ${activa ? 'border-brand-brown bg-brand-brown text-white' : 'border-stone-300 bg-white text-brand-ink hover:border-brand-brown/60 hover:bg-brand-cream'}`;

/** Mismo control que hace el servidor: 11 números con su dígito verificador. */
function cuilValido(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const mod = 11 - (pesos.reduce((total, peso, index) => total + peso * Number(digits[index]), 0) % 11);
  return (mod === 11 ? 0 : mod === 10 ? 9 : mod) === Number(digits[10]);
}

interface Paso {
  id: string;
  /** La pregunta, en grande. */
  titulo: string;
  ayuda?: string;
  contenido: ReactNode;
  /** Mensaje si falta algo en este paso; null si está completo. */
  validar: () => string | null;
}

interface PersonaFormProps {
  persona?: PersonaView;
  grupos: GrupoIam[];
  /** true si es el adulto titular de la cuenta (la primera persona que se carga). */
  esTitular: boolean;
  /** true si la cuenta todavía no dio su consentimiento de datos. */
  pedirConsentimiento: boolean;
  onSaved: () => void;
  onCancel?: () => void;
}

export function PersonaForm({ persona, grupos, esTitular, pedirConsentimiento, onSaved, onCancel }: PersonaFormProps) {
  const [datos, setDatos] = useState({
    nombre: persona?.nombre ?? '',
    apellido: persona?.apellido ?? '',
    sexo: persona?.sexo ?? '',
    cuil: '',
    fechaNacimiento: persona?.fechaNacimiento ?? '',
    telefono: persona?.telefono ?? '',
    ciudad: persona?.ciudad ?? '',
    // Un adulto ya cargado sin IAM es alguien que eligió "No pertenezco a una IAM".
    grupoId: persona?.grupoId ?? (persona?.fechaNacimiento ? SIN_IAM : ''),
    vinculo: persona?.vinculo ?? '',
  });
  const [grupoSanguineo, setGrupoSanguineo] = useState(persona?.salud?.grupoSanguineo ?? '');
  const [condiciones, setCondiciones] = useState<Condiciones>({
    enfermedad: persona?.salud?.enfermedad ?? null,
    medicacion: persona?.salud?.medicacion ?? null,
    alergias: persona?.salud?.alergias ?? null,
    dieta: persona?.salud?.dieta ?? null,
  });
  const [consentimiento, setConsentimiento] = useState(false);
  // El adulto responsable que no va a los eventos solo deja nombre y teléfono. null = todavía no respondió.
  const [participa, setParticipa] = useState<boolean | null>(persona ? !persona.soloContacto : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [indice, setIndice] = useState(0);
  const [sentido, setSentido] = useState<'adelante' | 'atras'>('adelante');
  const completo = !esTitular || participa === true;

  const set = (key: keyof typeof datos) => (event: { target: { value: string } }) => setDatos((prev) => ({ ...prev, [key]: event.target.value }));

  // Las ciudades salen de los grupos IAM; quien vive en otra la escribe a mano.
  const ciudades = [...new Set(grupos.map((grupo) => grupo.ciudad).filter((ciudad): ciudad is string => Boolean(ciudad)))].sort((a, b) => a.localeCompare(b, 'es'));
  const [otraCiudad, setOtraCiudad] = useState(Boolean(persona?.ciudad) && !ciudades.includes(persona?.ciudad ?? ''));

  /** Al elegir la IAM se propone su ciudad, si todavía no se eligió ninguna. */
  const elegirGrupo = (event: { target: { value: string } }) => {
    const ciudad = grupos.find((grupo) => grupo.id === event.target.value)?.ciudad;
    setDatos((prev) => ({ ...prev, grupoId: event.target.value, ciudad: prev.ciudad || otraCiudad ? prev.ciudad : ciudad ?? '' }));
  };

  const hoy = localTodayYmd();
  const edad = ageOn(datos.fechaNacimiento, hoy);
  const esMenor = edad !== null && edad < 18;
  const esAdulto = edad !== null && !esMenor;
  const uid = persona?.id ?? 'nueva';
  // Para hablar de la persona por su nombre apenas se lo conoce.
  const quien = datos.nombre.trim() || 'esta persona';

  // ── Pasos ──────────────────────────────────────────────────────────────

  const pasoCondicion = (key: CondicionKey): Paso => {
    const item = CONDICIONES.find((condicion) => condicion.key === key)!;
    const valor = condiciones[key];
    const responder = (tiene: boolean) => {
      setCondiciones((prev) => ({ ...prev, [key]: { tiene, detalle: tiene ? prev[key]?.detalle ?? '' : '' } }));
      // Un "No" no necesita nada más: pasa solo a la pregunta siguiente.
      if (!tiene) avanzarSolo();
    };
    return {
      id: key,
      titulo: esTitular ? item.pregunta.replace('¿Tiene', '¿Tenés').replace('¿Toma', '¿Tomás').replace('¿Sigue', '¿Seguís').replace('tiene alguna restricción', 'tenés alguna restricción') : item.pregunta,
      ayuda: key === 'enfermedad' ? 'La ficha de salud se guarda cifrada y la ven solo las personas a cargo del evento.' : undefined,
      contenido: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" data-opcion aria-pressed={valor?.tiene === true} onClick={() => responder(true)} className={opcionClass(valor?.tiene === true)}>
              Sí {valor?.tiene === true && <Check size={18} aria-hidden />}
            </button>
            <button type="button" data-opcion aria-pressed={valor?.tiene === false} onClick={() => responder(false)} className={opcionClass(valor?.tiene === false)}>
              No {valor?.tiene === false && <Check size={18} aria-hidden />}
            </button>
          </div>
          {valor?.tiene && (
            <div className="pt-2 duration-300 ease-out animate-in fade-in-0 slide-in-from-top-2 motion-reduce:animate-none">
              <label htmlFor={`${uid}-${key}-detalle`} className={LABEL_CLASS}>{item.detalle}</label>
              <textarea
                id={`${uid}-${key}-detalle`}
                className={`${INPUT_CLASS} resize-y`}
                rows={3}
                maxLength={500}
                value={valor.detalle}
                onChange={(e) => setCondiciones((prev) => ({ ...prev, [key]: { tiene: true, detalle: e.target.value } }))}
                required
              />
            </div>
          )}
        </div>
      ),
      validar: () => (valor === null ? 'Elegí Sí o No para seguir.' : valor.tiene && !valor.detalle.trim() ? 'Contanos el detalle.' : null),
    };
  };

  const pasos: Paso[] = [
    {
      id: 'nombre',
      titulo: esTitular ? '¿Cómo te llamás?' : '¿Cómo se llama?',
      ayuda: esTitular ? 'Empezamos por vos: sos quien responde por esta cuenta.' : 'Como figura en su documento.',
      contenido: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-nombre`} className={LABEL_CLASS}>Nombre</label>
            <input id={`${uid}-nombre`} className={INPUT_CLASS} value={datos.nombre} onChange={set('nombre')} autoComplete="off" maxLength={80} required />
          </div>
          <div>
            <label htmlFor={`${uid}-apellido`} className={LABEL_CLASS}>Apellido</label>
            <input id={`${uid}-apellido`} className={INPUT_CLASS} value={datos.apellido} onChange={set('apellido')} autoComplete="off" maxLength={80} required />
          </div>
        </div>
      ),
      validar: () => (datos.nombre.trim() && datos.apellido.trim() ? null : 'Completá el nombre y el apellido.'),
    },
  ];

  if (esTitular) {
    pasos.push(
      {
        id: 'telefono',
        titulo: '¿A qué teléfono te llamamos?',
        ayuda: 'Es al que llamamos si pasa algo con los chicos que inscribas.',
        contenido: (
          <div className="sm:max-w-xs">
            <label htmlFor={`${uid}-telefono`} className={LABEL_CLASS}>Teléfono</label>
            <input id={`${uid}-telefono`} type="tel" className={INPUT_CLASS} value={datos.telefono} onChange={set('telefono')} autoComplete="off" maxLength={25} required />
          </div>
        ),
        validar: () => (/^[0-9+()\s-]{6,25}$/.test(datos.telefono.trim()) ? null : 'El teléfono no parece válido.'),
      },
      {
        id: 'participa',
        titulo: '¿Vos también vas a participar de los eventos?',
        ayuda: 'Si solo inscribís a chicos a tu cargo, con tu nombre y teléfono alcanza.',
        contenido: (
          <div className="grid gap-3">
            <button type="button" data-opcion aria-pressed={participa === false} onClick={() => { setParticipa(false); avanzarSolo(); }} className={opcionClass(participa === false)}>
              No, solo inscribo a chicos a mi cargo {participa === false && <Check size={18} aria-hidden />}
            </button>
            <button type="button" data-opcion aria-pressed={participa === true} onClick={() => { setParticipa(true); avanzarSolo(); }} className={opcionClass(participa === true)}>
              Sí, yo también voy {participa === true && <Check size={18} aria-hidden />}
            </button>
          </div>
        ),
        validar: () => (participa === null ? 'Elegí una opción para seguir.' : null),
      },
    );
  } else {
    pasos.push({
      id: 'vinculo',
      titulo: `¿Qué es tuyo/a ${quien}?`,
      contenido: (
        <div className="grid gap-3 sm:grid-cols-2">
          {VINCULOS.map((vinculo) => (
            <button key={vinculo} type="button" data-opcion aria-pressed={datos.vinculo === vinculo} onClick={() => { setDatos((prev) => ({ ...prev, vinculo })); avanzarSolo(); }} className={opcionClass(datos.vinculo === vinculo)}>
              {vinculo} {datos.vinculo === vinculo && <Check size={18} aria-hidden />}
            </button>
          ))}
        </div>
      ),
      validar: () => (datos.vinculo ? null : 'Elegí una opción para seguir.'),
    });
  }

  if (completo) {
    pasos.push(
      {
        id: 'nacimiento',
        titulo: esTitular ? '¿Cuándo naciste?' : `¿Cuándo nació ${quien}?`,
        ayuda: 'La edad se calcula sola para cada evento.',
        contenido: (
          <div className="sm:max-w-xs">
            <label htmlFor={`${uid}-nacimiento`} className={LABEL_CLASS}>Fecha de nacimiento</label>
            <input id={`${uid}-nacimiento`} type="date" className={INPUT_CLASS} value={datos.fechaNacimiento} onChange={set('fechaNacimiento')} max={hoy} required />
            {edad !== null && edad >= 0 && <p className={HELP_CLASS}>{edad === 1 ? '1 año' : `${edad} años`}</p>}
          </div>
        ),
        validar: () => {
          if (edad === null) return 'Completá la fecha de nacimiento.';
          if (datos.fechaNacimiento > hoy) return 'La fecha de nacimiento no puede ser futura.';
          if (esTitular && edad < EDAD_MINIMA_TITULAR) return `Para tener tu propia cuenta tenés que tener ${EDAD_MINIMA_TITULAR} años o más. Si sos más chico, te tiene que inscribir un adulto.`;
          return null;
        },
      },
      {
        id: 'sexo',
        titulo: 'Sexo',
        ayuda: 'Se usa para organizar habitaciones o carpas.',
        contenido: (
          <div className="grid gap-3 sm:grid-cols-3">
            {SEXOS.map((sexo) => (
              <button key={sexo.value} type="button" data-opcion aria-pressed={datos.sexo === sexo.value} onClick={() => { setDatos((prev) => ({ ...prev, sexo: sexo.value })); avanzarSolo(); }} className={opcionClass(datos.sexo === sexo.value)}>
                {sexo.label} {datos.sexo === sexo.value && <Check size={18} aria-hidden />}
              </button>
            ))}
          </div>
        ),
        validar: () => (datos.sexo ? null : 'Elegí una opción para seguir.'),
      },
      {
        id: 'cuil',
        titulo: esTitular ? '¿Cuál es tu CUIL?' : `¿Cuál es el CUIL de ${quien}?`,
        ayuda: persona?.cuilFinal ? 'Ya está cargado. Dejalo vacío si no cambió.' : 'Son los 11 números, con o sin guiones. Está en el DNI y se guarda cifrado.',
        contenido: (
          <div className="sm:max-w-xs">
            <label htmlFor={`${uid}-cuil`} className={LABEL_CLASS}>CUIL</label>
            <input
              id={`${uid}-cuil`}
              className={INPUT_CLASS}
              value={datos.cuil}
              onChange={set('cuil')}
              inputMode="numeric"
              autoComplete="off"
              maxLength={13}
              placeholder={persona?.cuilFinal ? `Cargado (termina en ${persona.cuilFinal})` : '11 números'}
              required={!persona?.cuilFinal}
            />
          </div>
        ),
        validar: () => {
          if (!datos.cuil.trim()) return persona?.cuilFinal ? null : 'Completá el CUIL.';
          return cuilValido(datos.cuil) ? null : 'El CUIL no es válido. Revisá los 11 números.';
        },
      },
      {
        id: 'iam',
        titulo: esTitular ? '¿De qué IAM sos y dónde vivís?' : `¿De qué IAM es ${quien} y dónde vive?`,
        contenido: (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-grupo`} className={LABEL_CLASS}>IAM</label>
              <select id={`${uid}-grupo`} className={INPUT_CLASS} value={esAdulto || datos.grupoId !== SIN_IAM ? datos.grupoId : ''} onChange={elegirGrupo} required>
                <option value="" disabled>Elegí de la lista</option>
                {esAdulto && <option value={SIN_IAM}>No pertenezco a una IAM</option>}
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>{grupo.nombre}{grupo.ciudad ? ` (${grupo.ciudad})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-ciudad`} className={LABEL_CLASS}>Ciudad donde vive</label>
              <select
                id={`${uid}-ciudad`}
                className={INPUT_CLASS}
                value={otraCiudad ? OTRA_CIUDAD : datos.ciudad}
                onChange={(e) => {
                  const otra = e.target.value === OTRA_CIUDAD;
                  setOtraCiudad(otra);
                  setDatos((prev) => ({ ...prev, ciudad: otra ? '' : e.target.value }));
                }}
                required
              >
                <option value="" disabled>Elegí de la lista</option>
                {ciudades.map((ciudad) => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
                <option value={OTRA_CIUDAD}>Otra ciudad</option>
              </select>
              {otraCiudad && (
                <input className={`${INPUT_CLASS} mt-2`} value={datos.ciudad} onChange={set('ciudad')} autoComplete="off" maxLength={80} placeholder="Escribí la ciudad" aria-label="Nombre de la ciudad" required />
              )}
            </div>
          </div>
        ),
        validar: () => {
          if (!datos.grupoId || (esMenor && datos.grupoId === SIN_IAM)) return 'Elegí la IAM de la lista.';
          return datos.ciudad.trim() ? null : 'Elegí la ciudad.';
        },
      },
    );

    pasos.push(
      pasoCondicion('enfermedad'),
      pasoCondicion('medicacion'),
      pasoCondicion('alergias'),
      pasoCondicion('dieta'),
      {
        id: 'sangre',
        titulo: esTitular ? '¿Sabés tu grupo sanguíneo?' : `¿Sabés el grupo sanguíneo de ${quien}?`,
        ayuda: 'Es opcional. Si no lo sabés, seguí de largo.',
        contenido: (
          <div className="sm:max-w-xs">
            <label htmlFor={`${uid}-sangre`} className={LABEL_CLASS}>Grupo sanguíneo</label>
            <input id={`${uid}-sangre`} className={INPUT_CLASS} value={grupoSanguineo} onChange={(e) => setGrupoSanguineo(e.target.value)} maxLength={20} placeholder="Ej.: 0+" />
          </div>
        ),
        validar: () => null,
      },
    );
  }

  if (pedirConsentimiento) {
    pasos.push({
      id: 'consentimiento',
      titulo: 'Último paso: tu consentimiento',
      contenido: (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-cream p-4">
          <input
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-stone-400 accent-brand-brown"
          />
          <span className="text-sm leading-relaxed text-brand-ink/85">
            Tengo 17 años o más y doy mi consentimiento para que IAM Paraná guarde estos datos, y los de los menores a mi cargo que cargue en esta cuenta, con el único fin de organizar la inscripción y el cuidado de las personas en sus eventos, como explica la{' '}
            <a href="/privacidad" target="_blank" rel="noopener" className="font-bold text-brand-brown underline">política de privacidad</a>.
          </span>
        </label>
      ),
      validar: () => (consentimiento ? null : 'Para guardar los datos necesitamos tu consentimiento.'),
    });
  }

  // ── Navegación ─────────────────────────────────────────────────────────

  const actual = Math.min(indice, pasos.length - 1);
  const paso = pasos[actual];
  const esUltimo = actual === pasos.length - 1;

  // Los avances automáticos corren después de que el estado ya se actualizó: necesitan la cantidad de pasos del momento.
  const totalRef = useRef(pasos.length);
  const avanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { totalRef.current = pasos.length; });
  useEffect(() => () => { if (avanceRef.current) clearTimeout(avanceRef.current); }, []);

  const ir = (destino: number) => {
    setError('');
    setSentido(destino >= actual ? 'adelante' : 'atras');
    setIndice(destino);
  };

  /** Tras elegir una opción, pasa a la pregunta siguiente con una pausa corta para que se vea lo elegido. */
  function avanzarSolo() {
    setError('');
    if (avanceRef.current) clearTimeout(avanceRef.current);
    avanceRef.current = setTimeout(() => {
      setSentido('adelante');
      setIndice((prev) => Math.min(prev + 1, totalRef.current - 1));
    }, 220);
  }

  // Al cambiar de paso, el foco va a su primer campo (no al cargar la página, para no robar el foco).
  const contenedorRef = useRef<HTMLDivElement>(null);
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    // En las preguntas de opciones el foco va al título: si fuera a un botón, un Enter de más elegiría esa opción sin querer.
    const campo = contenedorRef.current?.querySelector<HTMLElement>('input:not([type="checkbox"]), select, textarea') ?? contenedorRef.current?.querySelector<HTMLElement>('h3');
    campo?.focus({ preventScroll: true });
    contenedorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [actual]);

  const guardar = async () => {
    // Antes de enviar se revisan todos los pasos: al editar se puede guardar desde cualquiera.
    for (const [i, item] of pasos.entries()) {
      const problema = item.validar();
      if (problema) {
        ir(i);
        setError(problema);
        return;
      }
    }

    setBusy(true);
    setError('');
    const result = await postJson('/api/inscripciones/personas', !completo ? {
      ...(persona ? { id: persona.id } : {}),
      soloContacto: true,
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
      consentimiento,
    } : {
      ...(persona ? { id: persona.id } : {}),
      ...datos,
      // El teléfono se pide solo a quien responde por la cuenta: es a quien se llama.
      telefono: esTitular ? datos.telefono : '',
      grupoId: datos.grupoId === SIN_IAM ? '' : datos.grupoId,
      vinculo: esTitular ? '' : datos.vinculo,
      salud: { grupoSanguineo, ...condiciones },
      consentimiento,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problema = paso.validar();
    if (problema) {
      setError(problema);
      return;
    }
    if (esUltimo) void guardar();
    else ir(actual + 1);
  };

  return (
    <form onSubmit={submit}>
      {/* ── Avance ── */}
      <div className="mb-6">
        <div className="flex gap-1.5" role="presentation">
          {pasos.map((item, i) => {
            const estado = i < actual ? 'bg-brand-brown' : i === actual ? 'bg-brand-gold' : 'bg-stone-200';
            const barra = `h-1.5 w-full rounded-full transition-colors duration-300 motion-reduce:transition-none ${estado}`;
            // Al editar, todo ya está cargado: se puede saltar directo a cualquier pregunta.
            return persona ? (
              <button key={item.id} type="button" onClick={() => ir(i)} aria-label={`Ir a: ${item.titulo}`} aria-current={i === actual ? 'step' : undefined} className="-my-2 flex-1 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
                <span className={`block ${barra}`} />
              </button>
            ) : (
              <span key={item.id} className={`flex-1 ${barra}`} />
            );
          })}
        </div>
        <p className="m-0 mt-2 max-w-none text-left text-xs font-bold uppercase tracking-wide text-brand-ink/55">Paso {actual + 1} de {pasos.length}</p>
      </div>

      {/* ── Pregunta ── */}
      <div
        key={paso.id}
        ref={contenedorRef}
        className={`min-h-[14rem] scroll-mt-28 duration-300 ease-out animate-in fade-in-0 motion-reduce:animate-none ${sentido === 'adelante' ? 'slide-in-from-right-6' : 'slide-in-from-left-6'}`}
      >
        <h3 tabIndex={-1} className="m-0 text-balance outline-none text-left font-display text-2xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-[1.75rem]">{paso.titulo}</h3>
        {paso.ayuda && <p className={`${HELP_CLASS} mt-2`}>{paso.ayuda}</p>}
        <div className="mt-6">{paso.contenido}</div>
      </div>

      {error && <p role="alert" className={`${ERROR_CLASS} mt-5`}>{error}</p>}

      {/* ── Botones ── */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
          {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {busy ? 'Guardando...' : esUltimo ? 'Guardar' : 'Siguiente'}
          {!busy && !esUltimo && <ArrowRight size={18} aria-hidden />}
        </button>
        {actual > 0 && (
          <button type="button" disabled={busy} onClick={() => ir(actual - 1)} className={SECONDARY_BUTTON}>
            <ArrowLeft size={16} aria-hidden />
            Atrás
          </button>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-4">
          {persona && !esUltimo && (
            <button type="button" disabled={busy} onClick={() => void guardar()} className={TEXT_BUTTON}>Guardar cambios</button>
          )}
          {onCancel && <button type="button" disabled={busy} onClick={onCancel} className={TEXT_BUTTON}>Cancelar</button>}
        </span>
      </div>
      {!esUltimo && <p className={`${HELP_CLASS} mt-3 hidden sm:block`}>También podés seguir con la tecla Enter.</p>}
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Pencil, UserPlus } from 'lucide-react';
import type { GrupoIam, PersonaView } from '@/server/db/inscripciones-repository';
import { PersonaAvatar, colorPersona } from './persona-avatar';
import { PersonaForm } from './persona-form';
import { CARD_CLASS, ageOn, localTodayYmd } from './ui';

// Personas de la cuenta familiar: el adulto titular y quienes tiene a cargo.
// Cada una se muestra con su color y su inicial, los mismos en todas las pantallas.

interface FamiliaProps {
  personas: PersonaView[];
  grupos: GrupoIam[];
  tieneConsentimiento: boolean;
  /**
   * Versión resumida para la página de un evento: muestra quiénes están en la cuenta en una
   * sola fila y deja la edición detrás de un botón, para no tapar la inscripción.
   */
  compacta?: boolean;
}

const BOTON_AGREGAR =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand-brown px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-50';
const BOTON_EDITAR =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-brown/20 bg-white px-3.5 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-50';

export function Familia({ personas, grupos, tieneConsentimiento, compacta = false }: FamiliaProps) {
  const router = useRouter();
  // 'nueva' abre el alta; un id abre la edición de esa persona.
  const [editing, setEditing] = useState<string | null>(personas.length === 0 ? 'nueva' : null);
  const [abierta, setAbierta] = useState(false);

  const onSaved = () => {
    setEditing(null);
    // Los datos se vuelven a pedir al servidor, que es quien decide qué puede ver esta cuenta.
    router.refresh();
  };

  if (grupos.length === 0) {
    return (
      <p className="m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-8 text-center text-base text-brand-ink/70">
        Todavía no se puede cargar personas: falta que el equipo de IAM cargue la lista de grupos. Probá más tarde.
      </p>
    );
  }

  if (personas.length === 0) {
    return (
      <section className={`${CARD_CLASS} p-6 sm:p-8`}>
        <p className="m-0 mb-8 max-w-none text-left text-base leading-relaxed text-brand-ink/75">
          Empezá por tus datos: sos el adulto responsable de esta cuenta. Después vas a poder sumar a los chicos a tu cargo.
        </p>
        <PersonaForm grupos={grupos} esTitular pedirConsentimiento={!tieneConsentimiento} onSaved={onSaved} />
      </section>
    );
  }

  const today = localTodayYmd();
  // Un adulto invitado ve a los chicos compartidos antes de haber cargado sus propios datos.
  const faltaTitular = !personas.some((persona) => persona.esTitular);
  const detalleVisible = !compacta || abierta || faltaTitular || editing !== null;

  return (
    <div className="space-y-3">
      {compacta && (
        <div className="rounded-[22px] bg-white p-4 ring-1 ring-brand-brown/10 sm:p-5">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {personas.map((persona, indice) => (
              <li key={persona.id} className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5" style={{ backgroundColor: `${colorPersona(indice).fondo}1f` }}>
                <PersonaAvatar nombre={persona.nombre} indice={indice} size="sm" />
                <span className="text-sm font-bold text-brand-ink">{persona.nombre}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setAbierta(true); setEditing('nueva'); }} disabled={editing !== null || faltaTitular} className={BOTON_AGREGAR}>
              <UserPlus size={17} aria-hidden />
              Agregar a alguien
            </button>
            <button type="button" aria-expanded={detalleVisible} onClick={() => setAbierta((valor) => !valor)} disabled={editing !== null || faltaTitular} className={BOTON_EDITAR}>
              <Pencil size={14} aria-hidden />
              {detalleVisible ? 'Ocultar los datos' : 'Ver o corregir los datos'}
              <ChevronDown size={15} aria-hidden className={`transition-transform duration-200 motion-reduce:transition-none ${detalleVisible ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {faltaTitular && (
        <section className={`${CARD_CLASS} p-6 sm:p-8`}>
          <p className="m-0 mb-8 max-w-none text-left text-base leading-relaxed text-brand-ink/75">
            Te sumaron como adulto responsable. Antes de inscribir a alguien, cargá tus datos.
          </p>
          <PersonaForm grupos={grupos} esTitular pedirConsentimiento={!tieneConsentimiento} onSaved={onSaved} />
        </section>
      )}

      {detalleVisible && personas.map((persona, indice) => (
        <section key={persona.id} className="overflow-hidden rounded-[22px] bg-white ring-1 ring-brand-brown/10">
          {/* Franja con el color de la persona: el mismo que tiene en el resto de la inscripción. */}
          <div aria-hidden className="h-2" style={{ backgroundColor: colorPersona(indice).fondo }} />
          <div className="p-4 sm:p-5">
            {editing === persona.id ? (
              <PersonaForm
                persona={persona}
                grupos={grupos}
                esTitular={persona.esTitular}
                pedirConsentimiento={!tieneConsentimiento}
                onSaved={onSaved}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex items-center gap-3.5">
                <PersonaAvatar nombre={persona.nombre} indice={indice} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-left font-display text-xl font-extrabold leading-tight text-brand-ink">
                    {persona.nombre} {persona.apellido}
                  </h3>
                  <p className="m-0 mt-1.5 flex max-w-none flex-wrap items-center gap-1.5 text-left text-sm text-brand-ink/75">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${persona.esTitular ? 'bg-brand-brown text-white' : 'bg-brand-cream text-brand-brown'}`}>
                      {persona.esTitular ? 'Adulto responsable' : persona.vinculo || 'A tu cargo'}
                    </span>
                    {persona.fechaNacimiento && <span>{ageOn(persona.fechaNacimiento, today)} años</span>}
                    {persona.grupoNombre && <span>· {persona.grupoNombre}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing(persona.id)} disabled={editing !== null} aria-label={`Editar los datos de ${persona.nombre}`} className={BOTON_EDITAR}>
                  <Pencil size={14} aria-hidden />
                  <span className="hidden sm:inline">Editar</span>
                </button>
              </div>
            )}
          </div>
        </section>
      ))}

      {editing === 'nueva' ? (
        <section className={`${CARD_CLASS} p-6 sm:p-8`}>
          <PersonaForm
            grupos={grupos}
            esTitular={false}
            pedirConsentimiento={!tieneConsentimiento}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        </section>
      ) : (
        !compacta && (
          <button type="button" onClick={() => setEditing('nueva')} disabled={editing !== null || faltaTitular} className={BOTON_AGREGAR}>
            <UserPlus size={17} aria-hidden />
            Agregar a alguien a mi cargo
          </button>
        )
      )}
    </div>
  );
}

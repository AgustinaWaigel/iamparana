'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, UserPlus } from 'lucide-react';
import type { GrupoIam, PersonaView } from '@/server/db/inscripciones-repository';
import { PersonaForm } from './persona-form';
import { CARD_CLASS, SECONDARY_BUTTON, TEXT_BUTTON, ageOn, localTodayYmd } from './ui';

// Personas de la cuenta familiar: el adulto titular y quienes tiene a cargo.

interface FamiliaProps {
  personas: PersonaView[];
  grupos: GrupoIam[];
  tieneConsentimiento: boolean;
}

export function Familia({ personas, grupos, tieneConsentimiento }: FamiliaProps) {
  const router = useRouter();
  // 'nueva' abre el alta; un id abre la edición de esa persona.
  const [editing, setEditing] = useState<string | null>(personas.length === 0 ? 'nueva' : null);

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

  return (
    <div className="space-y-4">
      {faltaTitular && (
        <section className={`${CARD_CLASS} p-6 sm:p-8`}>
          <p className="m-0 mb-8 max-w-none text-left text-base leading-relaxed text-brand-ink/75">
            Te sumaron como adulto responsable. Antes de inscribir a alguien, cargá tus datos.
          </p>
          <PersonaForm grupos={grupos} esTitular pedirConsentimiento={!tieneConsentimiento} onSaved={onSaved} />
        </section>
      )}
      {personas.map((persona) => (
        <section key={persona.id} className={`${CARD_CLASS} p-5 sm:p-6`}>
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="m-0 text-left font-display text-lg font-bold leading-snug text-brand-ink">
                  {persona.nombre} {persona.apellido}
                </h3>
                <p className="m-0 mt-1 max-w-none text-left text-sm text-brand-ink/65">
                  {[
                    persona.esTitular ? 'Adulto responsable' : persona.vinculo,
                    persona.fechaNacimiento ? `${ageOn(persona.fechaNacimiento, today)} años` : null,
                    persona.grupoNombre,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button type="button" onClick={() => setEditing(persona.id)} disabled={editing !== null} className={TEXT_BUTTON}>
                <Pencil size={14} aria-hidden />
                Editar datos
              </button>
            </div>
          )}
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
        <button type="button" onClick={() => setEditing('nueva')} disabled={editing !== null || faltaTitular} className={SECONDARY_BUTTON}>
          <UserPlus size={16} aria-hidden />
          Agregar a alguien a mi cargo
        </button>
      )}
    </div>
  );
}

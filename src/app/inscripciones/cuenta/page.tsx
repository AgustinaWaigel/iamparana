import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { listAdultosConAcceso } from '@/server/db/cuentas-repository';
import { listGrupos, listInscripcionesConFirmas, listPersonasDeCuenta } from '@/server/db/inscripciones-repository';
import { getSessionUser } from '@/server/lib/api-utils';
import { getCuentaSesion } from '@/server/lib/cuenta-session';
import { getEventosPorId } from '@/server/lib/inscripciones-eventos';
import { Familia } from '../familia';
import { CARD_CLASS, SECONDARY_BUTTON } from '../ui';
import { CuentaAcceso, CuentaSalir } from './cuenta-acceso';
import { CuentaAjustes } from './cuenta-ajustes';
import { MisInscripciones } from './mis-inscripciones';

// Cuenta familiar de inscripciones. La sesión se resuelve en el servidor:
// el navegador solo recibe lo que esta cuenta puede ver.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi cuenta familiar',
  description: 'Entrá con tu email para inscribir a tu familia en los eventos de IAM Paraná.',
  robots: { index: false, follow: false },
};

export default async function CuentaFamiliarPage() {
  const cuenta = await getCuentaSesion();
  const [personas, grupos, adultos, inscripciones] = cuenta
    ? await Promise.all([
        listPersonasDeCuenta(cuenta.cuentaId),
        listGrupos(true),
        listAdultosConAcceso(cuenta.cuentaId),
        listInscripcionesConFirmas(cuenta.cuentaId),
      ])
    : [[], [], [], []];
  // Si la agenda no responde, las inscripciones se muestran igual, sin el nombre del evento.
  const eventos = await getEventosPorId([...new Set(inscripciones.map((item) => item.eventoId))]).catch(() => new Map());
  // Usuario del sitio que todavía no unió su cuenta: confirma su email una sola vez.
  const usuario = cuenta ? null : await getSessionUser();

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className={`mx-auto px-4 pb-20 pt-16 sm:px-6 sm:pt-20 ${cuenta ? 'max-w-3xl' : 'max-w-xl'}`}>
        <h1 className="m-0 text-balance text-left font-display text-[clamp(2rem,7vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-ink">
          Mi cuenta familiar
        </h1>

        {cuenta ? (
          <>
            <div className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 max-w-none text-left text-base text-brand-ink/75">
                Entraste como <strong className="break-all font-bold text-brand-ink">{cuenta.email}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/inscripciones" className={SECONDARY_BUTTON}>Ver eventos</Link>
                {cuenta.via === 'codigo' && <CuentaSalir />}
              </div>
            </div>

            <Familia personas={personas} grupos={grupos} tieneConsentimiento={Boolean(cuenta.consentimientoAt)} />

            {(inscripciones.length > 0 || personas.some((persona) => persona.esTitular)) && <MisInscripciones inscripciones={inscripciones} eventos={eventos} orden={personas.map((persona) => persona.id)} />}

            {personas.some((persona) => persona.esTitular) && (
              <CuentaAjustes
                emailActual={cuenta.email}
                adultos={adultos}
                puedeInvitar={personas.some((persona) => !persona.esTitular)}
              />
            )}
          </>
        ) : (
          <>
            <p className="m-0 mt-4 max-w-none text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">
              Entrá con tu email para inscribirte vos o inscribir a los chicos a tu cargo en los eventos de IAM Paraná.
            </p>

            <section className={`${CARD_CLASS} mt-8 p-6 sm:p-8`}>
              <CuentaAcceso emailUsuario={usuario?.email} />
            </section>

            <p className="m-0 mt-6 flex max-w-none items-start gap-2.5 text-left text-sm leading-relaxed text-brand-ink/65">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-brown" aria-hidden />
              Cada cuenta ve solo sus propios datos. Nadie de IAM te va a pedir el código que te llega por email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

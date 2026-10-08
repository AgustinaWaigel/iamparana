'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { AdultoConAcceso } from '@/server/db/cuentas-repository';
import { CARD_CLASS, ERROR_CLASS, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, NOTICE_CLASS, PRIMARY_BUTTON, TEXT_BUTTON, postJson } from '../ui';

// Ajustes de acceso de la cuenta familiar: cambiar el email y sumar a otro adulto.
// Son las dos salidas para que nadie quede afuera si pierde o cambia su email.

function Spinner() {
  return <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />;
}

function CambiarEmail({ emailActual }: { emailActual: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await postJson('/api/inscripciones/cuenta/email', step === 'email' ? { paso: 'pedir', email } : { paso: 'confirmar', email, codigo });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (step === 'email') {
      setStep('codigo');
      return;
    }
    setDone(true);
    setOpen(false);
    setStep('email');
    setEmail('');
    setCodigo('');
    router.refresh();
  };

  return (
    <div>
      <h3 className="m-0 text-left font-display text-lg font-bold text-brand-ink">Email de acceso</h3>
      <p className={HELP_CLASS}>
        Entrás con <strong className="break-all font-bold text-brand-ink">{emailActual}</strong>. Si vas a dejar de usarlo, cambialo antes de perder el acceso.
      </p>
      {done && <p role="status" className={`${NOTICE_CLASS} mt-3`}>Listo: desde ahora entrás con el email nuevo.</p>}

      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setDone(false); }} className={`${TEXT_BUTTON} mt-3`}>Cambiar email</button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          {step === 'email' ? (
            <div>
              <label htmlFor="nuevo-email" className={LABEL_CLASS}>Email nuevo</label>
              <input id="nuevo-email" type="email" inputMode="email" autoComplete="email" className={INPUT_CLASS} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <p className={HELP_CLASS}>Te mandamos un código a ese email para confirmar que es tuyo.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="nuevo-email-codigo" className={LABEL_CLASS}>Código que llegó a {email}</label>
              <input
                id="nuevo-email-codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={`${INPUT_CLASS} text-center font-display text-2xl font-bold tracking-[0.4em] tabular-nums`}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
          )}
          {error && <p role="alert" className={ERROR_CLASS}>{error}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={busy || (step === 'email' ? !email.trim() : codigo.length !== 6)} className={PRIMARY_BUTTON}>
              {busy && <Spinner />}
              {step === 'email' ? 'Enviarme el código' : 'Confirmar cambio'}
            </button>
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setStep('email'); setError(''); }} className={TEXT_BUTTON}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

function OtrosAdultos({ adultos, puedeInvitar }: { adultos: AdultoConAcceso[]; puedeInvitar: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const quitar = async (quien: string) => {
    setBusy(true);
    setError('');
    setSent('');
    const result = await postJson('/api/inscripciones/cuenta/quitar-adulto', { email: quien });
    setBusy(false);
    setConfirmar(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSent('');
    const result = await postJson('/api/inscripciones/cuenta/invitar', { email });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(email);
    setEmail('');
    router.refresh();
  };

  return (
    <div>
      <h3 className="m-0 text-left font-display text-lg font-bold text-brand-ink">Otro adulto responsable</h3>
      <p className={HELP_CLASS}>
        Sumá al otro papá, mamá o a un familiar para que también pueda ver e inscribir a los chicos a tu cargo. Entra con su propio email; si uno pierde el acceso, el otro sigue.
      </p>

      {adultos.length > 0 && (
        <ul className="m-0 mt-4 list-none space-y-2 p-0">
          {adultos.map((adulto) => (
            <li key={adulto.email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-brand-cream px-4 py-2.5">
              <span className="min-w-0">
                <span className="block break-all text-sm font-bold text-brand-ink">{adulto.email}</span>
                <span className="block text-sm text-brand-ink/70">{adulto.estado === 'activo' ? 'Tiene acceso' : 'Invitado, todavía no entró'}</span>
              </span>
              {adulto.puedeQuitar && (
                confirmar === adulto.email ? (
                  <span className="flex flex-wrap items-center gap-3 text-sm text-brand-ink">
                    ¿Quitarle el acceso?
                    <button type="button" disabled={busy} onClick={() => quitar(adulto.email)} className={`${TEXT_BUTTON} text-red-800`}>Sí, quitar</button>
                    <button type="button" disabled={busy} onClick={() => setConfirmar(null)} className={TEXT_BUTTON}>No</button>
                  </span>
                ) : (
                  <button type="button" disabled={busy} onClick={() => setConfirmar(adulto.email)} className={`${TEXT_BUTTON} text-red-800`}>Quitar acceso</button>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {puedeInvitar ? (
        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <div>
            <label htmlFor="invitar-email" className={LABEL_CLASS}>Email del otro adulto</label>
            <input id="invitar-email" type="email" inputMode="email" autoComplete="off" className={INPUT_CLASS} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p role="alert" className={ERROR_CLASS}>{error}</p>}
          {sent && <p role="status" className={NOTICE_CLASS}>Listo. Cuando {sent} entre con su email, va a ver a los chicos a tu cargo.</p>}
          <button type="submit" disabled={busy || !email.trim()} className={PRIMARY_BUTTON}>
            {busy && <Spinner />}
            Sumar adulto
          </button>
        </form>
      ) : (
        <p className={`${HELP_CLASS} mt-3`}>Vas a poder sumar a otro adulto cuando cargues a alguien a tu cargo.</p>
      )}
    </div>
  );
}

export function CuentaAjustes({ emailActual, adultos, puedeInvitar }: { emailActual: string; adultos: AdultoConAcceso[]; puedeInvitar: boolean }) {
  return (
    <section aria-labelledby="ajustes-acceso" className="mt-12">
      <h2 id="ajustes-acceso" className="m-0 mb-5 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">Acceso a la cuenta</h2>
      <div className={`${CARD_CLASS} divide-y divide-brand-brown/10`}>
        <div className="p-5 sm:p-6"><CambiarEmail emailActual={emailActual} /></div>
        <div className="p-5 sm:p-6"><OtrosAdultos adultos={adultos} puedeInvitar={puedeInvitar} /></div>
      </div>
    </section>
  );
}

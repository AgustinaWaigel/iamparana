'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CARD_CLASS, ERROR_CLASS, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, NOTICE_CLASS, SECONDARY_BUTTON, postJson } from './ui';

// Quien todavía es menor y se inscribió solo no puede firmar su autorización:
// acá ve a qué adulto se le pidió la firma y puede pedírsela a otro.

interface AdultoFirmaProps {
  eventoId: string;
  /** Emails de los adultos a los que ya se les pidió la firma. */
  adultos: string[];
}

export function AdultoFirma({ eventoId, adultos }: AdultoFirmaProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setEnviado('');
    if (email.trim().toLowerCase() !== email2.trim().toLowerCase()) {
      setError('Los dos emails no coinciden. Revisalos.');
      return;
    }
    setBusy(true);
    const result = await postJson('/api/inscripciones/firma-adulto', { eventoId, email });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEnviado(email.trim());
    setEmail('');
    setEmail2('');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className={`${CARD_CLASS} space-y-5 p-6 sm:p-8`}>
      <p className="m-0 max-w-none text-left text-base leading-relaxed text-brand-ink">
        Como todavía sos menor de edad, tu autorización la tiene que firmar un adulto responsable, entrando con su propio email.
        {adultos.length > 0 && <> Ya le avisamos a: <strong className="break-all font-bold">{adultos.join(', ')}</strong>.</>}
      </p>

      <div>
        <p className="m-0 mb-3 max-w-none text-left font-display text-lg font-bold text-brand-ink">
          {adultos.length > 0 ? 'Pedirle la firma a otro adulto' : '¿Quién va a firmar?'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="adulto-email" className={LABEL_CLASS}>Email del adulto</label>
            <input id="adulto-email" type="email" className={INPUT_CLASS} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="off" required />
          </div>
          <div>
            <label htmlFor="adulto-email-2" className={LABEL_CLASS}>Repetí el email</label>
            <input id="adulto-email-2" type="email" className={INPUT_CLASS} value={email2} onChange={(e) => setEmail2(e.target.value)} maxLength={254} autoComplete="off" required />
          </div>
        </div>
        <p className={HELP_CLASS}>Escribilo con cuidado: esa persona va a poder ver tus datos de inscripción.</p>
      </div>

      {error && <p role="alert" className={ERROR_CLASS}>{error}</p>}
      {enviado && <p role="status" className={NOTICE_CLASS}>Listo, le escribimos a {enviado} para que entre y firme.</p>}

      <button type="submit" disabled={busy} className={SECONDARY_BUTTON}>
        {busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {busy ? 'Enviando...' : 'Avisarle'}
      </button>
    </form>
  );
}

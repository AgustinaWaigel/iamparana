'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { TEXT_BUTTON, postJson } from './ui';

// Dar de baja una inscripción. Pide confirmar y, si la inscripción ya cerró,
// avisa antes que la baja no exime del pago.

interface BajaBotonProps {
  eventoId: string;
  personaId: string;
  nombre: string;
  /** true si la fecha de cierre de la inscripción ya pasó. */
  fueraDeTermino: boolean;
}

export function BajaBoton({ eventoId, personaId, nombre, fueraDeTermino }: BajaBotonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirmar = async () => {
    setBusy(true);
    setError('');
    const result = await postJson('/api/inscripciones/baja', { eventoId, personaId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  };

  if (!confirming) {
    return <button type="button" onClick={() => setConfirming(true)} className={`${TEXT_BUTTON} text-red-800`}>Dar de baja</button>;
  }

  return (
    <div role="group" aria-label={`Dar de baja a ${nombre}`} className="basis-full rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="m-0 max-w-none text-left text-sm font-bold leading-relaxed text-red-900">¿Dar de baja a {nombre} de este evento?</p>
      {fueraDeTermino && (
        <p className="m-0 mt-1.5 max-w-none text-left text-sm leading-relaxed text-red-900">
          La inscripción ya cerró: si lo das de baja ahora, <strong className="font-bold">igual corresponde pagar</strong>.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" onClick={confirmar} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-red-800 px-4 py-2 text-sm font-bold text-white hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {busy ? 'Dando de baja...' : 'Sí, dar de baja'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={TEXT_BUTTON}>No, dejarlo inscripto</button>
      </div>
      {error && <p role="alert" className="m-0 mt-2 max-w-none text-left text-sm font-medium text-red-900">{error}</p>}
    </div>
  );
}

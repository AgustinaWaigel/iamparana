'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEXT_BUTTON, postJson } from '../ui';

// Botón para retirar el permiso de uso de imagen de una persona. Pide confirmar antes.

export function ImagenRevocar({ personaId, nombre }: { personaId: string; nombre: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const revocar = async () => {
    setBusy(true);
    setError('');
    const result = await postJson('/api/inscripciones/imagen/revocar', { personaId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  };

  if (!confirming) {
    return <button type="button" onClick={() => setConfirming(true)} className={TEXT_BUTTON}>Retirar permiso</button>;
  }

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-ink">
      <span>¿Retirar el permiso de imagen de {nombre}?</span>
      <button type="button" onClick={revocar} disabled={busy} className={TEXT_BUTTON}>{busy ? 'Retirando...' : 'Sí, retirar'}</button>
      <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={TEXT_BUTTON}>Cancelar</button>
      {error && <span role="alert" className="basis-full font-medium text-red-800">{error}</span>}
    </span>
  );
}

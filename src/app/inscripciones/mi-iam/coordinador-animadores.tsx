'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CARD_CLASS, ERROR_CLASS, TEXT_BUTTON, postJson } from '../ui';

// Para quien coordina una IAM: quiénes son sus animadores. Puede aprobar a quien pidió
// el acceso desde su perfil y dar de baja a quien ya no es animador del grupo.

export interface AnimadorDelGrupo {
  userId: number;
  email: string;
  nombre: string | null;
  estado: 'pendiente' | 'aprobado';
  esCoordinador: boolean;
}

export function CoordinadorAnimadores({ grupoId, animadores }: { grupoId: string; animadores: AnimadorDelGrupo[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState<number | null>(null);

  const enviar = async (userId: number, accion: 'aprobar' | 'quitar') => {
    setBusy(true);
    setError('');
    const result = await postJson('/api/inscripciones/mi-iam/animadores', { grupoId, userId, accion });
    setBusy(false);
    setConfirmar(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const pendientes = animadores.filter((animador) => animador.estado === 'pendiente');
  const activos = animadores.filter((animador) => animador.estado === 'aprobado');
  const quien = (animador: AnimadorDelGrupo) => (
    <span className="min-w-0">
      <span className="block break-words text-base font-bold text-brand-ink">{animador.nombre ?? animador.email}</span>
      {animador.nombre && <span className="block break-all text-sm text-brand-ink/65">{animador.email}</span>}
    </span>
  );

  return (
    <div className={`${CARD_CLASS} mt-3 p-5`}>
      <p className="m-0 max-w-none text-left font-display text-lg font-bold text-brand-ink">Animadores de tu IAM</p>
      <p className="m-0 mt-1 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">
        Como coordinás este grupo, decidís quiénes pueden ver esta lista. Aprobá solo a quien sea de verdad animador/a de tu IAM.
      </p>

      {pendientes.length > 0 && (
        <>
          <p className="m-0 mt-4 max-w-none text-left text-sm font-bold uppercase tracking-wide text-amber-800">Pidieron el acceso · {pendientes.length}</p>
          <ul className="m-0 mt-2 list-none divide-y divide-brand-brown/10 p-0">
            {pendientes.map((animador) => (
              <li key={animador.userId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
                {quien(animador)}
                <span className="flex flex-wrap items-center gap-4">
                  <button type="button" disabled={busy} onClick={() => enviar(animador.userId, 'aprobar')} className="rounded-full bg-brand-brown px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-wood disabled:opacity-60">Aprobar</button>
                  <button type="button" disabled={busy} onClick={() => enviar(animador.userId, 'quitar')} className={`${TEXT_BUTTON} text-red-800`}>Rechazar</button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="m-0 mt-4 max-w-none text-left text-sm font-bold uppercase tracking-wide text-brand-brown">Con acceso · {activos.length}</p>
      <ul className="m-0 mt-2 list-none divide-y divide-brand-brown/10 p-0">
        {activos.map((animador) => (
          <li key={animador.userId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
            {quien(animador)}
            {animador.esCoordinador ? (
              <span className="text-sm font-semibold text-brand-ink/65">Coordinador/a</span>
            ) : confirmar === animador.userId ? (
              <span className="flex flex-wrap items-center gap-3 text-sm text-brand-ink">
                ¿Darlo de baja?
                <button type="button" disabled={busy} onClick={() => enviar(animador.userId, 'quitar')} className={`${TEXT_BUTTON} text-red-800`}>Sí</button>
                <button type="button" disabled={busy} onClick={() => setConfirmar(null)} className={TEXT_BUTTON}>No</button>
              </span>
            ) : (
              <button type="button" disabled={busy} onClick={() => setConfirmar(animador.userId)} className={`${TEXT_BUTTON} text-red-800`}>Dar de baja</button>
            )}
          </li>
        ))}
      </ul>

      {error && <p role="alert" className={`${ERROR_CLASS} mt-3`}>{error}</p>}
    </div>
  );
}

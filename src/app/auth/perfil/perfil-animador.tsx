'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Clock, Loader2, UsersRound } from 'lucide-react';
import { CARD_CLASS, ERROR_CLASS, HELP_CLASS, INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_BUTTON } from '@/app/inscripciones/ui';

// En el perfil, cada usuario indica si es animador/a y de qué IAM. Queda como un pedido:
// la lista de inscriptos de esa IAM recién se ve cuando el equipo de IAM lo aprueba.

type Grupo = { id: string; nombre: string; ciudad: string | null };
type Mio = { grupoId: string; nombre: string; ciudad: string | null; estado: 'pendiente' | 'aprobado'; esCoordinador: boolean };

export function PerfilAnimador() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [mios, setMios] = useState<Mio[]>([]);
  const [elegido, setElegido] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const response = await fetch('/api/auth/animador', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo cargar.');
      setGrupos(data.grupos);
      setMios(data.mios);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const enviar = async (method: 'POST' | 'DELETE', grupoId: string) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/animador', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grupoId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar.');
      setElegido('');
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  };

  const pedir = (event: FormEvent) => {
    event.preventDefault();
    if (elegido) void enviar('POST', elegido);
  };

  const disponibles = grupos.filter((grupo) => !mios.some((mio) => mio.grupoId === grupo.id));
  const aprobado = mios.some((mio) => mio.estado === 'aprobado');

  return (
    <section aria-labelledby="perfil-animador" className={`${CARD_CLASS} p-6 sm:p-7`}>
      <h2 id="perfil-animador" className="m-0 text-left font-display text-xl font-bold text-brand-ink">Animador/a de una IAM</h2>
      <p className={`${HELP_CLASS} mt-1`}>
        Si sos animador/a, elegí tu IAM. Cuando quien la coordina o el equipo de IAM Paraná lo confirme, vas a ver quiénes de tu grupo están inscriptos en cada evento.
      </p>

      {loading ? (
        <p className="m-0 mt-5 flex max-w-none items-center gap-2 text-left text-sm text-brand-ink/65"><Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden /> Cargando…</p>
      ) : (
        <>
          {mios.length > 0 && (
            <ul className="m-0 mt-5 list-none divide-y divide-brand-brown/10 rounded-xl border border-brand-brown/15 p-0">
              {mios.map((mio) => (
                <li key={mio.grupoId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-brand-ink">{mio.nombre}{mio.ciudad ? ` (${mio.ciudad})` : ''}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${mio.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                        {mio.estado === 'aprobado' ? <Check size={13} aria-hidden /> : <Clock size={13} aria-hidden />}
                        {mio.estado !== 'aprobado' ? 'Esperando confirmación' : mio.esCoordinador ? 'Coordinador/a' : 'Confirmado'}
                      </span>
                      {mio.estado === 'aprobado' && mio.esCoordinador && <span className="text-xs text-brand-ink/65">Gestionás a los animadores de esta IAM</span>}
                    </span>
                  </span>
                  <button type="button" disabled={busy} onClick={() => enviar('DELETE', mio.grupoId)} className={TEXT_BUTTON}>
                    {mio.estado === 'aprobado' ? 'Ya no soy animador/a acá' : 'Cancelar el pedido'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {aprobado && (
            <Link href="/inscripciones/mi-iam" className={`${SECONDARY_BUTTON} mt-4`}>
              <UsersRound size={16} aria-hidden /> Ver los inscriptos de mi IAM
            </Link>
          )}

          {disponibles.length > 0 && (
            <form onSubmit={pedir} className="mt-5 flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 basis-60">
                <label htmlFor="perfil-iam" className={LABEL_CLASS}>{mios.length > 0 ? 'Sumar otra IAM' : 'Soy animador/a de'}</label>
                <div className="relative">
                  <select id="perfil-iam" value={elegido} onChange={(e) => setElegido(e.target.value)} className={`${INPUT_CLASS} cursor-pointer appearance-none pr-11`} required>
                    <option value="" disabled>Elegí tu IAM</option>
                    {disponibles.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nombre}{grupo.ciudad ? ` (${grupo.ciudad})` : ''}</option>)}
                  </select>
                  <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown" />
                </div>
              </div>
              <button type="submit" disabled={busy || !elegido} className={PRIMARY_BUTTON}>
                {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
                Pedir acceso
              </button>
            </form>
          )}
        </>
      )}

      {error && <p role="alert" className={`${ERROR_CLASS} mt-4`}>{error}</p>}
    </section>
  );
}

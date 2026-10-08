'use client';

import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';

// Acceso a la cuenta familiar: email → código de 6 dígitos. Sin contraseña.

const INPUT_CLASS =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-brand-ink outline-none transition-colors placeholder:text-stone-500 hover:border-stone-400 focus:border-brand-brown focus:ring-4 focus:ring-brand-gold/25';
const PRIMARY_BUTTON =
  'inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-brown px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:cursor-not-allowed disabled:opacity-60';
const TEXT_BUTTON =
  'inline-flex items-center gap-1.5 rounded text-sm font-bold text-brand-brown underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60';

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string; minutos?: number }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return response.ok ? { ok: true, minutos: data.minutos } : { ok: false, error: data.error };
  } catch {
    return { ok: false, error: 'No hay conexión. Revisá tu internet y probá de nuevo.' };
  }
}

interface CuentaAccesoProps {
  /** Email del usuario del sitio con sesión: se confirma una vez y la cuenta queda unida a su usuario. */
  emailUsuario?: string;
}

export function CuentaAcceso({ emailUsuario }: CuentaAccesoProps = {}) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState(emailUsuario ?? '');
  // true mientras se usa el email del usuario del sitio (no se puede editar).
  const [usaEmailUsuario, setUsaEmailUsuario] = useState(Boolean(emailUsuario));
  const [codigo, setCodigo] = useState('');
  const [minutos, setMinutos] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  const requestCode = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const result = await postJson('/api/inscripciones/acceso/codigo', { email });
    setBusy(false);
    if (!result.ok) {
      setError(result.error || 'No pudimos enviar el código. Probá de nuevo.');
      return false;
    }
    if (result.minutos) setMinutos(result.minutos);
    return true;
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (await requestCode()) {
      setCodigo('');
      setStep('codigo');
      // Lleva el foco al campo del código cuando aparece.
      requestAnimationFrame(() => codeInputRef.current?.focus());
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const result = await postJson('/api/inscripciones/acceso/verificar', { email, codigo });
    if (!result.ok) {
      setBusy(false);
      setError(result.error || 'No pudimos verificar el código. Probá de nuevo.');
      return;
    }
    // La página se vuelve a pedir al servidor, que ahora reconoce la sesión.
    router.refresh();
  };

  const resend = async () => {
    if (await requestCode()) setNotice('Te mandamos un código nuevo. El anterior ya no sirve.');
  };

  if (step === 'email' && usaEmailUsuario) {
    return (
      <form onSubmit={submitEmail} noValidate>
        <p className="m-0 max-w-none text-left text-base leading-relaxed text-brand-ink/80">
          Ya tenés sesión en el sitio. Para cuidar los datos de tu familia, confirmá una sola vez que este email es tuyo:
        </p>
        <p className="m-0 mt-3 max-w-none break-all text-left font-display text-xl font-bold text-brand-ink">{email}</p>
        <p className="m-0 mt-2 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">
          Te mandamos un código de 6 números. Después vas a entrar directo con tu usuario.
        </p>

        {error && (
          <p role="alert" className="m-0 mt-4 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON} mt-6`}>
          {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {busy ? 'Enviando...' : 'Enviarme el código'}
        </button>
        <div className="mt-5">
          <button type="button" disabled={busy} onClick={() => { setUsaEmailUsuario(false); setEmail(''); setError(''); }} className={TEXT_BUTTON}>
            Usar otro email
          </button>
        </div>
        <p className="m-0 mt-5 max-w-none text-left text-xs leading-relaxed text-brand-ink/60">
          Cómo cuidamos los datos de tu familia: <a href="/privacidad" target="_blank" rel="noopener" className="font-bold text-brand-brown underline">política de privacidad</a>.
        </p>
      </form>
    );
  }

  if (step === 'email') {
    return (
      <form onSubmit={submitEmail} noValidate>
        <label htmlFor="cuenta-email" className="mb-2 block text-sm font-bold text-brand-ink">
          Tu email
        </label>
        <input
          id="cuenta-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nombre@ejemplo.com"
          aria-describedby="cuenta-email-ayuda"
          className={INPUT_CLASS}
        />
        <p id="cuenta-email-ayuda" className="m-0 mt-2 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">
          Te mandamos un código de 6 números para entrar. No hace falta contraseña.
        </p>

        {error && (
          <p role="alert" className="m-0 mt-4 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy || !email.trim()} className={`${PRIMARY_BUTTON} mt-6`}>
          {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {busy ? 'Enviando...' : 'Enviarme el código'}
        </button>
        <p className="m-0 mt-5 max-w-none text-left text-xs leading-relaxed text-brand-ink/60">
          Cómo cuidamos los datos de tu familia: <a href="/privacidad" target="_blank" rel="noopener" className="font-bold text-brand-brown underline">política de privacidad</a>.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} noValidate>
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-brand-cream px-4 py-3">
        <MailCheck size={20} className="mt-0.5 shrink-0 text-brand-brown" aria-hidden />
        <p className="m-0 max-w-none text-left text-sm leading-relaxed text-brand-ink/80">
          Si el email es correcto, en unos segundos te llega un código a{' '}
          <strong className="break-all font-bold text-brand-ink">{email}</strong>. Vence en {minutos} minutos.
        </p>
      </div>

      <label htmlFor="cuenta-codigo" className="mb-2 block text-sm font-bold text-brand-ink">
        Código de 6 números
      </label>
      <input
        id="cuenta-codigo"
        ref={codeInputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        required
        value={codigo}
        onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
        className={`${INPUT_CLASS} text-center font-display text-2xl font-bold tracking-[0.4em] tabular-nums`}
      />

      {error && (
        <p role="alert" className="m-0 mt-4 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="m-0 mt-4 max-w-none rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-medium text-emerald-900">
          {notice}
        </p>
      )}

      <button type="submit" disabled={busy || codigo.length !== 6} className={`${PRIMARY_BUTTON} mt-6`}>
        {busy && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {busy ? 'Verificando...' : 'Entrar'}
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => { setStep('email'); setError(''); setNotice(''); }}
          className={TEXT_BUTTON}
        >
          <ArrowLeft size={15} aria-hidden />
          Cambiar email
        </button>
        <button type="button" disabled={busy} onClick={resend} className={TEXT_BUTTON}>
          Mandarme otro código
        </button>
      </div>
    </form>
  );
}

export function CuentaSalir() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const salir = async () => {
    setBusy(true);
    await postJson('/api/inscripciones/acceso/salir', {});
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={salir}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60"
    >
      {busy ? 'Saliendo...' : 'Cerrar sesión'}
    </button>
  );
}

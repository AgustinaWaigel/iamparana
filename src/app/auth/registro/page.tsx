'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ChevronRight, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ message: '', isError: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: '', isError: false });

    if (form.password.length < 8) {
      setStatus({ message: 'La contraseña debe tener al menos 8 caracteres.', isError: true });
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({ message: 'Las contraseñas no coinciden.', isError: true });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear la cuenta.');
      }

      setStatus({ message: '¡Cuenta creada con éxito! Bienvenido.', isError: false });
      setTimeout(() => router.replace('/auth/bienvenida'), 800);
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : 'Error inesperado', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">Sumate</p>
          <h1 className="mt-2 text-2xl font-black text-stone-800">Creá tu cuenta de usuario</h1>
          <p className="mt-2 text-sm text-stone-500">Podrás acceder al sitio y recibir novedades con una cuenta simple y segura.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={17} />
              <input
                type="email"
                required
                placeholder="tuemail@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-10 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300"
                aria-label="Mostrar contraseña"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Confirmar contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" size={17} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repetí la contraseña"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
              />
            </div>
          </div>

          {status.message && (
            <div className={`rounded-xl border p-3 text-sm ${status.isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-brown px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-900"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><span>Crear cuenta</span><ChevronRight size={16} /></>}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">o</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 no-underline transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.2z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.800l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.500 42.6 14.6 48 24 48z" />
            </svg>
            Continuar con Google
          </a>
          <p className="m-0 max-w-none text-center text-xs leading-relaxed text-stone-500">
            Al crear tu cuenta aceptás la <Link href="/privacidad" className="font-bold text-brand-brown underline">política de privacidad</Link>.
          </p>
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/auth/login" className="font-semibold text-amber-700 hover:text-amber-900">Iniciá sesión</Link>
        </div>
      </div>
    </main>
  );
}

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
        </form>

        <div className="mt-6 text-center text-sm text-stone-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/auth/login" className="font-semibold text-amber-700 hover:text-amber-900">Iniciá sesión</Link>
        </div>
      </div>
    </main>
  );
}

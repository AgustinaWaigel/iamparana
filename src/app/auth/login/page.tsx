'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Lock,
  Mail,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', isError: false });
  const [showPassword, setShowPassword] = useState(false);

  // Verificar sesión inicial de forma simple
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return;
      }

      const data = await res.json();
      // Verificar que el endpoint devolvió un usuario válido (estructura plana)
      if (data && typeof data === 'object' && 'id' in data) {
        router.replace('/admin');
      }
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: '', isError: false });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Respuesta inesperada del servidor');
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

      setStatus({ message: '¡Bienvenido! Redirigiendo...', isError: false });

      // Pequeño delay para que el usuario vea el mensaje de éxito
      setTimeout(() => router.replace('/'), 800);
    } catch (err: any) {
      setStatus({ message: err.message, isError: true });
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-amber-700 mb-4" size={36} />
        <p className="text-stone-400 text-sm animate-pulse">Validando acceso...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-stretch relative overflow-hidden">
      {/* ── Panel izquierdo decorativo (solo pantallas grandes) ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-brand-brown relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Capas decorativas de fondo */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-amber-900/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-stone-900/40 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center">
          {/* Logo / ícono */}
          <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl">
            <span className="text-5xl">⛪</span>
          </div>

          <h2 className="text-white text-3xl font-bold tracking-tight leading-tight mb-3">
            IAM Paraná
          </h2>
          <p className="text-amber-200/70 text-sm leading-relaxed max-w-[260px] mx-auto">
            Panel de gestión de contenidos de la Infancia y adolescencia misionera de la Arquidiócesis de Paraná
          </p>

          {/* Divisor decorativo */}
          <div className="flex items-center gap-3 mt-10 mb-10 justify-center">
            <div className="h-px w-12 bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            <div className="h-px w-12 bg-white/20" />
          </div>

          <p className="text-white/30 text-xs uppercase tracking-[0.25em]">
            Área de Comunicación
          </p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 bg-[#fcfaf8] flex items-center justify-center p-6 relative">
        {/* Fondos sutiles */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-stone-200/50 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[400px] z-10">
          {/* Encabezado móvil (solo visible sin el panel izquierdo) */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-brand-brown rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-2xl">⛪</span>
            </div>
            <h1 className="text-stone-800 text-xl font-bold">IAM Paraná</h1>
            <p className="text-stone-400 text-xs mt-1">Gestión de contenidos arquidiocesanos</p>
          </div>

          {/* Tarjeta del formulario */}
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.07)] border border-stone-100 overflow-hidden">
            {/* Cabecera */}
            <div className="px-7 pt-7 pb-5 border-b border-stone-50">
              <h2 className="text-stone-800 text-lg font-bold tracking-tight">Iniciar sesión</h2>
              <p className="text-stone-400 text-xs mt-0.5">Ingresá tus credenciales para acceder al panel</p>
            </div>

            <form onSubmit={handleLogin} className="p-7 space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors duration-200"
                    size={17}
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@iamparana.com.ar"
                    value={credentials.email}
                    onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-stone-700 placeholder:text-stone-300 text-sm disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <Link
                    href="/auth/recuperar"
                    className="text-xs text-amber-700 hover:text-amber-900 transition-colors font-medium"
                    tabIndex={-1}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors duration-200"
                    size={17}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={credentials.password}
                    onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-stone-700 placeholder:text-stone-300 text-sm disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    disabled={loading}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors duration-200 disabled:opacity-40"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Mensaje de estado */}
              {status.message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl text-xs animate-in fade-in slide-in-from-top-2 duration-300 ${
                    status.isError
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  {status.isError ? (
                    <AlertCircle size={14} className="shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  )}
                  <span className="font-medium">{status.message}</span>
                </div>
              )}

              {/* Botón de ingreso */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-1"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Ingresar al sistema</span>
                      <ChevronRight
                        size={16}
                        className="group-hover:translate-x-0.5 transition-transform duration-200"
                      />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-stone-300 text-[10px] uppercase tracking-[0.2em] mt-6">
            ÁREA de Comunicación • Arquidiócesis de Paraná
          </p>
        </div>
      </div>
    </main>
  );
}
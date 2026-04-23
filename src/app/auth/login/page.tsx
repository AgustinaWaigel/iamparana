'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', isError: false });

  // Verificar sesión inicial de forma simple
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      // Verificar que el endpoint devolvió un usuario válido (estructura plana)
      if (data && typeof data === 'object' && 'id' in data) {
        router.replace('/admin');
      }
    } catch (err) {
      console.error("Auth check failed", err);
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
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-amber-700 mb-4" size={40} />
        <p className="text-stone-500 animate-pulse font-medium">Validando acceso...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfaf8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Pantalla de acceso al panel administrativo. */}
      {/* Decoración de fondo sutil para dar profundidad sin distraer del formulario. */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-[400px] z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-stone-100 overflow-hidden">
          
          {/* Encabezado visual del login. */}
          <div className="bg-brand-brown p-6 text-center relative">
            <div className="w-14 h-14 bg-white rounded-xl rotate-3 shadow-lg mx-auto mb-3 flex items-center justify-center border border-amber-100">
               <span className="text-xl">🔐</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Panel IAM</h1>
            <p className="text-amber-100/70 text-xs mt-0.5">Gestión de contenidos arquidiocesanos</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-3.5">
            {/* Campo de correo para identificar al usuario. */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase ml-1 tracking-wider">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="ejemplo@iamparana.com.ar"
                  value={credentials.email}
                  onChange={e => setCredentials({...credentials, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-stone-700 placeholder:text-stone-300 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo de contraseña para validar el acceso. */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase ml-1 tracking-wider">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••••••"
                  value={credentials.password}
                  onChange={e => setCredentials({...credentials, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-stone-700 placeholder:text-stone-300 text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensajes de estado: éxito, error o validación en curso. */}
            {status.message && (
              <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs animate-in fade-in slide-in-from-top-2 duration-300 ${
                status.isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                {status.isError ? <AlertCircle size={14} /> : <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />}
                <span className="font-medium">{status.message}</span>
              </div>
            )}

            {/* Botón principal de ingreso. */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full group relative bg-brand-brown text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-[0_10px_20px_rgba(98,45,13,0.15)] hover:shadow-[0_15px_25px_rgba(98,45,13,0.25)] disabled:opacity-50 active:scale-[0.98] text-sm"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span>Ingresar al sistema</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Pie con la identificación del equipo responsable del panel. */}
          <div className="p-4 bg-stone-50 border-t border-stone-100 text-center">
            <p className="text-stone-400 text-[9px] uppercase tracking-[0.2em]">
              Oficina de Comunicación • Arquidiócesis de Paraná
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

function NuevaContrasenaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('El link es inválido o ha expirado.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/nueva-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña');

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fuerza de la contraseña
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: score, label: 'Débil', color: 'bg-red-400' };
    if (score <= 3) return { level: score, label: 'Media', color: 'bg-amber-400' };
    return { level: score, label: 'Fuerte', color: 'bg-green-500' };
  };

  const strength = getStrength();

  return (
    <main className="min-h-screen bg-[#fcfaf8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-[400px] z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-stone-100 overflow-hidden">

          <div className="bg-brand-brown p-6 text-center">
            <div className="w-14 h-14 bg-white rounded-xl rotate-3 shadow-lg mx-auto mb-3 flex items-center justify-center border border-amber-100">
              <span className="text-xl">🔒</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Nueva contraseña</h1>
            <p className="text-amber-100/70 text-xs mt-0.5">Creá una nueva contraseña segura</p>
          </div>

          <div className="p-6">
            {success ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
                <div>
                  <p className="text-stone-700 font-semibold text-sm">¡Contraseña actualizada!</p>
                  <p className="text-stone-400 text-xs mt-1.5">Redirigiendo al login...</p>
                </div>
                <div className="flex justify-center">
                  <Loader2 className="animate-spin text-amber-600" size={20} />
                </div>
              </div>
            ) : !token || error === 'El link es inválido o ha expirado.' ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldAlert className="text-red-400" size={32} />
                </div>
                <div>
                  <p className="text-stone-700 font-semibold text-sm">Link inválido o expirado</p>
                  <p className="text-stone-400 text-xs mt-1.5 leading-relaxed">
                    El link de recuperación no es válido o ya fue utilizado. Solicitá uno nuevo.
                  </p>
                </div>
                <Link
                  href="/auth/recuperar"
                  className="block w-full bg-brand-brown text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors text-center"
                >
                  Solicitar nuevo link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nueva contraseña */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1 tracking-wider">
                    Nueva contraseña
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-stone-700 placeholder:text-stone-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {/* Barra de fuerza */}
                  {password && (
                    <div className="flex items-center gap-2 mt-1.5 ml-1">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-stone-100'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-400 font-medium">{strength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1 tracking-wider">
                    Confirmar contraseña
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Repetí la contraseña"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-3 bg-stone-50 border rounded-xl outline-none focus:bg-white focus:ring-4 transition-all text-stone-700 placeholder:text-stone-300 text-sm ${confirm && confirm !== password
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10'
                          : 'border-stone-200 focus:border-amber-500 focus:ring-amber-500/10'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle size={14} />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-brown text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-all shadow-[0_10px_20px_rgba(98,45,13,0.15)] hover:shadow-[0_15px_25px_rgba(98,45,13,0.25)] disabled:opacity-50 active:scale-[0.98] text-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Actualizar contraseña</span>}
                  </div>
                </button>
              </form>
            )}
          </div>

          <div className="p-4 bg-stone-50 border-t border-stone-100 text-center">
            <p className="text-stone-400 text-[9px] uppercase tracking-[0.2em]">
              Área de Comunicación • Arquidiócesis de Paraná
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-700" size={36} />
      </div>
    }>
      <NuevaContrasenaForm />
    </Suspense>
  );
}

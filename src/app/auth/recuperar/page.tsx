'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RecuperarPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar el email');

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-[400px] z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-stone-100 overflow-hidden">

          {/* Header */}
          <div className="bg-brand-brown p-6 text-center relative">
            <div className="w-14 h-14 bg-white rounded-xl rotate-3 shadow-lg mx-auto mb-3 flex items-center justify-center border border-amber-100">
              <span className="text-xl">🔑</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Recuperar contraseña</h1>
            <p className="text-amber-100/70 text-xs mt-0.5">Te enviaremos un link a tu correo</p>
          </div>

          <div className="p-6">
            {sent ? (
              // Estado de éxito
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
                <div>
                  <p className="text-stone-700 font-semibold text-sm">¡Email enviado!</p>
                  <p className="text-stone-400 text-xs mt-1.5 leading-relaxed">
                    Si el email <strong>{email}</strong> está registrado, recibirás un link para restablecer tu contraseña. Revisá también el correo no deseado.
                  </p>
                </div>
                <p className="text-amber-700/70 text-xs">El link expira en 1 hora.</p>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="w-full bg-brand-brown text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors mt-2"
                >
                  Volver al login
                </button>
              </div>
            ) : (
              // Formulario
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-stone-500 text-sm leading-relaxed">
                  Ingresá el email asociado a tu cuenta y te enviaremos un link para crear una nueva contraseña.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase ml-1 tracking-wider">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@iamparana.com.ar"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-stone-700 placeholder:text-stone-300 text-sm"
                    />
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
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Enviar link de recuperación</span>}
                  </div>
                </button>

                <div className="text-center pt-1">
                  <Link href="/auth/login" className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                    <ArrowLeft size={12} />
                    Volver al login
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
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

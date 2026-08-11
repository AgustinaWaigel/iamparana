'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'miembro'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo crear el usuario');
      }

      router.push('/admin/usuarios');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 pt-20">
      <Link href="/admin/usuarios" className="inline-flex items-center text-sm font-bold text-stone-500 hover:text-brand-brown transition-colors mb-6">
        <ArrowLeft size={16} className="mr-1" />
        Volver a Usuarios
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <h1 className="text-2xl font-black text-brand-brown mb-2">Crear Nuevo Usuario</h1>
        <p className="text-stone-500 text-sm mb-6">Completa los datos para registrar un nuevo integrante del equipo.</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1.5">Nombre (Opcional)</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 outline-none transition-all"
              placeholder="Nombre a mostrar"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1.5">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 outline-none transition-all"
            >
              <option value="admin">Administrador</option>
              <option value="miembro">Miembro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1.5">Contraseña provisoria</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 outline-none transition-all"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link 
              href="/admin/usuarios"
              className="px-6 py-3 rounded-xl text-stone-500 font-bold hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-brown text-white font-bold hover:bg-brand-deep transition-all shadow-md hover:shadow-lg flex items-center justify-center min-w-[140px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Creando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

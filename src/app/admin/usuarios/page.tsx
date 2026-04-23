'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionUser } from '@/app/lib/use-session';
import { Trash2, Edit2, Plus, UserCheck, UserX, Loader2, Search } from 'lucide-react';

interface User {
  id: number;
  email: string;
  display_name?: string | null;
  role: string;
  is_active: number;
  created_at: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSessionUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', role: 'animador', password: '' });

  // 🛡️ Redirección de seguridad (Cliente como respaldo del Servidor)
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsFetching(false);
      }
    }

    if (user?.role === 'admin') fetchUsers();
  }, [user]);

  // Filtrado optimizado con useMemo
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter(u => {
      const matchesRole = !selectedRole || u.role === selectedRole;
      const matchesSearch =
        term.length === 0 ||
        (u.display_name || '').toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term) ||
        String(u.id).includes(term);

      return matchesRole && matchesSearch;
    });
  }, [users, selectedRole, searchTerm]);

  const handleToggleActive = async (id: number, currentStatus: number) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: currentStatus !== 1 })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => 
          u.id === id ? { ...u, is_active: currentStatus === 1 ? 0 : 1 } : u
        ));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, is_active: 0 } : u)));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditForm({
      displayName: targetUser.display_name || targetUser.email.split('@')[0],
      role: targetUser.role,
      password: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setProcessingId(editingUser.id);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editForm.displayName.trim(),
          role: editForm.role,
          ...(editForm.password.trim() ? { password: editForm.password.trim() } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el usuario');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, display_name: editForm.displayName.trim(), role: editForm.role }
            : u
        )
      );
      setEditingUser(null);
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar el usuario.');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-brand-brown mb-2" size={40} />
        <p className="text-stone-500 font-medium">Cargando usuarios...</p>
      </div>
    );
  }

  if (user?.role !== 'admin') return null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 pt-20">
      {/* Header de la sección */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-brown tracking-tight">Gestión de Usuarios</h1>
          <p className="text-stone-500">Administrá los accesos y roles del equipo IAM.</p>
        </div>
        
        <Link 
          href="/admin/usuarios/nuevo"
          className="inline-flex items-center gap-2 bg-brand-brown text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} />
          Nuevo Usuario
        </Link>
      </div>

      {/* Filtros y Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative min-w-0 sm:min-w-80">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email, rol o ID..."
                className="w-full text-sm border border-stone-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-sm border-stone-300 rounded-lg focus:ring-brand-brown"
            >
              <option value="">Todos los roles</option>
              {['admin', 'equipo', 'redactor', 'coordinador', 'animador'].map(role => (
                <option key={role} value={role} className="capitalize">{role}</option>
              ))}
            </select>
          </div>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            {filteredUsers.length} Usuarios encontrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-stone-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-stone-800">{u.display_name || u.email.split('@')[0]}</div>
                    <div className="text-sm text-stone-600">{u.email}</div>
                    <div className="text-[10px] text-stone-400">ID: {u.id} • Creado el {new Date(u.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 capitalize border border-amber-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      disabled={processingId === u.id}
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        u.is_active === 1 
                          ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {processingId === u.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : u.is_active === 1 ? (
                        <UserCheck size={14} />
                      ) : (
                        <UserX size={14} />
                      )}
                      {u.is_active === 1 ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="p-2 text-stone-400 hover:text-brand-brown hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all shadow-none hover:shadow-sm"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        disabled={processingId === u.id || u.is_active !== 1}
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all shadow-none hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Desactivar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingUser(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-black text-brand-brown">Editar usuario</h3>
            <p className="mt-1 text-sm text-stone-500">{editingUser.email}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Nombre</label>
                <input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                >
                  {['admin', 'equipo', 'redactor', 'coordinador', 'animador'].map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processingId === editingUser.id}
                onClick={handleSaveEdit}
                className="rounded-lg bg-brand-brown px-4 py-2 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-50"
              >
                {processingId === editingUser.id ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
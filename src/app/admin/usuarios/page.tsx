'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionUser } from '@/lib/use-session';
import { Trash2, Edit2, Plus } from 'lucide-react';

type User = {
  id: number;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
};

export default function UsuariosPage() {
  const router = useRouter();
  const { user, loading } = useSessionUser();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    // Verificar que sea admin
    if (!loading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

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
        setUsersLoading(false);
      }
    }

    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleActive = async (id: number, isActive: number) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive === 1 ? 0 : 1 })
      });
      if (res.ok) {
        setUsers(users.map(u => 
          u.id === id ? { ...u, is_active: isActive === 1 ? 0 : 1 } : u
        ));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading || usersLoading) {
    return <div className="mt-24 text-center">Cargando...</div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div id="header"></div>
      <main className="mt-20 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-brand-brown mb-2">Gestión de Usuarios</h1>
              <p className="text-gray-600">Total: {users.length} usuarios</p>
            </div>
            <Link 
              href="/admin/usuarios/nuevo"
              className="flex items-center gap-2 bg-brand-brown text-white px-4 py-2 rounded-lg hover:brightness-110 transition"
            >
              <Plus size={20} />
              Nuevo Usuario
            </Link>
          </div>

          <div className="mb-6 flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="equipo">Equipo</option>
              <option value="redactor">Redactor</option>
              <option value="coordinador">Coordinador</option>
              <option value="animador">Animador</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-brand-brown text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Rol</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Creado</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users
                  .filter(u => !selectedRole || u.role === selectedRole)
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-brand-gold/20 text-brand-brown rounded-full text-sm font-semibold">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                            u.is_active === 1
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {u.is_active === 1 ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/admin/usuarios/${u.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <div id="footer"></div>
    </>
  );
}

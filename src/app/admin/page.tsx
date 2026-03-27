'use client';

import { useEffect, useState, useCallback } from 'react';

// --- Tipado y Constantes ---
type Entity = 'noticias' | 'canciones' | 'agenda' | 'carousel';
type UserRole = 'admin' | 'editor' | 'moderator' | 'viewer';

interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
}

interface AdminUser {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
}

const ENTITY_OPTIONS: { key: Entity; label: string }[] = [
  { key: 'noticias', label: 'Noticias' },
  { key: 'canciones', label: 'Canciones' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'carousel', label: 'Carousel' },
];

const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'moderator', 'viewer'];

// Helper para fechas locales (Argentina)
const getLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const NEW_TEMPLATES: Record<Entity, any> = {
  noticias: { slug: 'nueva-noticia', title: '', date: getLocalDate(), cat: 'NACIONAL', bajada: '', description: '', image: '/uploads/noticias/', content: '' },
  canciones: { slug: 'nueva-cancion', title: '', artist: '', content: '' },
  agenda: { evento: '', fecha: getLocalDate(), fecha_fin: '' },
  carousel: { slug: 'nuevo-item', imageDesktop: '/uploads/carousel/', imageMobile: '/uploads/carousel/', alt: '', link: '', buttonText: '', order: 0 },
};

export default function AdminPage() {
  // --- Estados de Auth ---
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  // --- Estados de Contenido ---
  const [entity, setEntity] = useState<Entity>('noticias');
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [editorValue, setEditorValue] = useState('');
  const [status, setStatus] = useState({ message: 'Listo', isError: false });
  const [loading, setLoading] = useState(false);

  // --- Estados de Usuarios ---
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'viewer' as UserRole });
  const [editingUsers, setEditingUsers] = useState<Record<number, Partial<AdminUser & { password?: string }>>>({});

  // --- Helpers de Comunicación ---
  const updateStatus = (msg: string, isError = false) => setStatus({ message: msg, isError });

  const fetchAdmin = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Error ${response.status}`);
    }
    return response.headers.get('content-type')?.includes('application/json') ? response.json() : null;
  }, []);

  // --- Lógica de Sesión ---
  const fetchSession = useCallback(async () => {
    try {
      const data = await fetchAdmin('/api/auth/me');
      if (data?.authenticated) setSessionUser(data.user);
    } catch {
      setSessionUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [fetchAdmin]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchAdmin('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setSessionUser(data.user);
      updateStatus('Sesión iniciada');
    } catch (err: any) {
      updateStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Contenido ---
  const loadItems = async () => {
    setLoading(true);
    updateStatus('Cargando...');
    try {
      const data = await fetchAdmin(`/api/admin/${entity}`);
      setItems(data || []);
      updateStatus(`Cargados ${data?.length || 0} registros`);
    } catch (err: any) {
      updateStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async () => {
    try {
      const payload = JSON.parse(editorValue);
      const isUpdate = !!selectedKey;
      const route = isUpdate ? `/api/admin/${entity}/${selectedKey}` : `/api/admin/${entity}`;
      
      setLoading(true);
      await fetchAdmin(route, { 
        method: isUpdate ? 'PUT' : 'POST', 
        body: JSON.stringify(payload) 
      });
      
      updateStatus(isUpdate ? 'Actualizado correctamente' : 'Creado correctamente');
      loadItems();
    } catch (err: any) {
      updateStatus(err instanceof SyntaxError ? 'JSON Inválido' : err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Gestión de Usuarios (Mejorada) ---
  const handleUserEditChange = (id: number, fields: Partial<AdminUser & { password?: string }>) => {
    setEditingUsers(prev => ({
      ...prev,
      [id]: { ...prev[id], ...fields }
    }));
  };

  const submitUserUpdate = async (user: AdminUser) => {
    const changes = editingUsers[user.id];
    if (!changes) return;
    setLoading(true);
    try {
      await fetchAdmin(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: changes.role ?? user.role,
          isActive: changes.isActive ?? user.isActive,
          password: changes.password || undefined
        }),
      });
      updateStatus('Usuario actualizado');
      const updatedUsers = await fetchAdmin('/api/admin/users');
      setUsers(updatedUsers);
    } catch (err: any) {
      updateStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado Condicional de Carga ---
  if (authLoading) return <div className="p-10 text-center">Verificando credenciales...</div>;

  // --- Vista de Login ---
  if (!sessionUser) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-200">
          <h1 className="text-2xl font-bold mb-6 text-stone-800 text-center">Admin Panel</h1>
          <div className="space-y-4">
            <input 
              type="email" placeholder="Email" required
              className="w-full p-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none"
              onChange={e => setCredentials({...credentials, email: e.target.value})}
            />
            <input 
              type="password" placeholder="Contraseña" required
              className="w-full p-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-500 outline-none"
              onChange={e => setCredentials({...credentials, password: e.target.value})}
            />
            <button 
              disabled={loading}
              className="w-full bg-amber-700 text-white p-3 rounded-lg font-bold hover:bg-amber-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>
          </div>
          {status.message !== 'Listo' && (
            <p className={`mt-4 text-sm text-center ${status.isError ? 'text-red-600' : 'text-green-600'}`}>{status.message}</p>
          )}
        </form>
      </main>
    );
  }

  // --- Panel Principal ---
  const canManageUsers = sessionUser.role === 'admin';

  return (
    <main className="max-w-7xl mx-auto p-6 pt-24 font-sans text-stone-900">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-amber-900 uppercase tracking-tight">Dashboard Turso</h1>
          <p className="text-stone-500 text-sm">Conectado como: <span className="font-bold">{sessionUser.email}</span> [{sessionUser.role}]</p>
        </div>
        <button onClick={() => window.location.href='/api/auth/logout'} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium">Salir</button>
      </header>

      {/* Sección de Usuarios */}
      {canManageUsers && (
        <section className="mb-10 bg-white p-6 rounded-xl border border-stone-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">👥 Gestión de Usuarios</h2>
          <div className="grid gap-3">
            {users.map(user => (
              <div key={user.id} className="flex flex-wrap items-center gap-4 p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="font-mono text-sm flex-1">{user.email}</span>
                <select 
                  className="p-1 rounded border"
                  defaultValue={user.role}
                  onChange={e => handleUserEditChange(user.id, { role: e.target.value as UserRole })}
                >
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <label className="text-sm flex items-center gap-1">
                  <input type="checkbox" defaultChecked={user.isActive} onChange={e => handleUserEditChange(user.id, { isActive: e.target.checked })} /> Activo
                </label>
                <input 
                  type="password" placeholder="Nuevo pass" 
                  className="p-1 text-sm border rounded w-32"
                  onChange={e => handleUserEditChange(user.id, { password: e.target.value })}
                />
                <button 
                  onClick={() => submitUserUpdate(user)}
                  disabled={loading || !editingUsers[user.id]}
                  className="bg-stone-800 text-white px-3 py-1 rounded text-sm disabled:opacity-30"
                >
                  Guardar
                </button>
              </div>
            ))}
            <button onClick={() => fetchAdmin('/api/admin/users').then(setUsers)} className="text-amber-700 text-sm font-bold w-fit">+ Cargar/Refrescar Lista</button>
          </div>
        </section>
      )}

      {/* Editor de Contenido */}
      <div className="grid lg:grid-cols-[350px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="flex gap-2">
            <select 
              className="flex-1 p-2 rounded-lg border border-stone-300"
              value={entity}
              onChange={e => setEntity(e.target.value as Entity)}
            >
              {ENTITY_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </select>
            <button onClick={loadItems} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold">Cargar</button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-3 bg-stone-50 border-b flex justify-between items-center">
              <span className="font-bold text-sm uppercase">Registros</span>
              <button onClick={() => { setSelectedKey(''); setEditorValue(JSON.stringify(NEW_TEMPLATES[entity], null, 2)); }} className="text-xs bg-white border px-2 py-1 rounded hover:bg-stone-100">+ Nuevo</button>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2 space-y-1">
              {items.map(item => {
                const key = item.slug || item.id;
                return (
                  <button 
                    key={key}
                    onClick={() => { setSelectedKey(key); setEditorValue(JSON.stringify(item, null, 2)); }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedKey === key ? 'bg-amber-50 border-amber-200 border shadow-inner' : 'hover:bg-stone-50 border border-transparent'}`}
                  >
                    <div className="font-bold truncate">{item.title || item.evento || item.alt || key}</div>
                    <div className="text-[10px] opacity-50 font-mono">{key}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className={`text-sm font-medium ${status.isError ? 'text-red-600' : 'text-amber-600'}`}>
              ● {status.message}
            </div>
            <div className="flex gap-2">
               <button 
                onClick={saveItem}
                disabled={loading}
                className="bg-amber-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-800 disabled:opacity-50"
              >
                {loading ? '...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
          <textarea 
            value={editorValue}
            onChange={e => setEditorValue(e.target.value)}
            className="w-full h-[600px] font-mono text-sm p-4 bg-stone-900 text-amber-200 rounded-lg outline-none focus:ring-4 focus:ring-amber-500/10 leading-relaxed"
            placeholder="Selecciona un registro para editar..."
          />
        </section>
      </div>
    </main>
  );
}
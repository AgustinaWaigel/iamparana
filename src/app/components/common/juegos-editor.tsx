'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, X, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';

// Editor flotante para agregar, modificar o borrar juegos del módulo Animación.
interface Juego {
  id: number;
  slug: string;
  title: string;
  description: string;
  youtubeId: string | null;
  category: string;
  order: number;
}

interface JuegosEditorProps {
  onRefresh?: () => void;
}

export function JuegosEditor({ onRefresh }: JuegosEditorProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<Juego>>({
    title: '',
    description: '',
    youtubeId: '',
    category: 'general',
    order: 999,
    slug: '',
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.status === 401) {
        setIsAdmin(false);
        return;
      }
      const data = await response.json();
      setIsAdmin(data?.role === 'admin' || data?.role === 1);
    } catch {
      setIsAdmin(false);
    }
  };

  const loadJuegos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Carga la lista completa para editarla desde el panel.
      const response = await fetch('/api/admin/juegos', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al cargar juegos');
      const data = await response.json();
      setJuegos(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (!isAdmin) return null;

  const handleOpenEditor = () => {
    setFormData({ title: '', description: '', youtubeId: '', category: 'general', order: 999, slug: '' });
    setEditingId(null);
    loadJuegos();
    setIsOpen(true);
  };

  const handleEdit = (juego: Juego) => {
    setFormData(juego);
    setEditingId(juego.id);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!formData.slug || !formData.title || !formData.description) {
      setError('Completa los campos requeridos');
      setIsLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/admin/juegos/${editingId}` : '/api/admin/juegos';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess(editingId ? 'Juego actualizado' : 'Juego creado');
      setFormData({ title: '', description: '', youtubeId: '', category: 'general', order: 999, slug: '' });
      setEditingId(null);
      await loadJuegos();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/juegos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      setSuccess('Juego eliminado');
      setDeleteConfirm(null);
      await loadJuegos();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante para agregar juego */}
      <button
        onClick={handleOpenEditor}
        className="fixed bottom-8 right-8 bg-brand-brown hover:bg-brand-brown/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-5000 flex items-center gap-2"
      >
        <Plus size={20} />
        <span className="text-sm font-bold">Agregar Juego</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Gestionar Juegos</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                  {success}
                </div>
              )}

              {/* Editor */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-lg">{editingId ? 'Editar' : 'Nuevo'} Juego</h3>
                
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Slug (ej: juego-cooperativo)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />

                <input
                  type="text"
                  value={formData.youtubeId || ''}
                  onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                  placeholder="YouTube ID (ej: dQw4w9WgXcQ)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />

                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
                />

                <select
                  value={formData.category || 'general'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="general">General</option>
                  <option value="cooperativo">Cooperativo</option>
                  <option value="competitivo">Competitivo</option>
                  <option value="ronda">En Ronda</option>
                </select>

                <input
                  type="number"
                  value={formData.order || 999}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  placeholder="Orden"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Guardar'}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Lista */}
              <div>
                <h3 className="font-bold text-lg mb-4">Juegos Existentes</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-4">Cargando...</div>
                  ) : juegos.length === 0 ? (
                    <p className="text-gray-500">No hay juegos aún</p>
                  ) : (
                    juegos.map((juego) => (
                      <div key={juego.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-semibold">{juego.title}</p>
                          <p className="text-sm text-gray-600">{juego.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(juego)}
                            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(juego.id)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {deleteConfirm && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="mb-3">¿Eliminar este juego?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 bg-gray-300 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

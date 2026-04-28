'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AdminActionButton } from '@/app/components/common/admin-action-button';

// Editor flotante para administrar el contenido editorial de la sección Animación.
interface AnimacionContent {
  id: number;
  section: string;
  title: string;
  description: string;
  content: string | null;
}

interface AnimacionEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function AnimacionEditor({ isAdmin: propIsAdmin, onRefresh }: AnimacionEditorProps) {
  const [isAdmin, setIsAdmin] = useState(propIsAdmin);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<AnimacionContent | null>(null);
  const [formData, setFormData] = useState<Partial<AnimacionContent>>({
    title: '',
    description: '',
    content: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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


  useEffect(() => {
    if (isAdmin && isOpen && !content) {
      fetchContent();
    }
  }, [isAdmin, isOpen, content]);

  const fetchContent = async () => {
    try {
      // Trae el contenido actual para editarlo desde el modal.
      const response = await fetch('/api/admin/animacion', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al cargar');
      const data = await response.json();
      setContent(data);
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleSave = async () => {
    // Guarda cambios de título, descripción y contenido adicional.
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/animacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          content: formData.content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setSuccess('Contenido actualizado correctamente');
      setContent(formData as AnimacionContent);
      onRefresh?.();
      setTimeout(() => setIsOpen(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      {/* Botón flotante para editar */}
      <AdminActionButton
        onClick={() => setIsOpen(true)}
        action="add"
        label="Editar"
        className="fixed bottom-8 right-8 z-40 shadow-lg hover:shadow-xl"
        title="Editar Animación"
      />

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Editar Animación</h2>
              <AdminActionButton
                onClick={() => setIsOpen(false)}
                action="close"
                compact
                tone="neutral"
                className="p-1"
              />
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">Título</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título de la sección"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Descripción Principal</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                  placeholder="Descripción de la página de animación"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Contenido Adicional (Opcional)</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Contenido adicional que aparecerá abajo"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <AdminActionButton
                  onClick={() => setIsOpen(false)}
                  action="close"
                  tone="neutral"
                  label="Cancelar"
                  className="px-4 py-2"
                />
                <AdminActionButton
                  onClick={handleSave}
                  disabled={isLoading}
                  action="save"
                  label={isLoading ? 'Guardando...' : 'Guardar'}
                  className="px-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

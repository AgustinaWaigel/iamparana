'use client';

import { useState } from 'react';
import { AdminActionButton } from '@/app/components/common/admin-action-button';

interface ContenidoEditorProps {
  isAdmin: boolean;
  seccion: string; // comunicacion, espiritualidad, institucional, logistica
  onRefresh?: () => void;
}

export function ContenidoEditor({ isAdmin, seccion, onRefresh }: ContenidoEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/contenido`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seccion,
          titulo: formData.titulo,
          contenido: formData.contenido,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar contenido');
      }

      setSuccess('Contenido actualizado correctamente');
      setFormData({
        titulo: '',
        contenido: '',
      });
      setIsOpen(false);

      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getColor = () => {
    switch (seccion) {
      case 'comunicacion':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'espiritualidad':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'institucional':
        return 'bg-green-500 hover:bg-green-600';
      case 'logistica':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getHeaderColor = () => {
    switch (seccion) {
      case 'comunicacion':
        return 'bg-blue-600';
      case 'espiritualidad':
        return 'bg-purple-600';
      case 'institucional':
        return 'bg-green-600';
      case 'logistica':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <AdminActionButton
        onClick={() => setIsOpen(true)}
        action="add"
        label="Editar"
        className="fixed bottom-8 right-8 z-40 shadow-lg hover:shadow-xl"
      />

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[61] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`sticky top-0 ${getHeaderColor()} text-white p-6 flex justify-between items-center`}>
              <h2 className="text-2xl font-bold">Editar Contenido</h2>
              <AdminActionButton
                onClick={() => setIsOpen(false)}
                action="close"
                compact
                tone="neutral"
                className="p-1 bg-white/10 text-white border-white/10 hover:bg-white/20 hover:text-white hover:border-white/20"
              />
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
                  {success}
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título (opcional)"
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contenido *
                </label>
                <textarea
                  required
                  value={formData.contenido}
                  onChange={(e) =>
                    setFormData({ ...formData, contenido: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={10}
                  placeholder="Contenido (puede incluir HTML)"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-semibold mb-2">Consejos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Puedes usar HTML básico para formatear</li>
                  <li>Las etiquetas se renderizarán como contenido seguro</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <AdminActionButton
                  type="button"
                  onClick={() => setIsOpen(false)}
                  action="close"
                  tone="neutral"
                  label="Cancelar"
                  className="flex-1 px-4 py-2"
                />
                <AdminActionButton
                  type="submit"
                  disabled={isLoading}
                  action="save"
                  label={isLoading ? 'Guardando...' : 'Guardar Contenido'}
                  className="flex-1 px-4 py-2"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

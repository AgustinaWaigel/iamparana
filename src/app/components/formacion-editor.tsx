'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';

interface FormacionEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function FormacionEditor({ isAdmin, onRefresh }: FormacionEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'presentacion', // presentacion, temario, carta, otro
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!file) throw new Error('Selecciona un archivo');

      // Subir archivo a Google Drive
      const formDataImage = new FormData();
      formDataImage.append('file', file);
      formDataImage.append('type', 'documento');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataImage,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Error al subir archivo');
      }

      const uploadedData = await uploadRes.json();

      // Guardar en DB si es necesario (aquí podrías implementar)
      const response = await fetch('/api/admin/documentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          url: uploadedData.url,
          fileId: uploadedData.fileId,
          fecha: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar documento');
      }

      setSuccess('Documento subido correctamente');
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'presentacion',
      });
      setFile(null);
      setIsOpen(false);

      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-yellow-400 hover:bg-yellow-500 text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="hidden md:inline text-sm font-bold">Nuevo Documento</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-yellow-400 text-black p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Subir Documento</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-yellow-500 rounded transition-colors"
              >
                <X size={24} />
              </button>
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
                  Título del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Ej: Presentación Módulo 1"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  rows={3}
                  placeholder="Descripción del documento"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="presentacion">Presentación</option>
                  <option value="temario">Temario</option>
                  <option value="carta">Carta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Archivo *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {file ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{file.name}</p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      required
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-bold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    'Subir Documento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

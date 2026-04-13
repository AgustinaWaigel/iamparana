'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Link as LinkIcon, FileUp } from 'lucide-react';

interface FormacionEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function FormacionEditor({ isAdmin, onRefresh }: FormacionEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'document' | 'link'>('document');
  const [isLoading, setIsLoading] = useState(false);
  
  // Document form
  const [docData, setDocData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'formacion',
  });
  const [file, setFile] = useState<File | null>(null);
  
  // Link form
  const [linkData, setLinkData] = useState({
    title: '',
    description: '',
    url: '',
    icon: '🔗',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return null;

  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!file) throw new Error('Selecciona un archivo');

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

      const response = await fetch('/api/admin/documentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: docData.titulo,
          descripcion: docData.descripcion,
          tipo: docData.tipo,
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
      setDocData({ titulo: '', descripcion: '', tipo: 'formacion' });
      setFile(null);
      setTimeout(() => {
        setIsOpen(false);
        onRefresh?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!linkData.title) throw new Error('El título es obligatorio');
      if (!linkData.url) throw new Error('La URL es obligatoria');

      const response = await fetch('/api/admin/links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'formacion',
          title: linkData.title,
          description: linkData.description || null,
          url: linkData.url,
          icon: linkData.icon,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar enlace');
      }

      setSuccess('Enlace agregado correctamente');
      setLinkData({ title: '', description: '', url: '', icon: '🔗' });
      setTimeout(() => {
        setIsOpen(false);
        onRefresh?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = mode === 'document' ? handleSubmitDocument : handleSubmitLink;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-yellow-400 hover:bg-yellow-500 text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="hidden md:inline text-sm font-bold">Agregar</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header con tabs */}
            <div className="sticky top-0 bg-yellow-400 text-black p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {mode === 'document' ? 'Subir Documento' : 'Agregar Enlace'}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-yellow-500 rounded transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('document')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${
                    mode === 'document'
                      ? 'bg-white text-black'
                      : 'bg-yellow-300 text-black hover:bg-yellow-200'
                  }`}
                >
                  <FileUp size={18} />
                  Documento
                </button>
                <button
                  onClick={() => setMode('link')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${
                    mode === 'link'
                      ? 'bg-white text-black'
                      : 'bg-yellow-300 text-black hover:bg-yellow-200'
                  }`}
                >
                  <LinkIcon size={18} />
                  Enlace
                </button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  ❌ {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
                  ✅ {success}
                </div>
              )}

              {mode === 'document' ? (
                <>
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Título del Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={docData.titulo}
                      onChange={(e) =>
                        setDocData({ ...docData, titulo: e.target.value })
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
                      value={docData.descripcion}
                      onChange={(e) =>
                        setDocData({ ...docData, descripcion: e.target.value })
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
                      value={docData.tipo}
                      onChange={(e) =>
                        setDocData({ ...docData, tipo: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="formacion">Presentación</option>
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
                          <p className="text-sm text-gray-700">📄 {file.name}</p>
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
                </>
              ) : (
                <>
                  {/* Título del enlace */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Título del Enlace *
                    </label>
                    <input
                      type="text"
                      required
                      value={linkData.title}
                      onChange={(e) =>
                        setLinkData({ ...linkData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Ej: Mi Blog"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={linkData.description}
                      onChange={(e) =>
                        setLinkData({ ...linkData, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      rows={2}
                      placeholder="Descripción del enlace"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={linkData.url}
                      onChange={(e) =>
                        setLinkData({ ...linkData, url: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  {/* Emoji */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Icono (emoji)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={linkData.icon}
                      onChange={(e) =>
                        setLinkData({ ...linkData, icon: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-2xl text-center"
                      placeholder="🔗"
                    />
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold"
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
                      Guardando...
                    </>
                  ) : mode === 'document' ? (
                    'Subir Documento'
                  ) : (
                    'Agregar Enlace'
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

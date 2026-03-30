'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  content: string;
  date: string;
}

interface NoticiasEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function NoticiasEditor({ isAdmin, onRefresh }: NoticiasEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Noticia>({
    slug: '',
    title: '',
    description: '',
    image: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return null;

  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    // Aquí se procesaría la carga a Google Drive
    console.log('Imagen seleccionada:', file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Generar slug si está vacío
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Subir imagen a Google Drive si existe
      let imageUrl = formData.image;
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);
        formDataImage.append('type', 'noticia');
        
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataImage,
        });

        if (!uploadRes.ok) throw new Error('Error al subir imagen');
        const uploadedData = await uploadRes.json();
        imageUrl = uploadedData.url;
      }

      const response = await fetch('/api/admin/noticias', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          image: imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar noticia');
      }

      setSuccess('Noticia guardada correctamente');
      setFormData({
        slug: '',
        title: '',
        description: '',
        image: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
      });
      setImageFile(null);
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
      {/* Botón flotante para crear noticia */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-brand-brown hover:bg-brand-brown/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="hidden md:inline text-sm font-bold">Nueva Noticia</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-brand-brown text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Crear Nueva Noticia</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
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
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
                  placeholder="Título de la noticia"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Slug (vacío = auto-generado)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
                  placeholder="slug-de-noticia"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Descripción (resumen) *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
                  rows={3}
                  placeholder="Resumen de la noticia que aparecerá en la tarjeta"
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contenido *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
                  rows={6}
                  placeholder="Contenido completo de la noticia (puede incluir HTML)"
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Imagen de portada *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {imageFile ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{imageFile.name}</p>
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      required={!formData.image && !imageFile}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fecha de publicación
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
                />
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
                  className="flex-1 px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Noticia'
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

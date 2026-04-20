'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, Plus } from 'lucide-react';

interface GaleriaImagen {
  id: number;
  noticia_slug: string;
  image_url: string;
  alt_text?: string;
  caption?: string;
  order: number;
}

interface NoticiaGaleriaProps {
  slug?: string | null;
  onImageAdded?: () => void;
}

export function NoticiaGaleria({ slug, onImageAdded }: NoticiaGaleriaProps) {
  const [galeria, setGaleria] = useState<GaleriaImagen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (slug) {
      cargarGaleria();
    }
  }, [slug]);

  const cargarGaleria = async () => {
    if (!slug) return;
    try {
      const response = await fetch(`/api/admin/noticias/galeria/${slug}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al cargar galería');
      const data = await response.json();
      setGaleria(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando galería:', err);
    }
  };

  const handleAgregarImagen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!slug) {
      setError('Guarda la noticia primero antes de agregar imágenes a la galería');
      return;
    }

    if (!imageFile) {
      setError('Selecciona una imagen');
      return;
    }

    setIsLoading(true);
    try {
      // Subir imagen a Google Drive
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

      // Agregar a la galería
      const response = await fetch('/api/admin/noticias/galeria', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noticia_slug: slug,
          image_url: uploadedData.url,
          alt_text: altText || null,
          caption: caption || null,
          order: galeria.length + 1,
        }),
      });

      if (!response.ok) throw new Error('Error al agregar imagen');

      setImageFile(null);
      setAltText('');
      setCaption('');
      await cargarGaleria();
      onImageAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarImagen = async (id: number) => {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/noticias/galeria/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Error al eliminar');
      await cargarGaleria();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!slug) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-700">
        Guarda la noticia primero para agregar imágenes a la galería
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Galería de Imágenes</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Formulario para agregar imagen */}
      <form onSubmit={handleAgregarImagen} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Seleccionar Imagen
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Texto Alternativo
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Descripción para accesibilidad"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Pie de foto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !imageFile}
          className="w-full px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Plus size={16} />
              Agregar Imagen
            </>
          )}
        </button>
      </form>

      {/* Listado de imágenes */}
      {galeria.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {galeria.length} {galeria.length === 1 ? 'imagen' : 'imágenes'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {galeria.map((img) => (
              <div
                key={img.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || 'Galería'}
                  className="w-full h-32 object-cover"
                />
                {img.caption && (
                  <p className="text-xs p-2 text-gray-600 truncate">{img.caption}</p>
                )}
                <button
                  onClick={() => handleEliminarImagen(img.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Eliminar imagen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay imágenes en la galería aún</p>
      )}
    </div>
  );
}

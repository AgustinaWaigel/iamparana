'use client';

import { useEffect, useState } from 'react';
import { getGoogleDriveImageUrl } from '@/lib/drive-utils';

// Muestra la galería asociada a una noticia usando imágenes almacenadas en Drive.
interface GaleriaImagen {
  id: number;
  noticia_slug: string;
  image_url: string;
  alt_text?: string;
  caption?: string;
  order: number;
}

interface NoticiaGaleriaViewProps {
  slug: string;
}

export function NoticiaGaleriaView({ slug }: NoticiaGaleriaViewProps) {
  const [galeria, setGaleria] = useState<GaleriaImagen[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarGaleria = async () => {
      try {
        // La galería se carga desde la API específica de la noticia actual.
        const response = await fetch(`/api/noticias/${slug}/galeria`);
        if (response.ok) {
          const data = await response.json();
          setGaleria(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error cargando galería:', err);
      } finally {
        setIsLoading(false);
      }
    };

    cargarGaleria();
  }, [slug]);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />;
  }

  if (galeria.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">Galería</h3>
      <div className="grid grid-cols-1 gap-6">
        {galeria.map((img) => (
          <figure key={img.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <img
              src={getGoogleDriveImageUrl(img.image_url)}
              alt={img.alt_text || 'Galería de la noticia'}
              className="w-full h-auto object-contain bg-black/5"
              loading="lazy"
              decoding="async"
            />
            {img.caption && (
              <figcaption className="bg-gray-50 p-3 text-sm text-gray-700">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

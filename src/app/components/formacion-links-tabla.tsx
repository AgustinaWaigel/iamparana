'use client';

import { useState, useEffect, forwardRef } from 'react';
import { Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';

interface Link {
  id: number;
  section: string;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  created_by_user_id: number;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface FormacionLinksTablaProps {
  // Sin props
}

export const FormacionLinksTabla = forwardRef<() => Promise<void>, FormacionLinksTablaProps>(
  function FormacionLinksTabla(props, ref) {
    const [links, setLinks] = useState<Link[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = useSession();

    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/admin/links?section=formacion', {
          credentials: 'include',
        });

        if (response.status === 401) {
          console.log('No authenticated, skipping links');
          setLinks([]);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error ${response.status}:`, errorText);
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log('Links fetched:', data);
        setLinks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching links:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar enlaces');
        setLinks([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = fetchLinks;
    }

    useEffect(() => {
      console.log('FormacionLinksTabla mounted, fetching links');
      fetchLinks();
    }, []);

    const handleDelete = async (id: number) => {
      if (!confirm('¿Estás seguro de que querés eliminar este enlace?')) {
        return;
      }

      try {
        const response = await fetch(`/api/admin/links?id=${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Error al eliminar enlace');
        }

        setLinks(links.filter((link) => link.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar');
      }
    };

    if (error) {
      return (
        <div className="col-span-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Error al cargar enlaces</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="col-span-full">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center text-blue-700">
            <p className="mb-2">⏳ Cargando enlaces...</p>
            <p className="text-sm text-blue-600">Esto puede tomar un momento</p>
          </div>
        </div>
      );
    }

    if (links.length === 0) {
      return (
        <div className="col-span-full">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center text-gray-500">
            <p className="text-lg mb-1">🔗 No hay enlaces aún</p>
            <p className="text-sm">Los enlaces compartidos aparecerán aquí</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {links.map((link) => (
          <div
            key={link.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-blue-400 overflow-hidden group relative"
          >
            <div className="bg-gradient-to-r from-blue-300 to-blue-400 h-36 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-6xl">{link.icon || '🔗'}</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-brand-brown mb-3 line-clamp-2">
                {link.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm line-clamp-2 min-h-10">
                {link.description || 'Enlace a recurso externo'}
              </p>
              
              {/* URL */}
              {link.url && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Enlace:</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {link.url}
                  </a>
                </div>
              )}

              <div className="flex gap-2">
                {link.url && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-6 py-2 bg-blue-300 text-black font-bold rounded-lg hover:bg-blue-400 transition-colors no-underline text-center flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Visitar
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                    title="Eliminar enlace"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
);

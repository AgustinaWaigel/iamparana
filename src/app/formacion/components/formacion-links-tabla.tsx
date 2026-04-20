'use client';

import { useState, useEffect, useMemo, forwardRef } from 'react';
import { Trash2, AlertCircle, ExternalLink, CalendarDays, Link as LinkIcon, Search } from 'lucide-react';
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

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible';
  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Enlace externo';
  }
}

function getDomainFilter(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'otros';
  }
}

export const FormacionLinksTabla = forwardRef<() => Promise<void>, FormacionLinksTablaProps>(
  function FormacionLinksTabla(props, ref) {
    const [links, setLinks] = useState<Link[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = useSession();

    const domainOptions = useMemo(() => {
      const values = new Set<string>();
      for (const link of links) {
        values.add(getDomainFilter(link.url));
      }
      return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
    }, [links]);

    const filteredLinks = useMemo(() => {
      const term = searchTerm.trim().toLowerCase();
      return links.filter((link) => {
        const domain = getDomainFilter(link.url);
        const matchesDomain = selectedDomain === 'all' || domain === selectedDomain;
        const matchesTerm =
          term.length === 0 ||
          link.title.toLowerCase().includes(term) ||
          (link.description || '').toLowerCase().includes(term) ||
          link.url.toLowerCase().includes(term);
        return matchesDomain && matchesTerm;
      });
    }, [links, searchTerm, selectedDomain]);

    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/links?section=formacion');

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error ${response.status}:`, errorText);
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
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
        <div className="col-span-full mb-1 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white/80 p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por titulo, descripcion o URL..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {domainOptions.map((domain) => {
              const isActive = selectedDomain === domain;
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setSelectedDomain(domain)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {domain === 'all' ? 'Todos' : domain}
                </button>
              );
            })}
          </div>
        </div>

        {filteredLinks.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm text-blue-800">
            No encontramos enlaces con esos filtros.
          </div>
        )}

        {filteredLinks.map((link) => (
          <article
            key={link.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-100 via-blue-50 to-white px-4 py-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-800 shadow-sm">
                <LinkIcon size={14} />
                Enlace
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 line-clamp-1">
                {getDomainLabel(link.url)}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-xl leading-none">
                  {link.icon || '🔗'}
                </span>
                <h3 className="line-clamp-2 text-lg md:text-xl font-black leading-tight text-brand-brown">
                  {link.title}
                </h3>
              </div>

              <p className="mb-4 line-clamp-3 min-h-14 text-sm leading-relaxed text-gray-600">
                {link.description || 'Enlace a recurso externo de formacion.'}
              </p>

              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                <CalendarDays size={14} className="text-blue-700" />
                {formatDate(link.created_at)}
              </div>

              <div className="mt-auto flex gap-2">
                {link.url && (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-400 px-4 py-2.5 text-center text-sm font-bold text-black no-underline transition-colors hover:bg-blue-500"
                  >
                    <ExternalLink size={16} />
                    Visitar
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-600 transition-colors hover:bg-red-100"
                    title="Eliminar enlace"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </>
    );
  }
);

'use client';

import { useState, useEffect, useMemo, forwardRef } from 'react';
import { Trash2, AlertCircle, Download, CalendarDays, HardDrive, FileText, Search } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';

interface Document {
  id: number;
  section: string;
  title: string;
  description: string | null;
  google_drive_id: string;
  google_drive_url: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by_user_id: number;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface FormacionDocumentosTablaProps {
  // Sin props
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return 'Tamano no disponible';
  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
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

export const FormacionDocumentosTabla = forwardRef<() => Promise<void>, FormacionDocumentosTablaProps>(
  function FormacionDocumentosTabla(props, ref) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = useSession();

    const typeOptions = useMemo(() => {
      const values = new Set<string>();
      for (const doc of documents) {
        if (doc.file_type?.trim()) values.add(doc.file_type.trim());
      }
      return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
    }, [documents]);

    const filteredDocuments = useMemo(() => {
      const term = searchTerm.trim().toLowerCase();
      return documents.filter((doc) => {
        const matchesType = selectedType === 'all' || doc.file_type === selectedType;
        const matchesTerm =
          term.length === 0 ||
          doc.title.toLowerCase().includes(term) ||
          (doc.description || '').toLowerCase().includes(term);
        return matchesType && matchesTerm;
      });
    }, [documents, searchTerm, selectedType]);

    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/documentos?sections=formacion,temario,carta,otro');

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error ${response.status}:`, errorText);
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar documentos');
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = fetchDocuments;
    }

    useEffect(() => {
      fetchDocuments();
    }, []);

    const handleDelete = async (id: number) => {
      if (!confirm('¿Estás seguro de que querés eliminar este documento?')) {
        return;
      }

      try {
        const response = await fetch(`/api/admin/documentos?id=${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Error al eliminar documento');
        }

        setDocuments(documents.filter((doc) => doc.id !== id));
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
              <p className="font-semibold">Error al cargar documentos</p>
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
            <p className="mb-2">⏳ Cargando documentos...</p>
            <p className="text-sm text-blue-600">Esto puede tomar un momento</p>
          </div>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="col-span-full">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center text-gray-500">
            <p className="text-lg mb-1">📭 No hay documentos aún</p>
            <p className="text-sm">Los documentos compartidos aparecerán aquí</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="col-span-full mb-1 flex flex-col gap-3 rounded-2xl border border-green-100 bg-white/80 p-4">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por titulo o descripcion..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((type) => {
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  {type === 'all' ? 'Todos' : type}
                </button>
              );
            })}
          </div>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-green-200 bg-green-50/60 p-6 text-center text-sm text-green-800">
            No encontramos documentos con esos filtros.
          </div>
        )}

        {filteredDocuments.map((doc) => (
          <article
            key={doc.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-green-100 bg-gradient-to-r from-green-100 via-green-50 to-white px-4 py-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-800 shadow-sm">
                <FileText size={14} />
                Documento
              </div>
              <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {doc.file_type || 'Archivo'}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="mb-2 line-clamp-2 text-lg md:text-xl font-black leading-tight text-brand-brown">
                {doc.title}
              </h3>
              <p className="mb-4 line-clamp-3 min-h-14 text-sm leading-relaxed text-gray-600">
                {doc.description || 'Documento de formacion compartido por el equipo.'}
              </p>

              <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                  <CalendarDays size={14} className="text-green-700" />
                  {formatDate(doc.created_at)}
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                  <HardDrive size={14} className="text-green-700" />
                  {formatFileSize(doc.file_size)}
                </div>
              </div>

              <div className="mt-auto flex gap-2">
                {doc.google_drive_url && (
                  <a
                    href={doc.google_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-400 px-4 py-2.5 text-center text-sm font-bold text-black no-underline transition-colors hover:bg-green-500"
                  >
                    <Download size={16} />
                    Descargar
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-600 transition-colors hover:bg-red-100"
                    title="Eliminar documento"
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

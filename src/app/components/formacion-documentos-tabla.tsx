'use client';

import { useState, useEffect, forwardRef } from 'react';
import { Trash2, FileText, AlertCircle } from 'lucide-react';
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

export const FormacionDocumentosTabla = forwardRef<() => Promise<void>, {}>(
  function FormacionDocumentosTabla(props, ref) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = useSession();

    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/admin/documentos?section=formacion', {
          credentials: 'include',
        });

        if (response.status === 401) {
          console.log('No authenticated, skipping documents');
          setDocuments([]);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error ${response.status}:`, errorText);
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log('Documents fetched:', data);
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
      console.log('FormacionDocumentosTabla mounted, fetching documents');
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
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-l-4 border-green-400 overflow-hidden group relative"
          >
            <div className="bg-gradient-to-r from-green-300 to-green-400 h-36 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-6xl">📄</span>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-brand-brown mb-3 line-clamp-2">
                {doc.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm line-clamp-2 min-h-10">
                {doc.description || 'Documento de formación'}
              </p>
              
              {/* Link del Google Drive */}
              {doc.google_drive_url && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Link:</p>
                  <a
                    href={doc.google_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {doc.google_drive_url}
                  </a>
                </div>
              )}

              <div className="flex gap-2">
                {doc.google_drive_url && (
                  <a
                    href={doc.google_drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-6 py-2 bg-green-300 text-black font-bold rounded-lg hover:bg-green-400 transition-colors no-underline text-center"
                  >
                    Descargar →
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                    title="Eliminar documento"
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

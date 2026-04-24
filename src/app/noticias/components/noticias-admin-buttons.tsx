'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/app/hooks/use-session';

// Controles rápidos que aparecen sobre cada noticia para administradores.
interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

interface NoticiasAdminButtonsProps {
  noticia: Noticia;
}

export function NoticiasAdminButtons({ noticia }: NoticiasAdminButtonsProps) {
  const { isAdmin } = useSession();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAdmin) return null;

  const handleEdit = () => {
    if (typeof window !== 'undefined' && (window as any).__noticiasApp) {
      (window as any).__noticiasApp.editNoticia(noticia);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).__noticiasApp) {
        await (window as any).__noticiasApp.deleteNoticia(noticia.slug);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
      {/* Acciones de Admin para la Sección */}
      <button
        onClick={handleEdit}
        className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
        title="Editar"
      >
        <Pencil size={18} />
      </button>
      <div className="relative">
        <button
          onClick={() => setDeleteConfirm(!deleteConfirm)}
          className="p-2 hover:bg-red-50 rounded-full text-stone-400 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
        {deleteConfirm && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-red-300 rounded-lg p-3 shadow-lg z-30 whitespace-nowrap">
            <p className="text-sm font-bold text-gray-700 mb-2">¿Eliminar?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

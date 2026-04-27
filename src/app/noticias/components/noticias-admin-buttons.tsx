'use client';

import { useState } from 'react';
import { useSession } from '@/app/hooks/use-session';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';
import { AdminActionButton } from '@/app/components/common/admin-action-button';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
      <AdminActionButton
        action="edit"
        onClick={handleEdit}
        compact
      />
      <AdminActionButton
        action="delete"
        onClick={() => setDeleteConfirm(true)}
        compact
      />
      <DeleteConfirmModal
        isOpen={deleteConfirm}
        title="Eliminar noticia"
        itemName={noticia.title}
        busy={isDeleting}
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={() => {
          handleDelete().catch(() => undefined);
        }}
      />
    </div>
  );
}

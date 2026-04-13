'use client';

import { useCallback, ReactNode, useState, useEffect } from 'react';
import { NoticiasEditor } from './noticias-editor';
import { NoticiasAdminButtons } from './noticias-admin-buttons';
import { useSession } from '@/app/hooks/use-session';

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

interface NoticiasClientProps {
  children: ReactNode;
  noticias?: Noticia[];
}

export function NoticiasClient({ children, noticias = [] }: NoticiasClientProps) {
  const { isAdmin, isLoading } = useSession();
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [showGlobalEditor, setShowGlobalEditor] = useState(false);

  // Exponer una variable global para que el componente de botones pueda llamarla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__noticiasApp = {
        editNoticia: (noticia: Noticia) => {
          setEditingNoticia(noticia);
          setShowGlobalEditor(true);
        },
        deleteNoticia: async (slug: string) => {
          const response = await fetch(`/api/admin/noticias/${slug}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Error al eliminar');
          window.location.reload();
        },
      };
    }
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  if (isLoading) {
    return children;
  }

  return (
    <>
      {children}
      <NoticiasEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

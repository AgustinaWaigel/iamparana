'use client';

import { useCallback, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NoticiasEditor } from './noticias-editor';
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
  const router = useRouter();
  const { isAdmin, isLoading } = useSession();
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);

  // Exponer una variable global para que el componente de botones pueda llamarla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__noticiasApp = {
        editNoticia: (noticia: Noticia) => {
          setEditingNoticia({ ...noticia });
        },
        deleteNoticia: async (slug: string) => {
          const response = await fetch(`/api/admin/noticias/${slug}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Error al eliminar');
          router.refresh();
        },
      };
    }
  }, [router]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  if (isLoading) {
    return children;
  }

  return (
    <>
      {children}
      <NoticiasEditor isAdmin={isAdmin} onRefresh={handleRefresh} editingNoticia={editingNoticia} />
    </>
  );
}

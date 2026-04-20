'use client';

import { useEffect, useState } from 'react';
import { AnimacionEditor } from './animacion-editor';

// Este bloque arma el contenido principal de Animación y habilita edición solo para admins.
interface AnimacionContent {
  id: number;
  title: string;
  description: string;
  content: string | null;
}

export function AnimacionClientContent() {
  const [content, setContent] = useState<AnimacionContent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
    checkAdmin();
  }, []);

  const fetchContent = async () => {
    try {
      // Trae el contenido editorial que se muestra en la página pública de Animación.
      const response = await fetch('/api/admin/animacion', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al cargar');
      const data = await response.json();
      setContent(data);
    } catch (err) {
      console.error('Error cargando contenido:', err);
      // Usar contenido por defecto
      setContent({
        id: 0,
        title: 'Animación',
        description: 'Cantar, bailar, jugar. Parte de nuestro día a día en la IAM es esto, por eso venimos a ayudarte con recursos para tus encuentros, y con el día a día. Acá vas a poder encontrar las canciones que cantamos siempre en la IAM y también muchos juegos y dinámicas que te van a servir. ¡A jugar y a bailar!',
        content: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAdmin = async () => {
    try {
      // Consulta la sesión para decidir si se debe mostrar el editor flotante.
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.status === 401) {
        setIsAdmin(false);
        return;
      }
      const data = await response.json();
      // Verificar si es admin (puede ser "admin" o role_id 1)
      setIsAdmin(data?.role === 'admin' || data?.role === 1);
    } catch {
      setIsAdmin(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <>
      <p className="text-lg text-gray-700 mb-6">
        {content?.description || 'Cantar, bailar, jugar. Parte de nuestro día a día...'}
      </p>
      
      {content?.content && (
        <div className="text-gray-600 mb-6 p-4 bg-gray-50 rounded-lg">
          {content.content}
        </div>
      )}

      <AnimacionEditor isAdmin={isAdmin} onRefresh={fetchContent} />
    </>
  );
}

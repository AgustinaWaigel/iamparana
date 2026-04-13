'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Loader2, Edit2, Trash2 } from 'lucide-react';

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  content: string;
  date: string;
}

interface NoticiasEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function NoticiasEditor({ isAdmin, onRefresh }: NoticiasEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [noticiasExistentes, setNoticiasExistentes] = useState<Noticia[]>([]);
  const [cargandoNoticias, setCargandoNoticias] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Noticia>({
    slug: '',
    title: '',
    description: '',
    image: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar noticias existentes cuando se abre el modal
  useEffect(() => {
    if (isAdmin && isOpen && !showList && noticiasExistentes.length === 0) {
      cargarNoticiasExistentes();
    }
  }, [isAdmin, isOpen, showList, noticiasExistentes.length]);

  if (!isAdmin) return null;

  const cargarNoticiasExistentes = async () => {
    setCargandoNoticias(true);
    try {
      const response = await fetch('/api/admin/noticias', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al cargar noticias');
      const noticias = await response.json();
      setNoticiasExistentes(noticias);
    } catch (err) {
      console.error('Error cargando noticias:', err);
    } finally {
      setCargandoNoticias(false);
    }
  };

  const handleEditarNoticia = (noticia: Noticia) => {
    setFormData(noticia);
    setEditingSlug(noticia.slug);
    setShowList(false);
    setImageFile(null);
  };

  const handleEliminar = async (slug: string) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/noticias/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar noticia');
      }

      setSuccess('Noticia eliminada correctamente');
      setDeleteConfirm(null);
      await cargarNoticiasExistentes();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    console.log('Imagen seleccionada:', file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Generar slug si está vacío (solo en creación)
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Subir imagen a Google Drive si existe archivo nuevo
      let imageUrl = formData.image;
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('file', imageFile);
        formDataImage.append('type', 'noticia');
        
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataImage,
        });

        if (!uploadRes.ok) throw new Error('Error al subir imagen');
        const uploadedData = await uploadRes.json();
        imageUrl = uploadedData.url;
      }

      const payload = {
        ...formData,
        slug: editingSlug || slug,
        image: imageUrl,
      };

      const method = editingSlug ? 'PUT' : 'POST';
      const url = editingSlug ? `/api/admin/noticias/${editingSlug}` : '/api/admin/noticias';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar noticia');
      }

      setSuccess(editingSlug ? 'Noticia actualizada correctamente' : 'Noticia guardada correctamente');
      setFormData({
        slug: '',
        title: '',
        description: '',
        image: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
      });
      setImageFile(null);
      setEditingSlug(null);
      
      // Recargar lista de noticias
      await cargarNoticiasExistentes();
      
      // Cerrar modal después de 1.5 segundos
      setTimeout(() => {
        setIsOpen(false);
        setShowList(false);
      }, 1500);
      
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const cerrarModal = () => {
    setIsOpen(false);
    setShowList(false);
    setEditingSlug(null);
    setDeleteConfirm(null);
    setFormData({
      slug: '',
      title: '',
      description: '',
      image: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setError('');
    setSuccess('');
  };

  const abrirModal = (lista: boolean = false) => {
    setEditingSlug(null);
    setShowList(lista);
    setFormData({
      slug: '',
      title: '',
      description: '',
      image: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setError('');
    setSuccess('');
    setIsOpen(true);
  };

  return (
    <>
      {/* Botón flotante para crear noticia */}
      <button
        onClick={() => abrirModal(false)}
        className="fixed bottom-8 right-8 bg-brand-brown hover:bg-brand-brown/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="hidden md:inline text-sm font-bold">Nueva Noticia</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[101] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            {/* Header */}
            <div className="sticky top-0 bg-brand-brown text-white p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">
                {showList ? 'Noticias Existentes' : editingSlug ? 'Editar Noticia' : 'Crear Nueva Noticia'}
              </h2>
              <div className="flex gap-2">
                {(showList || editingSlug) && (
                  <button
                    onClick={() => {
                      setShowList(false);
                      setEditingSlug(null);
                      setFormData({
                        slug: '',
                        title: '',
                        description: '',
                        image: '',
                        content: '',
                        date: new Date().toISOString().split('T')[0],
                      });
                      setImageFile(null);
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors text-sm font-bold px-2"
                  >
                    ← Atrás
                  </button>
                )}
                <button
                  onClick={cerrarModal}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              {showList ? renderListaNoticias() : renderFormulario()}
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderListaNoticias() {
    if (cargandoNoticias) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin text-brand-brown" />
        </div>
      );
    }

    if (noticiasExistentes.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay noticias creadas aún</p>
          <button
            onClick={() => setShowList(false)}
            className="mt-4 px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90"
          >
            Crear Primera Noticia
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {noticiasExistentes.map((noticia) => (
          <div
            key={noticia.slug}
            className="border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:bg-gray-50 transition-colors relative"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-brand-brown truncate">{noticia.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{noticia.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(noticia.date).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button
                onClick={() => handleEditarNoticia(noticia)}
                className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setDeleteConfirm(deleteConfirm === noticia.slug ? null : noticia.slug)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
                {deleteConfirm === noticia.slug && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-red-300 rounded-lg p-3 shadow-lg z-20 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      ¿Confirmar eliminar?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEliminar(noticia.slug)}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderFormulario() {
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
            {success}
          </div>
        )}

        {/* Botón para ver noticias existentes (solo en creación) */}
        {!editingSlug && (
          <button
            type="button"
            onClick={() => setShowList(true)}
            className="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold"
          >
            Ver Noticias Existentes
          </button>
        )}

        {/* Título */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
            placeholder="Título de la noticia"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Slug {editingSlug && '(no editable en actualizaciones)'}
          </label>
          <input
            type="text"
            disabled={!!editingSlug}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown disabled:bg-gray-100"
            placeholder="slug-de-noticia (vacío = auto-generado)"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Descripción (resumen) *
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
            rows={3}
            placeholder="Resumen de la noticia que aparecerá en la tarjeta"
          />
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Contenido *
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
            rows={6}
            placeholder="Contenido completo de la noticia (puede incluir HTML)"
          />
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Imagen de portada {!editingSlug && '*'}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            {imageFile || (editingSlug && formData.image) ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  {imageFile ? imageFile.name : 'Imagen actual cargada'}
                </p>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <input
                type="file"
                required={!editingSlug && !formData.image && !imageFile}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Fecha de publicación
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              if (editingSlug) {
                setEditingSlug(null);
                setFormData({
                  slug: '',
                  title: '',
                  description: '',
                  image: '',
                  content: '',
                  date: new Date().toISOString().split('T')[0],
                });
                setImageFile(null);
              } else {
                cerrarModal();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {editingSlug ? 'Cancelar Edición' : 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-brand-brown text-white rounded-lg hover:bg-brand-brown/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {editingSlug ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : editingSlug ? (
              'Actualizar Noticia'
            ) : (
              'Guardar Noticia'
            )}
          </button>
        </div>
      </form>
    );
  }
}

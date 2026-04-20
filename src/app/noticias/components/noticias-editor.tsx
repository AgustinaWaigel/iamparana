'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X, Loader2, Edit2, Trash2, Type, Image as ImageIcon } from 'lucide-react';
import { NoticiaGaleria } from './noticia-galeria';

// Tipo para los bloques de contenido dinámico
interface BloqueContenido {
  id: string;
  type: 'text' | 'image';
  value: string; // Texto o URL de la imagen
  file?: File;    // Para subidas nuevas
}

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  content: string; // Guardaremos el JSON de los bloques aquí
  date: string;
}

type NoticiaResumen = Pick<Noticia, 'slug' | 'title' | 'description' | 'image' | 'date'>;

interface NoticiasEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
  editingNoticia?: NoticiaResumen | null;
}

export function NoticiasEditor({ isAdmin, onRefresh, editingNoticia }: NoticiasEditorProps) {
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
  const [bloques, setBloques] = useState<BloqueContenido[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const textareasRef = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (isAdmin && isOpen && !showList && noticiasExistentes.length === 0) {
      cargarNoticiasExistentes();
    }
  }, [isAdmin, isOpen, showList, noticiasExistentes.length]);

  const cargarNoticiasExistentes = async () => {
    setCargandoNoticias(true);
    try {
      const response = await fetch('/api/admin/noticias', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar noticias');
      const noticias = await response.json();
      setNoticiasExistentes(noticias);
    } catch (err) {
      console.error('Error cargando noticias:', err);
    } finally {
      setCargandoNoticias(false);
    }
  };

  // --- Manejo de Bloques ---
  const agregarBloque = (tipo: 'text' | 'image') => {
    const nuevo: BloqueContenido = {
      id: Math.random().toString(36).substr(2, 9),
      type: tipo,
      value: ''
    };
    setBloques([...bloques, nuevo]);
  };

  const actualizarBloque = (id: string, valor: string, file?: File) => {
    setBloques(bloques.map(b => b.id === id ? { ...b, value: valor, file } : b));
  };

  const eliminarBloque = (id: string) => {
    setBloques(bloques.filter(b => b.id !== id));
  };

  const aplicarFormato = (blockId: string, format: 'bold' | 'italic' | 'underline') => {
    const textarea = textareasRef.current[blockId];
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd) || 'texto';

    const wrappedText =
      format === 'bold'
        ? `**${selectedText}**`
        : format === 'italic'
          ? `*${selectedText}*`
          : `<u>${selectedText}</u>`;

    const nextValue =
      value.slice(0, selectionStart) + wrappedText + value.slice(selectionEnd);

    actualizarBloque(blockId, nextValue);

    requestAnimationFrame(() => {
      const ref = textareasRef.current[blockId];
      if (!ref) return;
      ref.focus();
      const cursorPosition = selectionStart + wrappedText.length;
      ref.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleEditarNoticia = (noticia: Noticia) => {
    setFormData(noticia);
    setEditingSlug(noticia.slug);
    
    // Intentar cargar bloques desde el JSON del contenido
    try {
      const contenidoParseado = JSON.parse(noticia.content);
      setBloques(Array.isArray(contenidoParseado) ? contenidoParseado : []);
    } catch (e) {
      // Si el contenido no era JSON (era texto plano viejo), convertirlo en un bloque de texto
      setBloques([{ id: 'default', type: 'text', value: noticia.content }]);
    }
    
    setShowList(false);
    setImageFile(null);
  };

  useEffect(() => {
    if (editingNoticia) {
      setIsOpen(true);
    }
  }, [editingNoticia]);

  useEffect(() => {
    if (!editingNoticia || noticiasExistentes.length === 0) {
      return;
    }

    const noticiaCompleta = noticiasExistentes.find((item) => item.slug === editingNoticia.slug);
    if (noticiaCompleta) {
      handleEditarNoticia(noticiaCompleta);
    }
  }, [editingNoticia, noticiasExistentes]);

  const handleEliminar = async (slug: string) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/noticias/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al eliminar noticia');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // 1. Generar slug automáticamente si no estamos editando
      const slug = editingSlug || formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // 2. Subir imagen de portada principal
      let imageUrl = formData.image;
      if (imageFile) {
        const fdPort = new FormData();
        fdPort.append('file', imageFile);
        fdPort.append('type', 'noticia');
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fdPort });
        const data = await res.json();
        imageUrl = data.url;
      }

      // 3. Procesar y subir imágenes de los bloques del cuerpo
      const bloquesProcesados = await Promise.all(bloques.map(async (b) => {
        if (b.type === 'image' && b.file) {
          const fdBlock = new FormData();
          fdBlock.append('file', b.file);
          fdBlock.append('type', 'noticia-cuerpo');
          const res = await fetch('/api/admin/upload', { method: 'POST', body: fdBlock });
          const data = await res.json();
          return { id: b.id, type: b.type, value: data.url };
        }
        return { id: b.id, type: b.type, value: b.value };
      }));

      // 4. Armar Payload
      const payload = {
        ...formData,
        slug,
        image: imageUrl,
        content: JSON.stringify(bloquesProcesados),
      };

      const method = editingSlug ? 'PUT' : 'POST';
      const url = editingSlug ? `/api/admin/noticias/${editingSlug}` : '/api/admin/noticias';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al guardar la noticia');

      setSuccess('Noticia guardada con éxito');
      setTimeout(() => cerrarModal(), 1500);
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
    setBloques([]);
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

  const abrirModal = (lista = false) => {
    setEditingSlug(null);
    setBloques([]);
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

  function renderListaNoticias() {
    if (cargandoNoticias) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-brown" /></div>;
    
    return (
      <div className="space-y-3">
        {noticiasExistentes.length === 0 ? (
          <p className="text-center text-gray-500">No hay noticias</p>
        ) : (
          noticiasExistentes.map((n) => (
            <div key={n.slug} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50">
              <div className="flex-1 truncate mr-4">
                <h3 className="font-bold text-brand-brown truncate">{n.title}</h3>
                <p className="text-xs text-gray-400">{new Date(n.date).toLocaleDateString('es-AR')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditarNoticia(n)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={18} /></button>
                <button onClick={() => setDeleteConfirm(n.slug)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
              </div>
              {deleteConfirm === n.slug && (
                <div className="absolute right-4 bg-white border p-3 rounded-lg shadow-xl z-20">
                  <p className="text-xs font-bold mb-2">¿Eliminar definitivamente?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEliminar(n.slug)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Sí</button>
                    <button onClick={() => setDeleteConfirm(null)} className="bg-gray-200 px-2 py-1 rounded text-xs">No</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  function renderFormulario() {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">{success}</div>}

        {!editingSlug && (
          <button type="button" onClick={() => setShowList(true)} className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
            Ver Noticias Existentes
          </button>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Resumen para tarjeta *</label>
          <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={2} />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border">
          <label className="block text-sm font-bold text-gray-700 mb-2">Imagen de Portada</label>
          <input type="file" onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])} className="text-sm w-full" />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-brand-brown border-b pb-1">Contenido Dinámico</label>
          {bloques.map((b) => (
            <div key={b.id} className="relative p-4 border rounded-lg bg-white group shadow-sm">
              <button type="button" onClick={() => eliminarBloque(b.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14}/></button>
              
              {b.type === 'text' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <button
                      type="button"
                      onClick={() => aplicarFormato(b.id, 'bold')}
                      className="px-2 py-1 text-xs font-bold rounded bg-gray-100 hover:bg-gray-200"
                      title="Negrita"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarFormato(b.id, 'italic')}
                      className="px-2 py-1 text-xs italic rounded bg-gray-100 hover:bg-gray-200"
                      title="Cursiva"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarFormato(b.id, 'underline')}
                      className="px-2 py-1 text-xs underline rounded bg-gray-100 hover:bg-gray-200"
                      title="Subrayado"
                    >
                      U
                    </button>
                    <span className="text-xs text-gray-500 ml-2">
                      Seleccioná texto y aplicá formato
                    </span>
                  </div>

                  <textarea
                    ref={(el) => {
                      textareasRef.current[b.id] = el;
                    }}
                    placeholder="Escribe texto o Markdown..."
                    className="w-full p-2 border-none focus:ring-0 min-h-[100px] text-sm"
                    value={b.value}
                    onChange={(e) => actualizarBloque(b.id, e.target.value)}
                  />
                </div>
              ) : (
                <div className="text-center">
                  {b.value && <img src={b.value} className="h-24 mx-auto mb-2 rounded" alt="preview" />}
                  <input type="file" className="text-xs" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if(f) actualizarBloque(b.id, URL.createObjectURL(f), f);
                  }} />
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-4 justify-center py-4 border-2 border-dashed rounded-lg">
            <button type="button" onClick={() => agregarBloque('text')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-brand-brown hover:text-white rounded-full transition-colors text-xs font-bold">
              <Type size={16} /> + Texto
            </button>
            <button type="button" onClick={() => agregarBloque('image')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-brand-brown hover:text-white rounded-full transition-colors text-xs font-bold">
              <ImageIcon size={16} /> + Imagen
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
          <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <button type="submit" disabled={isLoading} className="w-full py-3 bg-brand-brown text-white rounded-lg font-bold disabled:opacity-50">
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : editingSlug ? 'Actualizar Noticia' : 'Publicar Noticia'}
        </button>
      </form>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <button onClick={() => abrirModal(false)} className="fixed bottom-8 right-8 bg-brand-brown text-white p-4 rounded-full shadow-lg z-40 flex items-center gap-2">
        <Plus size={24} /> <span className="hidden md:inline text-sm font-bold">Nueva Noticia</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[101] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl">
            <div className="sticky top-0 bg-brand-brown text-white p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">{showList ? 'Noticias Existentes' : editingSlug ? 'Editar Noticia' : 'Crear Noticia'}</h2>
              <div className="flex gap-2">
                {(showList || editingSlug) && (
                  <button onClick={() => { setShowList(false); setEditingSlug(null); setBloques([]); }} className="p-1 hover:bg-white/20 rounded font-bold px-2 text-sm">← Atrás</button>
                )}
                <button onClick={cerrarModal} className="p-1 hover:bg-white/20 rounded"><X size={24} /></button>
              </div>
            </div>
            <div className="p-6">{showList ? renderListaNoticias() : renderFormulario()}</div>
          </div>
        </div>
      )}
    </>
  );
}
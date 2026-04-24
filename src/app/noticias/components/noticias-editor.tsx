'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Plus, X, Loader2, Edit2, Trash2, Type, Image as ImageIcon, 
  ChevronLeft, Save, Calendar, FileText, Layout, Bold, Italic, Underline, AlertCircle
} from 'lucide-react';

interface BloqueContenido {
  id: string;
  type: 'text' | 'image';
  value: string;
  file?: File;
}

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  content: string;
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
  }, [isAdmin, isOpen, showList]);

  const cargarNoticiasExistentes = async () => {
    setCargandoNoticias(true);
    try {
      const response = await fetch('/api/admin/noticias', { credentials: 'include' });
      
      if (!response.ok) {
        // Esto te dirá si es 401 (no logueado), 404 (no existe) o 500 (error db)
        const errorMsg = `Error ${response.status}: No se pudo cargar la lista`;
        throw new Error(errorMsg);
      }

      const noticias = await response.json();
      setNoticiasExistentes(noticias);
    } catch (err: any) {
      console.error("Detalle del error:", err);
      setError(err.message); // Muestra el error en la UI para saber qué arreglar
    } finally {
      setCargandoNoticias(false);
    }
  };

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
    const wrappedText = format === 'bold' ? `**${selectedText}**` : format === 'italic' ? `*${selectedText}*` : `<u>${selectedText}</u>`;
    const nextValue = value.slice(0, selectionStart) + wrappedText + value.slice(selectionEnd);
    actualizarBloque(blockId, nextValue);
  };

  const handleEditarNoticia = (noticia: Noticia) => {
    setFormData(noticia);
    setEditingSlug(noticia.slug);
    try {
      const contenidoParseado = JSON.parse(noticia.content);
      setBloques(Array.isArray(contenidoParseado) ? contenidoParseado : []);
    } catch (e) {
      setBloques([{ id: 'default', type: 'text', value: noticia.content }]);
    }
    setShowList(false);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);
    try {
      const slug = editingSlug || formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let imageUrl = formData.image;
      if (imageFile) {
        const fdPort = new FormData();
        fdPort.append('file', imageFile);
        fdPort.append('type', 'noticia');
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fdPort });
        const data = await res.json();
        imageUrl = data.url;
      }
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
      const payload = { ...formData, slug, image: imageUrl, content: JSON.stringify(bloquesProcesados) };
      const method = editingSlug ? 'PUT' : 'POST';
      const url = editingSlug ? `/api/admin/noticias/${editingSlug}` : '/api/admin/noticias';
      const response = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Error al guardar');
      setSuccess('Noticia publicada con éxito');
      setTimeout(() => cerrarModal(), 1500);
      onRefresh?.();
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  const cerrarModal = () => {
    setIsOpen(false);
    setShowList(false);
    setEditingSlug(null);
    setBloques([]);
    setImageFile(null);
  };

  const inputClass = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 mb-1.5";

  if (!isAdmin) return null;

  return (
    <>
      <button onClick={() => { setShowList(false); setEditingSlug(null); setIsOpen(true); }} className="fixed bottom-8 right-8 bg-brand-brown hover:bg-amber-900 text-white p-4 rounded-full shadow-xl z-[45] flex items-center gap-2 group transition-all hover:-translate-y-1">
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="hidden md:inline text-sm font-bold pr-2">Nueva Noticia</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transform transition-all">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3 text-brand-brown">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100">
                  <FileText size={22} />
                </div>
                <h2 className="text-xl font-black">
                  {showList ? 'Noticias' : editingSlug ? 'Editar Noticia' : 'Crear Noticia'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {(showList || editingSlug) && (
                  <button onClick={() => { setShowList(!showList); setEditingSlug(null); }} className="p-2 text-stone-400 hover:text-brand-brown hover:bg-stone-100 rounded-full transition-all">
                    {showList ? <Plus size={20}/> : <Layout size={20}/>}
                  </button>
                )}
                <button onClick={cerrarModal} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {showList ? (
                <div className="space-y-3">
                  {cargandoNoticias ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-brown" /></div>
                  ) : noticiasExistentes.map(n => (
                    <div key={n.slug} className="group flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-white hover:border-yellow-200 transition-all">
                      <div className="flex-1 truncate mr-4">
                        <h3 className="font-black text-brand-brown truncate">{n.title}</h3>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{new Date(n.date).toLocaleDateString('es-AR')}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditarNoticia(n)} className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteConfirm(n.slug)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-100 flex gap-2"><AlertCircle size={18}/>{error}</div>}
                  {success && <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-bold border border-green-100 flex gap-2"><ImageIcon size={18}/>{success}</div>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Título de la Noticia *</label>
                      <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="Ej: Crónica del último campamento" />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className={labelClass}>Resumen corto (Tarjeta)</label>
                      <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} resize-none`} rows={2} placeholder="Breve texto para la lista de noticias..." />
                    </div>

                    <div>
                      <label className={labelClass}>Fecha de Publicación</label>
                      <div className="relative">
                        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Portada Principal</label>
                      <div className="relative group h-[50px]">
                        <div className="absolute inset-0 rounded-xl border border-stone-200 bg-stone-50 flex items-center px-4 group-hover:border-yellow-400 transition-all">
                          <ImageIcon size={16} className="text-stone-400 mr-2"/>
                          <span className="text-xs font-bold text-stone-500 truncate">{imageFile ? imageFile.name : 'Subir imagen...'}</span>
                        </div>
                        <input type="file" onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Bloques Dinámicos */}
                  <div className="space-y-4 pt-4 border-t border-stone-100">
                    <label className={labelClass}>Contuerpo de la Noticia</label>
                    <div className="space-y-4">
                      {bloques.map((b) => (
                        <div key={b.id} className="relative p-5 rounded-[2rem] border border-stone-100 bg-stone-50/50 group animate-in zoom-in-95">
                          <button type="button" onClick={() => eliminarBloque(b.id)} className="absolute -top-2 -right-2 bg-white text-stone-400 hover:text-red-600 shadow-md rounded-full p-1.5 border border-stone-100 transition-all"><X size={14}/></button>
                          
                          {b.type === 'text' ? (
                            <div className="space-y-3">
                              <div className="flex gap-1 bg-white p-1 rounded-xl border border-stone-200 w-fit">
                                <button type="button" onClick={() => aplicarFormato(b.id, 'bold')} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"><Bold size={14}/></button>
                                <button type="button" onClick={() => aplicarFormato(b.id, 'italic')} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"><Italic size={14}/></button>
                                <button type="button" onClick={() => aplicarFormato(b.id, 'underline')} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600"><Underline size={14}/></button>
                              </div>
                              <textarea
                                ref={(el) => { textareasRef.current[b.id] = el; }}
                                placeholder="Escribe el párrafo aquí..."
                                className="w-full bg-transparent border-none focus:ring-0 text-sm leading-relaxed text-stone-600 min-h-[100px] resize-none"
                                value={b.value}
                                onChange={(e) => actualizarBloque(b.id, e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-4">
                              {b.value ? (
                                <img src={b.value} className="h-32 w-full object-cover rounded-2xl mb-3 shadow-inner" alt="preview" />
                              ) : (
                                <div className="h-32 w-full border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 mb-3">
                                  <ImageIcon size={32} strokeWidth={1} />
                                  <span className="text-[10px] font-bold uppercase mt-2">Sin imagen</span>
                                </div>
                              )}
                              <input type="file" className="text-[10px] font-bold text-stone-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-stone-200 file:text-stone-700 hover:file:bg-yellow-400 transition-all" onChange={(e) => {
                                const f = e.target.files?.[0];
                                if(f) actualizarBloque(b.id, URL.createObjectURL(f), f);
                              }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 justify-center py-6 border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50/30">
                      <button type="button" onClick={() => agregarBloque('text')} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-brand-brown hover:text-white rounded-full transition-all text-[10px] font-black uppercase tracking-widest shadow-sm border border-stone-100">
                        <Type size={14} /> + Párrafo
                      </button>
                      <button type="button" onClick={() => agregarBloque('image')} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-brand-brown hover:text-white rounded-full transition-all text-[10px] font-black uppercase tracking-widest shadow-sm border border-stone-100">
                        <ImageIcon size={14} /> + Imagen
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full py-4 bg-brand-brown text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-900 transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-3">
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {editingSlug ? 'Guardar Cambios' : 'Publicar Noticia'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
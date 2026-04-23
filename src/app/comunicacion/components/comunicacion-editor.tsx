'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Link as LinkIcon, FileUp, ChevronDown, AlertCircle, CheckCircle2, LayoutPanelTop, FileText, UploadCloud } from 'lucide-react';

interface ComunicacionEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function ComunicacionEditor({ isAdmin, onRefresh }: ComunicacionEditorProps) {
  const documentTypeOptions = [
    { value: 'comunicacion', label: 'Comunicación General' },
    { value: 'logos', label: 'Logos' },
    { value: 'dibujos', label: 'Dibujos' },
    { value: 'recursos', label: 'Recursos' },
  ] as const;

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'document' | 'link' | 'page'>('document');
  const [isLoading, setIsLoading] = useState(false);

  const [docData, setDocData] = useState({ titulo: '', descripcion: '', tipo: 'comunicacion' });
  const [file, setFile] = useState<File | null>(null);

  const [linkData, setLinkData] = useState({ title: '', description: '', url: '', icon: 'link' });
  const [pageData, setPageData] = useState({ title: '', slug: '', description: '', textureUrl: '/assets/textures/areasg.webp' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return null;

  const toSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

  const done = (message: string) => {
    setSuccess(message);
    setError('');
    onRefresh?.();
  };

  const changeMode = (newMode: 'document' | 'link' | 'page') => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!file) throw new Error('Selecciona un archivo');

      const formDataImage = new FormData();
      formDataImage.append('file', file);
      formDataImage.append('type', 'documento');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataImage,
      });
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Error al subir archivo');
      }
      const uploadedData = await uploadRes.json();

      const response = await fetch('/api/admin/documentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: docData.titulo,
          descripcion: docData.descripcion,
          tipo: docData.tipo,
          url: uploadedData.url,
          fileId: uploadedData.fileId,
          fecha: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar documento');
      }

      setDocData({ titulo: '', descripcion: '', tipo: 'comunicacion' });
      setFile(null);
      done('Documento subido correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!linkData.title) throw new Error('El título es obligatorio');
      if (!linkData.url) throw new Error('La URL es obligatoria');

      const response = await fetch('/api/admin/links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'comunicacion',
          title: linkData.title,
          description: linkData.description || null,
          url: linkData.url,
          icon: linkData.icon,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar enlace');
      }

      setLinkData({ title: '', description: '', url: '', icon: 'link' });
      done('Enlace agregado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!pageData.title.trim()) throw new Error('El título es obligatorio');

      const response = await fetch('/api/admin/resource-pages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageData.title,
          slug: pageData.slug,
          description: pageData.description,
          textureUrl: pageData.textureUrl,
          template: 'blue',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error al crear página');
      }

      setPageData({ title: '', slug: '', description: '', textureUrl: '/assets/textures/areasg.webp' });
      done('Página creada correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = mode === 'document' ? handleSubmitDocument : mode === 'link' ? handleSubmitLink : handleSubmitPage;

  const inputClass = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none transition-all';
  const labelClass = 'block text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 mb-1.5';

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setError('');
          setSuccess('');
        }}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 z-40 flex items-center gap-2 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="hidden md:inline text-sm font-bold pr-2">Añadir recurso</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-stone-100 bg-stone-50/50 shrink-0">
              <div className="flex items-center gap-3 text-blue-700">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100">
                  {mode === 'document' ? <FileText size={22} /> : mode === 'link' ? <LinkIcon size={22} /> : <LayoutPanelTop size={22} />}
                </div>
                <h2 className="text-xl font-black">
                  {mode === 'document' ? 'Agregar Documento' : mode === 'link' ? 'Agregar Enlace' : 'Crear Página'}
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex p-1 bg-stone-100/80 rounded-2xl mb-8 border border-stone-200/60">
                <button onClick={() => changeMode('document')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'document' ? 'bg-white text-blue-700 shadow-sm' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}>
                  <FileUp size={16} /> Documento
                </button>
                <button onClick={() => changeMode('link')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'link' ? 'bg-white text-blue-700 shadow-sm' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}>
                  <LinkIcon size={16} /> Enlace
                </button>
                <button onClick={() => changeMode('page')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'page' ? 'bg-white text-blue-700 shadow-sm' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}>
                  <LayoutPanelTop size={16} /> Página
                </button>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-6 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'document' && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                      <label className={labelClass}>Título del Documento *</label>
                      <input type="text" required value={docData.titulo} onChange={(e) => setDocData({ ...docData, titulo: e.target.value })} className={inputClass} placeholder="Ej: Kit de Logos 2026" />
                    </div>

                    <div>
                      <label className={labelClass}>Descripción</label>
                      <textarea value={docData.descripcion} onChange={(e) => setDocData({ ...docData, descripcion: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="Breve descripción del recurso..." />
                    </div>

                    <div>
                      <label className={labelClass}>Clasificación</label>
                      <div className="relative group">
                        <select value={docData.tipo} onChange={(e) => setDocData({ ...docData, tipo: e.target.value })} className={`${inputClass} appearance-none pr-12 cursor-pointer`}>
                          {documentTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-stone-600 transition-colors" />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Archivo *</label>
                      <div className="relative overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center group cursor-pointer">
                        {file ? (
                          <div className="w-full flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm cursor-default">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0"><FileText size={20} /></div>
                              <span className="text-sm font-semibold text-stone-700 truncate">{file.name}</span>
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-white rounded-full shadow-sm text-stone-400 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                              <UploadCloud size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-700">Haz clic para buscar un archivo</p>
                              <p className="text-xs text-stone-500 mt-1">PDF, imágenes, Word, Excel, PPT, etc.</p>
                            </div>
                            <input type="file" required onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'link' && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                      <label className={labelClass}>Título del Enlace *</label>
                      <input type="text" required value={linkData.title} onChange={(e) => setLinkData({ ...linkData, title: e.target.value })} className={inputClass} placeholder="Ej: Banco de imágenes" />
                    </div>

                    <div>
                      <label className={labelClass}>Descripción</label>
                      <textarea value={linkData.description} onChange={(e) => setLinkData({ ...linkData, description: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="¿De qué trata este enlace?" />
                    </div>

                    <div>
                      <label className={labelClass}>URL de destino *</label>
                      <input type="url" required value={linkData.url} onChange={(e) => setLinkData({ ...linkData, url: e.target.value })} className={inputClass} placeholder="https://..." />
                    </div>
                  </div>
                )}

                {mode === 'page' && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                      <label className={labelClass}>Título de la Página *</label>
                      <input
                        type="text"
                        required
                        value={pageData.title}
                        onChange={(e) =>
                          setPageData((prev) => ({
                            ...prev,
                            title: e.target.value,
                            slug: toSlug(e.target.value),
                          }))
                        }
                        className={inputClass}
                        placeholder="Ej: Recursos para Campamentos"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Descripción interna</label>
                      <textarea
                        value={pageData.description}
                        onChange={(e) => setPageData({ ...pageData, description: e.target.value })}
                        className={`${inputClass} resize-none`}
                        rows={3}
                        placeholder="Opcional. Breve nota interna sobre esta página."
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Imagen de cabecera (Textura)</label>
                      <input
                        type="text"
                        value={pageData.textureUrl}
                        onChange={(e) => setPageData({ ...pageData, textureUrl: e.target.value })}
                        className={inputClass}
                        placeholder="/assets/textures/areasg.webp"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 mt-4 border-t border-stone-100">
                  <button type="button" onClick={() => setIsOpen(false)} disabled={isLoading} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md">
                    {isLoading ? (
                      <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                    ) : (
                      <>{mode === 'document' ? 'Subir Documento' : mode === 'link' ? 'Guardar Enlace' : 'Crear Página'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

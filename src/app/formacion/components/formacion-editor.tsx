'use client';

import { useState } from 'react';
import { Plus, X, Loader2, Link as LinkIcon, FileUp, ChevronDown, AlertCircle, CheckCircle2, LayoutPanelTop, FileText } from 'lucide-react';

interface FormacionEditorProps {
  isAdmin: boolean;
  onRefresh?: () => void;
}

// Editor flotante para que administradores carguen documentos, enlaces o páginas de recursos.
export function FormacionEditor({ isAdmin, onRefresh }: FormacionEditorProps) {
  const documentTypeOptions = [
    { value: 'formacion', label: 'Presentacion' },
    { value: 'temario', label: 'Temario' },
    { value: 'carta', label: 'Carta' },
    { value: 'otro', label: 'Otro' },
  ] as const;

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'document' | 'link' | 'page'>('document');
  const [isLoading, setIsLoading] = useState(false);

  const toSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');

  const [docData, setDocData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'formacion',
  });
  const selectedDocumentType =
    documentTypeOptions.find((option) => option.value === docData.tipo)?.label ?? 'Presentacion';
  const [file, setFile] = useState<File | null>(null);

  const [linkData, setLinkData] = useState({
    title: '',
    description: '',
    url: '',
    icon: 'link',
  });

  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    description: '',
    textureUrl: '/assets/textures/formacion.webp',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isAdmin) return null;

  const done = (message: string) => {
    // Centraliza el mensaje de éxito y refresca la vista pública.
    setSuccess(message);
    setError('');
    onRefresh?.();
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

      setDocData({ titulo: '', descripcion: '', tipo: 'formacion' });
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
      if (!linkData.title) throw new Error('El titulo es obligatorio');
      if (!linkData.url) throw new Error('La URL es obligatoria');

      const response = await fetch('/api/admin/links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'formacion',
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
      if (!pageData.title.trim()) throw new Error('El titulo es obligatorio');

      const response = await fetch('/api/admin/resource-pages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageData.title,
          slug: pageData.slug,
          description: pageData.description,
          textureUrl: pageData.textureUrl,
          template: 'gold',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Error al crear pagina');
      }

      setPageData({
        title: '',
        slug: '',
        description: '',
        textureUrl: '/assets/textures/formacion.webp',
      });
      done('Pagina creada correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit =
    mode === 'document' ? handleSubmitDocument : mode === 'link' ? handleSubmitLink : handleSubmitPage;

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setError('');
          setSuccess('');
        }}
        className="fixed bottom-8 right-8 bg-brand-brown hover:bg-brand-brown/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="hidden md:inline text-sm font-bold">Agregar en Formación</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-brand-brown text-white p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-2xl font-bold">
                  {mode === 'document' ? <FileText size={24} /> : mode === 'link' ? <LinkIcon size={24} /> : <LayoutPanelTop size={24} />}
                  <h2>{mode === 'document' ? 'Agregar Documento' : mode === 'link' ? 'Agregar Enlace' : 'Agregar Página'}</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMode('document')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${
                    mode === 'document' ? 'bg-white text-brand-brown' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <FileUp size={18} />
                  Documento
                </button>
                <button
                  onClick={() => setMode('link')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${
                    mode === 'link' ? 'bg-white text-brand-brown' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <LinkIcon size={18} />
                  Enlace
                </button>
                <button
                  onClick={() => setMode('page')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold ${
                    mode === 'page' ? 'bg-white text-brand-brown' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <LayoutPanelTop size={18} />
                  Página
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              {mode === 'document' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Título del Documento *</label>
                    <input
                      type="text"
                      required
                      value={docData.titulo}
                      onChange={(e) => setDocData({ ...docData, titulo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Ej: Presentación Módulo 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                    <textarea
                      value={docData.descripcion}
                      onChange={(e) => setDocData({ ...docData, descripcion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      rows={3}
                      placeholder="Descripción del documento"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="block text-sm font-bold text-gray-700">Tipo de Recurso</label>
                      <span className="text-xs font-semibold text-gray-500 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
                        {selectedDocumentType}
                      </span>
                    </div>
                    <div className="relative group">
                      <select
                        value={docData.tipo}
                        onChange={(e) => setDocData({ ...docData, tipo: e.target.value })}
                        className="w-full appearance-none pr-12 pl-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500"
                      >
                        {documentTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Archivo *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {file ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-700">{file.name}</p>
                          <button type="button" onClick={() => setFile(null)} className="text-red-600 hover:text-red-800">
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="file"
                          required
                          onChange={(e) => {
                            if (e.target.files?.[0]) setFile(e.target.files[0]);
                          }}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : mode === 'link' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Título del Enlace *</label>
                    <input
                      type="text"
                      required
                      value={linkData.title}
                      onChange={(e) => setLinkData({ ...linkData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Ej: Mi Blog"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                    <textarea
                      value={linkData.description}
                      onChange={(e) => setLinkData({ ...linkData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      rows={2}
                      placeholder="Descripción del enlace"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">URL *</label>
                    <input
                      type="url"
                      required
                      value={linkData.url}
                      onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  <div className="text-xs text-gray-500">Se usará icono de enlace estándar.</div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Titulo de la Pagina *</label>
                    <input
                      type="text"
                      required
                      value={pageData.title}
                      onChange={(e) =>
                        setPageData((prev) => {
                          const title = e.target.value;
                          return { ...prev, title, slug: toSlug(title) };
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Ej: Escuela para Guias"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Slug (automatico)</label>
                    <input
                      type="text"
                      value={pageData.slug}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg"
                      placeholder="slug-automatico"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripcion</label>
                    <textarea
                      value={pageData.description}
                      onChange={(e) => setPageData({ ...pageData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      rows={3}
                      placeholder="Descripcion de la pagina"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Textura del banner</label>
                    <input
                      type="text"
                      value={pageData.textureUrl}
                      onChange={(e) => setPageData({ ...pageData, textureUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="/assets/textures/formacion.webp"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-bold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Guardando...
                    </>
                  ) : mode === 'document' ? (
                    'Subir Documento'
                  ) : mode === 'link' ? (
                    'Agregar Enlace'
                  ) : (
                    'Crear Pagina'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

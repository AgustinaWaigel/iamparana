'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';

type InstitutionalDocument = {
  id: number;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  file_type: string | null;
  created_at: string;
};

type ResourcePage = { id: number; title: string };
type DestinationSection = { id: number; title: string; section_key: string };

export function InstitutionalDocuments({ pages }: { pages: ResourcePage[] }) {
  const router = useRouter();
  const { isAdmin } = useSession();
  const [documents, setDocuments] = useState<InstitutionalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [destinations, setDestinations] = useState<DestinationSection[]>([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState('');
  const [resourceType, setResourceType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documentos?section=institucional', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar los documentos');
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const openUploader = async () => {
      setError('');
      setIsOpen(true);
      try {
        const results = await Promise.all(pages.map(async (page) => {
          const response = await fetch(`/api/admin/resource-sections?pageId=${page.id}`, { credentials: 'include' });
          if (!response.ok) return [];
          const rows = await response.json();
          const first = Array.isArray(rows) ? rows[0] : null;
          return first ? [{ id: Number(first.id), title: page.title, section_key: String(first.section_key || '') }] : [];
        }));
        const next = results.flat();
        setDestinations(next);
        setSelectedSectionKey(next[0]?.section_key || '');
      } catch {
        setError('No se pudieron cargar las secciones disponibles');
      }
    };
    window.addEventListener('institutional:add-document', openUploader);
    return () => window.removeEventListener('institutional:add-document', openUploader);
  }, [pages]);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSectionKey) return setError('Seleccioná una sección de destino');
    if (resourceType === 'file' && !file) return setError('Seleccioná un archivo');
    if (resourceType === 'link' && !linkUrl.trim()) return setError('Ingresá el enlace');

    setSaving(true);
    setError('');
    try {
      let response: Response;
      if (resourceType === 'link') {
        const rawUrl = linkUrl.trim();
        const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        response = await fetch('/api/admin/links', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: selectedSectionKey, title: title.trim(), description: description.trim(), url: normalizedUrl, icon: 'link' }) });
      } else {
        const uploadData = new FormData();
        uploadData.append('file', file!);
        uploadData.append('type', 'documento');
        const uploadResponse = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: uploadData });
        const uploaded = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploaded.error || 'No se pudo subir el archivo');
        response = await fetch('/api/admin/documentos', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: title.trim(), descripcion: description.trim(), tipo: selectedSectionKey, url: uploaded.url, fileId: uploaded.fileId }) });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `No se pudo guardar el ${resourceType === 'link' ? 'enlace' : 'archivo'} en la sección`);

      setTitle('');
      setDescription('');
      setFile(null);
      setLinkUrl('');
      setIsOpen(false);
      await loadDocuments();
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Ocurrió un error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const response = await fetch(`/api/admin/documentos?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'No se pudo eliminar el documento');
      return;
    }
    setDeleteId(null);
    await loadDocuments();
  };

  if (loading) return null;
  if (documents.length === 0 && !isOpen) return null;

  return (
    <section className={documents.length ? 'py-4' : ''}>
      {error && !isOpen && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white p-8 text-stone-500">
          <Loader2 className="animate-spin" size={20} /> Cargando documentos…
        </div>
      ) : documents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <article key={document.id} className="flex min-h-56 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-xl bg-stone-900 p-2.5 text-white"><FileText size={20} /></span>
                {isAdmin && (
                  <button type="button" onClick={() => setDeleteId(document.id)} className="rounded-full p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${document.title}`}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <h3 className="!m-0 w-full text-left text-lg font-black leading-tight text-stone-900">{document.title}</h3>
              <p className="!mx-0 !mb-0 !mt-2 !max-w-none line-clamp-3 text-left !text-sm leading-relaxed text-stone-600">{document.description || 'Documento institucional de IAM Paraná.'}</p>
              {document.google_drive_url && (
                <a href={document.google_drive_url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-stone-700">
                  <Download size={16} /> Ver documento
                </a>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {isOpen && (
        <div className="modal-overlay-unified">
          <div className="modal-panel-unified max-w-xl">
            <div className="modal-header-unified flex items-center justify-between">
              <div><h2 className="modal-title-unified">Agregar recurso</h2><p className="modal-subtitle-unified">Archivo o enlace institucional</p></div>
              <button type="button" onClick={() => setIsOpen(false)} className="modal-close-unified"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpload} className="modal-body-unified">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1"><button type="button" onClick={() => setResourceType('file')} className={`rounded-xl px-4 py-2 text-sm font-bold ${resourceType === 'file' ? 'bg-white text-brand-brown shadow-sm' : 'text-stone-500'}`}>Subir archivo</button><button type="button" onClick={() => setResourceType('link')} className={`rounded-xl px-4 py-2 text-sm font-bold ${resourceType === 'link' ? 'bg-white text-brand-brown shadow-sm' : 'text-stone-500'}`}>Agregar enlace</button></div>
              <div><label className="modal-label-unified">Sección de destino *</label><select required value={selectedSectionKey} onChange={(event) => setSelectedSectionKey(event.target.value)} className="modal-input-unified"><option value="">Seleccionar sección</option>{destinations.map((section) => <option key={section.id} value={section.section_key}>{section.title}</option>)}</select>{destinations.length === 0 && <p className="!m-0 pt-2 text-xs text-amber-700">Creá una sección antes de subir el recurso.</p>}</div>
              <div><label className="modal-label-unified">Título *</label><input required value={title} onChange={(event) => setTitle(event.target.value)} className="modal-input-unified" placeholder="Nombre del documento" /></div>
              <div><label className="modal-label-unified">Descripción</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="modal-input-unified resize-none" rows={3} placeholder="Breve explicación del contenido" /></div>
              {resourceType === 'file' ? <div>
                <label className="modal-label-unified">Archivo *</label>
                <label className="mt-1 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center transition hover:bg-stone-100">
                  <UploadCloud className="mb-2 text-stone-500" size={28} />
                  <span className="text-sm font-bold text-stone-700">{file ? file.name : 'Seleccionar archivo'}</span>
                  <span className="mt-1 text-xs text-stone-500">PDF, Word, Excel, imágenes u otros formatos</span>
                  <input required type="file" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                </label>
              </div> : <div><label className="modal-label-unified">Enlace *</label><input required type="text" inputMode="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} className="modal-input-unified" placeholder="ejemplo.com/documento" /></div>}
              <div className="modal-actions-unified">
                <button type="button" onClick={() => setIsOpen(false)} className="modal-btn-secondary-unified">Cancelar</button>
                <button disabled={saving || !selectedSectionKey} className="modal-btn-primary-unified">{saving ? <><Loader2 className="animate-spin" size={16} /> Guardando…</> : resourceType === 'link' ? 'Agregar enlace' : 'Subir archivo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={deleteId !== null} title="Eliminar documento" itemName={documents.find((item) => item.id === deleteId)?.title || 'documento'} onCancel={() => setDeleteId(null)} onConfirm={() => deleteId !== null && void handleDelete(deleteId)} />
    </section>
  );
}

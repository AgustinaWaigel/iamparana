'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileUp,
  LayoutPanelTop,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useSessionUser } from '@/app/lib/use-session';

// Botón flotante de administración para editar páginas de recursos, secciones y contenido asociado.
type EditorSection = {
  id: number;
  title: string;
  section_key: string;
};

type EditorDocument = {
  id: number;
  title: string;
  description: string | null;
  google_drive_url: string | null;
};

type EditorLink = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
};

type EditorPage = {
  id: number;
  title: string;
  description: string | null;
  texture_url: string | null;
  template: string;
};

type EditorTheme = {
  accentText: string;
  accentBg: string;
  accentBgHover: string;
  accentBgSoft: string;
  accentRing: string;
  accentHoverText: string;
  accentBorder: string;
  accentBorderSoft: string;
  accentCardIcon: string;
  accentCardText: string;
};

const THEME_MAP: Record<string, EditorTheme> = {
  gold: {
    accentText: 'text-brand-brown',
    accentBg: 'bg-brand-brown',
    accentBgHover: 'hover:bg-amber-900',
    accentBgSoft: 'bg-yellow-100',
    accentRing: 'focus:ring-yellow-400/50 focus:border-yellow-400',
    accentHoverText: 'group-hover:text-yellow-500',
    accentBorder: 'border-yellow-400',
    accentBorderSoft: 'border-yellow-200',
    accentCardIcon: 'bg-yellow-100 text-yellow-700',
    accentCardText: 'text-amber-800',
  },
  ocean: {
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-600',
    accentBgHover: 'hover:bg-blue-700',
    accentBgSoft: 'bg-blue-100',
    accentRing: 'focus:ring-blue-400/50 focus:border-blue-400',
    accentHoverText: 'group-hover:text-blue-600',
    accentBorder: 'border-blue-500',
    accentBorderSoft: 'border-blue-200',
    accentCardIcon: 'bg-blue-100 text-blue-700',
    accentCardText: 'text-blue-800',
  },
  blue: {
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-600',
    accentBgHover: 'hover:bg-blue-700',
    accentBgSoft: 'bg-blue-100',
    accentRing: 'focus:ring-blue-400/50 focus:border-blue-400',
    accentHoverText: 'group-hover:text-blue-600',
    accentBorder: 'border-blue-500',
    accentBorderSoft: 'border-blue-200',
    accentCardIcon: 'bg-blue-100 text-blue-700',
    accentCardText: 'text-blue-800',
  },
  earth: {
    accentText: 'text-amber-800',
    accentBg: 'bg-amber-700',
    accentBgHover: 'hover:bg-amber-900',
    accentBgSoft: 'bg-amber-100',
    accentRing: 'focus:ring-amber-400/50 focus:border-amber-400',
    accentHoverText: 'group-hover:text-amber-700',
    accentBorder: 'border-amber-600',
    accentBorderSoft: 'border-amber-200',
    accentCardIcon: 'bg-amber-100 text-amber-700',
    accentCardText: 'text-amber-800',
  },
};

interface ResourcePageEditorFabProps {
  page: EditorPage;
  initialSections: EditorSection[];
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function ResourcePageEditorFab({ page, initialSections }: ResourcePageEditorFabProps) {
  const router = useRouter();
  const { user, loading } = useSessionUser();
  const theme = THEME_MAP[page.template] || THEME_MAP.gold;

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'page' | 'section' | 'document' | 'link'>('page');
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [documents, setDocuments] = useState<EditorDocument[]>([]);
  const [links, setLinks] = useState<EditorLink[]>([]);

  const [pageForm, setPageForm] = useState({
    title: page.title,
    description: page.description || '',
    textureUrl: page.texture_url || '',
    template: page.template || 'gold',
  });

  const [sectionForm, setSectionForm] = useState({ title: '', slug: '' });
  const [selectedSectionId, setSelectedSectionId] = useState<number>(initialSections[0]?.id || 0);

  const [docForm, setDocForm] = useState({ titulo: '', descripcion: '' });
  const [docFile, setDocFile] = useState<File | null>(null);

  const [linkForm, setLinkForm] = useState({ title: '', description: '', url: '', icon: '🔗' });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedSectionKey = useMemo(() => {
    return sections.find((section) => section.id === selectedSectionId)?.section_key || '';
  }, [sections, selectedSectionId]);

  if (loading || !user || user.role !== 'admin') {
    return null;
  }

  const refreshSections = async () => {
    // Recarga la estructura de la página para mantener sincronizadas secciones y contenido.
    const response = await fetch(`/api/admin/resource-sections?pageId=${page.id}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('No se pudieron cargar las secciones');

    const data = await response.json();
    const nextSections = (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>;
    const normalized = nextSections.map((row) => ({
      id: Number(row.id),
      title: String(row.title || ''),
      section_key: String(row.section_key || ''),
    }));

    setSections(normalized);
    if (normalized[0] && !normalized.some((item) => item.id === selectedSectionId)) {
      setSelectedSectionId(normalized[0].id);
    }
  };

  const refreshSectionContent = async (sectionKey: string) => {
    if (!sectionKey) {
      setDocuments([]);
      setLinks([]);
      return;
    }

    const [docsRes, linksRes] = await Promise.all([
      fetch(`/api/admin/documentos?section=${encodeURIComponent(sectionKey)}`, { credentials: 'include' }),
      fetch(`/api/admin/links?section=${encodeURIComponent(sectionKey)}`, { credentials: 'include' }),
    ]);

    if (!docsRes.ok || !linksRes.ok) {
      throw new Error('No se pudo cargar el contenido de la seccion');
    }

    const docsData = await docsRes.json();
    const linksData = await linksRes.json();

    const nextDocs = (Array.isArray(docsData) ? docsData : []).map((row) => ({
      id: Number(row.id),
      title: String(row.title || ''),
      description: row.description ? String(row.description) : null,
      google_drive_url: row.google_drive_url ? String(row.google_drive_url) : null,
    }));

    const nextLinks = (Array.isArray(linksData) ? linksData : []).map((row) => ({
      id: Number(row.id),
      title: String(row.title || ''),
      description: row.description ? String(row.description) : null,
      url: String(row.url || ''),
      icon: row.icon ? String(row.icon) : null,
    }));

    setDocuments(nextDocs);
    setLinks(nextLinks);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const openModal = async () => {
    setIsOpen(true);
    clearMessages();
    try {
      await refreshSections();
      const sectionKey = sections.find((section) => section.id === selectedSectionId)?.section_key || initialSections[0]?.section_key || '';
      await refreshSectionContent(sectionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir editor');
    }
  };

  const handleSavePage = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    setBusy(true);

    try {
      const response = await fetch('/api/admin/resource-pages', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: page.id,
          title: pageForm.title,
          description: pageForm.description,
          textureUrl: pageForm.textureUrl,
          template: pageForm.template,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo actualizar la pagina');
      }

      setSuccess('Pagina actualizada');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar pagina');
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePage = async () => {
    if (!confirm('Eliminar esta pagina completa con todas sus secciones y contenido?')) return;
    clearMessages();
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/resource-pages?id=${page.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo eliminar la pagina');
      }

      router.replace('/formacion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar pagina');
      setBusy(false);
    }
  };

  const handleCreateSection = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    setBusy(true);

    try {
      const response = await fetch('/api/admin/resource-sections', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: page.id,
          title: sectionForm.title,
          slug: sectionForm.slug,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo crear la seccion');
      }

      setSectionForm({ title: '', slug: '' });
      await refreshSections();
      setSuccess('Seccion creada');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear seccion');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateSection = async (section: EditorSection) => {

    clearMessages();
    setBusy(true);
    try {
      const response = await fetch('/api/admin/resource-sections', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: section.id, title: section.title }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo actualizar la seccion');
      }

      setSuccess('Seccion actualizada');
      await refreshSections();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar seccion');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Eliminar esta seccion y todo su contenido?')) return;
    clearMessages();
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/resource-sections?id=${sectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo eliminar la seccion');
      }

      await refreshSections();
      const nextSection = sections.find((item) => item.id !== sectionId);
      await refreshSectionContent(nextSection?.section_key || '');
      setSuccess('Seccion eliminada');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar seccion');
    } finally {
      setBusy(false);
    }
  };

  const handleUploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!docFile || !selectedSectionKey) return;

    setBusy(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', docFile);
      uploadForm.append('type', 'documento');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo subir el archivo');
      }

      const uploadData = await uploadRes.json();

      const saveRes = await fetch('/api/admin/documentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: docForm.titulo,
          descripcion: docForm.descripcion,
          tipo: selectedSectionKey,
          url: uploadData.url,
          fileId: uploadData.fileId,
        }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo guardar el documento');
      }

      setDocForm({ titulo: '', descripcion: '' });
      setDocFile(null);
      setSuccess('Documento agregado');
      await refreshSectionContent(selectedSectionKey);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar documento');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateDocument = async (doc: EditorDocument) => {
    clearMessages();
    setBusy(true);

    try {
      const response = await fetch('/api/admin/documentos', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doc.id,
          title: doc.title,
          description: doc.description || '',
          googleDriveUrl: doc.google_drive_url || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo actualizar el documento');
      }

      setSuccess('Documento actualizado');
      await refreshSectionContent(selectedSectionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar documento');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Eliminar este documento?')) return;
    clearMessages();
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/documentos?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo eliminar el documento');
      }

      setSuccess('Documento eliminado');
      await refreshSectionContent(selectedSectionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar documento');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLink = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!selectedSectionKey) return;

    setBusy(true);
    try {
      const response = await fetch('/api/admin/links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: selectedSectionKey,
          title: linkForm.title,
          description: linkForm.description,
          url: linkForm.url,
          icon: linkForm.icon,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo crear el enlace');
      }

      setLinkForm({ title: '', description: '', url: '', icon: '🔗' });
      setSuccess('Enlace agregado');
      await refreshSectionContent(selectedSectionKey);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar enlace');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateLink = async (link: EditorLink) => {
    clearMessages();
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/links?id=${link.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: link.title,
          description: link.description || '',
          url: link.url,
          icon: link.icon || '🔗',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo actualizar el enlace');
      }

      setSuccess('Enlace actualizado');
      await refreshSectionContent(selectedSectionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar enlace');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Eliminar este enlace?')) return;
    clearMessages();
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/links?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo eliminar el enlace');
      }

      setSuccess('Enlace eliminado');
      await refreshSectionContent(selectedSectionKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar enlace');
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    `w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 ${theme.accentRing} outline-none transition-all`;
  const labelClass = 'block text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 mb-1.5';
  const softCardClass = 'rounded-2xl border border-stone-200 bg-white p-4 shadow-sm';
  const modeButton = (modeName: 'page' | 'section' | 'document' | 'link') =>
    `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
      mode === modeName
        ? `bg-white ${theme.accentText} shadow-sm`
        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
    }`;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`fixed bottom-8 right-8 ${theme.accentBg} ${theme.accentBgHover} text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 z-40 flex items-center gap-2 group`}
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="hidden md:inline text-sm font-bold pr-2">Editar pagina</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-6 border-b border-stone-100 bg-stone-50/50 shrink-0">
              <div className={`flex items-center gap-3 ${theme.accentText}`}>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100">
                  {mode === 'page' ? <LayoutPanelTop size={22} /> : mode === 'section' ? <Pencil size={22} /> : mode === 'document' ? <FileText size={22} /> : <LinkIcon size={22} />}
                </div>
                <h3 className="text-xl font-black">
                  {mode === 'page' ? 'Editar Pagina' : mode === 'section' ? 'Editar Secciones' : mode === 'document' ? 'Gestionar Documentos' : 'Gestionar Enlaces'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar ">
              <div className="flex p-1 bg-stone-100/80 rounded-2xl mb-8 border border-stone-200/60">
                <button type="button" onClick={() => setMode('page')} className={modeButton('page')}>
                  <LayoutPanelTop size={16} /> Pagina
                </button>
                <button type="button" onClick={() => setMode('section')} className={modeButton('section')}>
                  <Pencil size={16} /> Seccion
                </button>
                <button type="button" onClick={() => setMode('document')} className={modeButton('document')}>
                  <FileUp size={16} /> Documento
                </button>
                <button type="button" onClick={() => setMode('link')} className={modeButton('link')}>
                  <LinkIcon size={16} /> Enlace
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

              {mode !== 'page' && (
                <div className="mb-6">
                  <label className={labelClass}>Seccion destino</label>
                  <div className="relative group">
                    <select
                      value={selectedSectionId}
                      onChange={async (e) => {
                        const nextId = Number(e.target.value);
                        setSelectedSectionId(nextId);
                        const nextKey = sections.find((section) => section.id === nextId)?.section_key || '';
                        try {
                          await refreshSectionContent(nextKey);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Error cargando contenido');
                        }
                      }}
                      className={`${inputClass} appearance-none pr-12 cursor-pointer`}
                    >
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>{section.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 ${theme.accentHoverText} transition-colors`} />
                  </div>
                </div>
              )}

              {mode === 'page' && (
                <form className="space-y-5" onSubmit={handleSavePage}>
                  <div>
                    <label className={labelClass}>Titulo de pagina *</label>
                    <input
                      value={pageForm.title}
                      onChange={(e) => setPageForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Escuela para Guias"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Descripcion</label>
                    <textarea
                      value={pageForm.description}
                      onChange={(e) => setPageForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descripcion de la pagina"
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Imagen de cabecera (Textura)</label>
                    <input
                      value={pageForm.textureUrl}
                      onChange={(e) => setPageForm((prev) => ({ ...prev, textureUrl: e.target.value }))}
                      placeholder="/assets/textures/formacion.webp"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Template visual</label>
                    <div className="relative group">
                      <select
                        value={pageForm.template}
                        onChange={(e) => setPageForm((prev) => ({ ...prev, template: e.target.value }))}
                        className={`${inputClass} appearance-none pr-12 cursor-pointer`}
                      >
                        <option value="gold">Dorado</option>
                        <option value="ocean">Azul oceano</option>
                        <option value="blue">Azul comunicacion</option>
                        <option value="earth">Tierra</option>
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-stone-600 transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-stone-100">
                    <button type="button" onClick={handleDeletePage} disabled={busy} className="flex-1 px-4 py-3 rounded-xl border border-red-200 text-red-700 font-bold hover:bg-red-50 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Eliminar pagina
                    </button>
                    <button disabled={busy} className={`flex-1 px-4 py-3 rounded-xl ${theme.accentBg} ${theme.accentBgHover} text-white font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md`}>
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar pagina
                    </button>
                  </div>
                </form>
              )}

              {mode === 'section' && (
                <div className="space-y-4">
                  <form className="space-y-5" onSubmit={handleCreateSection}>
                    <div>
                      <label className={labelClass}>Titulo de la seccion *</label>
                      <input
                        value={sectionForm.title}
                        onChange={(e) =>
                          setSectionForm({
                            title: e.target.value,
                            slug: toSlug(e.target.value),
                          })
                        }
                        placeholder="Ej: Recursos para encuentros"
                        className={inputClass}
                        required
                      />
                    </div>
                    
                   {/* <div>
                      <label className={labelClass}>Slug generado</label>
                      <input value={sectionForm.slug} readOnly className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-600" />
                    </div>*/}
                    <button disabled={busy} className={`inline-flex items-center gap-2 rounded-xl ${theme.accentBg} ${theme.accentBgHover} px-4 py-3 text-sm font-black text-white disabled:opacity-60 transition-colors shadow-md`}>
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Crear seccion
                    </button>
                  </form>

                  <div className="space-y-3 border-t border-stone-200 pt-5">
                    {sections.map((section) => (
                      <div key={section.id} className={softCardClass}>
                        <label className={labelClass}>Nombre de seccion</label>
                        <input
                          value={section.title}
                          onChange={(e) =>
                            setSections((prev) =>
                              prev.map((item) =>
                                item.id === section.id ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                          className={inputClass}
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateSection(section)}
                            className={`px-3 py-2 rounded-lg ${theme.accentBgSoft} ${theme.accentCardText} text-xs font-bold hover:opacity-90 transition-colors`}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(section.id)}
                            className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'document' && (
                <div className="space-y-4">
                  <form className="space-y-5" onSubmit={handleUploadDocument}>
                    <div>
                      <label className={labelClass}>Titulo del documento *</label>
                      <input value={docForm.titulo} onChange={(e) => setDocForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Ej: Material del mes" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Descripcion</label>
                      <textarea value={docForm.descripcion} onChange={(e) => setDocForm((prev) => ({ ...prev, descripcion: e.target.value }))} rows={2} placeholder="Breve descripcion" className={`${inputClass} resize-none`} />
                    </div>
                    <div>
                      <label className={labelClass}>Archivo *</label>
                      <div className="relative overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center group cursor-pointer">
                        {docFile ? (
                          <div className="w-full flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm cursor-default">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`p-2 ${theme.accentCardIcon} rounded-lg shrink-0`}><FileText size={20} /></div>
                              <span className="text-sm font-semibold text-stone-700 truncate">{docFile.name}</span>
                            </div>
                            <button type="button" onClick={(e) => { e.preventDefault(); setDocFile(null); }} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={`p-3 bg-white rounded-full shadow-sm text-stone-400 ${theme.accentHoverText} group-hover:scale-110 transition-all`}>
                              <UploadCloud size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-700">Haz clic para buscar un archivo</p>
                              <p className="text-xs text-stone-500 mt-1">PDF, Word, Excel, PPT, etc.</p>
                            </div>
                            <input type="file" required onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </>
                        )}
                      </div>
                    </div>
                    <button disabled={busy || !selectedSectionKey} className={`inline-flex items-center gap-2 rounded-xl ${theme.accentBg} ${theme.accentBgHover} px-4 py-3 text-sm font-black text-white disabled:opacity-60 transition-colors shadow-md`}>
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />} Subir documento
                    </button>
                  </form>

                  <div className="space-y-3 border-t border-stone-200 pt-5">
                    {documents.map((doc) => (
                      <div key={doc.id} className={softCardClass}>
                        <label className={labelClass}>Titulo</label>
                        <input
                          value={doc.title}
                          onChange={(e) =>
                            setDocuments((prev) =>
                              prev.map((item) =>
                                item.id === doc.id ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                          className={inputClass}
                        />
                        <label className={`${labelClass} mt-3`}>Descripcion</label>
                        <textarea
                          value={doc.description || ''}
                          onChange={(e) =>
                            setDocuments((prev) =>
                              prev.map((item) =>
                                item.id === doc.id ? { ...item, description: e.target.value } : item
                              )
                            )
                          }
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateDocument(doc)}
                            className={`px-3 py-2 rounded-lg ${theme.accentBgSoft} ${theme.accentCardText} text-xs font-bold hover:opacity-90 transition-colors`}
                          >
                            Guardar
                          </button>
                          <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === 'link' && (
                <div className="space-y-4">
                  <form className="space-y-5" onSubmit={handleCreateLink}>
                    <div>
                      <label className={labelClass}>Titulo del enlace *</label>
                      <input value={linkForm.title} onChange={(e) => setLinkForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ej: Web oficial IAM" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Descripcion</label>
                      <textarea value={linkForm.description} onChange={(e) => setLinkForm((prev) => ({ ...prev, description: e.target.value }))} rows={2} placeholder="Breve descripcion" className={`${inputClass} resize-none`} />
                    </div>
                    <div>
                      <label className={labelClass}>URL *</label>
                      <input value={linkForm.url} onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="https://..." className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Icono (opcional)</label>
                      <input value={linkForm.icon} onChange={(e) => setLinkForm((prev) => ({ ...prev, icon: e.target.value }))} placeholder="🔗" className={inputClass} />
                    </div>
                    <button disabled={busy || !selectedSectionKey} className={`inline-flex items-center gap-2 rounded-xl ${theme.accentBg} ${theme.accentBgHover} px-4 py-3 text-sm font-black text-white disabled:opacity-60 transition-colors shadow-md`}>
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />} Agregar enlace
                    </button>
                  </form>

                  <div className="space-y-3 border-t border-stone-200 pt-5">
                    {links.map((link) => (
                      <div key={link.id} className={softCardClass}>
                        <label className={labelClass}>Titulo</label>
                        <input
                          value={link.title}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((item) =>
                                item.id === link.id ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                          className={inputClass}
                        />
                        <label className={`${labelClass} mt-3`}>Descripcion</label>
                        <textarea
                          value={link.description || ''}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((item) =>
                                item.id === link.id ? { ...item, description: e.target.value } : item
                              )
                            )
                          }
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                        <label className={`${labelClass} mt-3`}>URL</label>
                        <input
                          value={link.url}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((item) =>
                                item.id === link.id ? { ...item, url: e.target.value } : item
                              )
                            )
                          }
                          className={inputClass}
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateLink(link)}
                            className={`px-3 py-2 rounded-lg ${theme.accentBgSoft} ${theme.accentCardText} text-xs font-bold hover:opacity-90 transition-colors`}
                          >
                            Guardar
                          </button>
                          <button type="button" onClick={() => handleDeleteLink(link.id)} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

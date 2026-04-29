'use client';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, GraduationCap, Link as LinkIcon, Pencil, Trash2, SearchX } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { SearchBar } from '@/app/components/common/search-bar';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';
import { getGoogleDriveProxyImageUrl } from '@/lib/drive-utils';

// --- TYPES ---
type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; thumbnail_url?: string | null; texture_url?: string | null; };

type CardItem = {
  id: string;
  kind: 'document' | 'link' | 'resource-page';
  title: string;
  description: string;
  href: string;
  badge: string;
  accent: 'red';
  resourceId: number;
  googleDriveUrl?: string | null;
  linkUrl?: string;
  thumbnailUrl?: string | null;
};

type EditDraft = { kind: CardItem['kind']; resourceId: number; title: string; description: string; url: string; };
type DeleteDraft = { kind: CardItem['kind']; resourceId: number; title: string; };

interface LogisticaCardsGridProps {
  uploadedDocuments: UploadedDocument[];
  uploadedLinks: UploadedLink[];
  resourcePages: ResourcePageCard[];
}

function isValidImageSource(value?: string | null): boolean {
  if (!value) return false;
  const src = value.trim().toLowerCase();
  if (!src) return false;
  if (src.startsWith('/')) return true;
  return src.startsWith('http://') || src.startsWith('https://');
}

// --- MAIN COMPONENT ---
export function LogisticaCardsGrid({ uploadedDocuments, uploadedLinks, resourcePages }: LogisticaCardsGridProps) {
  const { isAdmin } = useSession();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [documentsState, setDocumentsState] = useState(uploadedDocuments);
  const [linksState, setLinksState] = useState(uploadedLinks);
  const [resourcePagesState, setResourcePagesState] = useState(resourcePages);
  
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  
  const [deleteDraft, setDeleteDraft] = useState<DeleteDraft | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => setDocumentsState(uploadedDocuments), [uploadedDocuments]);
  useEffect(() => setLinksState(uploadedLinks), [uploadedLinks]);
  useEffect(() => setResourcePagesState(resourcePages), [resourcePages]);

  // --- HANDLERS ---
  const openEditModal = (card: CardItem) => {
    if (!isAdmin) return;
    setEditError('');
    setEditThumbnailUrl(card.thumbnailUrl || '');
    setEditThumbnailFile(null);
    setEditDraft({
      kind: card.kind,
      resourceId: card.resourceId,
      title: card.title,
      description: card.description,
      url: card.kind === 'link' ? card.linkUrl || card.href : '',
    });
  };

  const openDeleteModal = (card: CardItem) => {
    if (!isAdmin) return;
    setDeleteError('');
    setDeleteDraft({ kind: card.kind, resourceId: card.resourceId, title: card.title });
  };

  const closeEditModal = () => {
    setEditDraft(null);
    setEditThumbnailUrl('');
    setEditThumbnailFile(null);
  };

  const uploadThumbnail = async (imageFile: File) => {
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('La miniatura debe ser una imagen válida');
    }

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('type', 'imagen');

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'No se pudo subir la miniatura');
    }

    return String(data.url || '').trim();
  };

  const submitEdit = async () => {
    if (!editDraft) return;

    const nextTitle = editDraft.title.trim();
    const nextDescription = editDraft.description.trim();
    
    if (!nextTitle) return setEditError('El título es obligatorio.');
    if (editDraft.kind === 'link' && !editDraft.url.trim()) return setEditError('La URL es obligatoria para enlaces.');

    setEditError('');
    setEditBusy(true);

    try {
      let nextThumbnailUrl = editThumbnailUrl.trim() || undefined;
      if (editThumbnailFile) {
        nextThumbnailUrl = await uploadThumbnail(editThumbnailFile);
      }

      if (editDraft.kind === 'document') {
        const docInfo = documentsState.find((item) => item.id === editDraft.resourceId);
        const response = await fetch('/api/admin/documentos', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editDraft.resourceId,
            title: nextTitle,
            description: nextDescription,
            googleDriveUrl: docInfo?.google_drive_url || '',
            thumbnailUrl: nextThumbnailUrl,
          }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el documento');
        setDocumentsState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription, thumbnail_url: nextThumbnailUrl || null } : item)));
      } 
      else if (editDraft.kind === 'link') {
        const nextUrl = editDraft.url.trim();
        const response = await fetch(`/api/admin/links?id=${editDraft.resourceId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: nextTitle, description: nextDescription, url: nextUrl, icon: 'link', thumbnailUrl: nextThumbnailUrl }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el enlace');
        setLinksState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription, url: nextUrl, thumbnail_url: nextThumbnailUrl || null } : item)));
      } 
      else if (editDraft.kind === 'resource-page') {
        const pagesResponse = await fetch('/api/admin/resource-pages', { credentials: 'include' });
        if (!pagesResponse.ok) throw new Error('No se pudo leer la página actual');
        
        const allPages = await pagesResponse.json();
        const currentPage = (Array.isArray(allPages) ? allPages : []).find((item) => Number(item.id) === editDraft.resourceId);
        if (!currentPage) throw new Error('Página no encontrada');

        const response = await fetch('/api/admin/resource-pages', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editDraft.resourceId,
            title: nextTitle,
            description: nextDescription,
            thumbnailUrl: nextThumbnailUrl,
            textureUrl: String(currentPage.texture_url || '/assets/textures/areasg.webp'),
            template: String(currentPage.template || 'red'),
          }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar la página');
        setResourcePagesState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription, thumbnail_url: nextThumbnailUrl || null } : item)));
      }
      closeEditModal();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al editar');
    } finally {
      setEditBusy(false);
    }
  };

  const deleteCard = async () => {
    if (!deleteDraft) return;
    setDeleteError('');
    setDeleteBusy(true);

    try {
      const endpoint = deleteDraft.kind === 'document' ? '/api/admin/documentos' :
                       deleteDraft.kind === 'link' ? '/api/admin/links' : '/api/admin/resource-pages';

      const response = await fetch(`${endpoint}?id=${deleteDraft.resourceId}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error(`No se pudo eliminar el ${deleteDraft.kind}`);

      if (deleteDraft.kind === 'document') setDocumentsState((prev) => prev.filter((item) => item.id !== deleteDraft.resourceId));
      if (deleteDraft.kind === 'link') setLinksState((prev) => prev.filter((item) => item.id !== deleteDraft.resourceId));
      if (deleteDraft.kind === 'resource-page') setResourcePagesState((prev) => prev.filter((item) => item.id !== deleteDraft.resourceId));
      
      setDeleteDraft(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleteBusy(false);
    }
  };

  // --- DATA TRANSFORMATION ---
  const cards = useMemo<CardItem[]>(() => {
    const documentCards: CardItem[] = documentsState.map((doc) => ({
      id: `doc-${doc.id}`, kind: 'document', title: doc.title, description: doc.description || 'Documento de logística', href: doc.google_drive_url || '#', badge: doc.file_type || 'Documento', accent: 'red', resourceId: doc.id, googleDriveUrl: doc.google_drive_url, thumbnailUrl: doc.thumbnail_url || null,
    }));

    const linkCards: CardItem[] = linksState.map((resourceLink) => ({
      id: `link-${resourceLink.id}`, kind: 'link', title: resourceLink.title, description: resourceLink.description || 'Enlace de referencia', href: resourceLink.url, badge: 'Enlace', accent: 'red', resourceId: resourceLink.id, linkUrl: resourceLink.url, thumbnailUrl: resourceLink.thumbnail_url || null,
    }));

    const resourcePageCards: CardItem[] = resourcePagesState.map((page) => ({
      id: `resource-page-${page.id}`, kind: 'resource-page', title: page.title, description: page.description || 'Página de recursos', href: `/logistica/recursos/${page.slug}`, badge: 'Página de recursos', accent: 'red', resourceId: page.id, thumbnailUrl: page.thumbnail_url || page.texture_url || null,
    }));

    return [...resourcePageCards, ...documentCards, ...linkCards];
  }, [documentsState, linksState, resourcePagesState]);

  const filteredCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cards;
    return cards.filter((card) => card.title.toLowerCase().includes(term) || card.description.toLowerCase().includes(term) || card.badge.toLowerCase().includes(term));
  }, [cards, searchTerm]);


  // --- RENDER ---
  return (
    <>
      <div className="mb-8 md:mb-10 max-w-2xl mx-auto">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar documentos, informes o enlaces..."
        />
        <div className="mt-3 text-center text-xs font-semibold text-stone-500">
          Mostrando {filteredCards.length} {filteredCards.length === 1 ? 'resultado' : 'resultados'}
        </div>
      </div>

      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {filteredCards.map((card) => (
            <ResourceCard 
              key={card.id} 
              card={card} 
              isAdmin={isAdmin} 
              onEdit={() => openEditModal(card)} 
              onDelete={() => openDeleteModal(card)} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-stone-100 shadow-sm mb-16">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <SearchX size={40} className="text-red-700" />
          </div>
          <h3 className="text-xl font-bold text-red-700 mb-2">No encontramos nada</h3>
          <p className="text-stone-500 max-w-sm">
            No hay recursos que coincidan con &quot;{searchTerm}&quot;. Intenta con otras palabras clave.
          </p>
          <button 
            onClick={() => setSearchTerm('')} 
            className="mt-6 font-semibold text-red-800 hover:text-red-900 underline decoration-red-300 underline-offset-4"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {editDraft && (
        <div className="modal-overlay-unified">
          <div className="modal-panel-unified max-w-lg transform transition-all">
            <div className="modal-header-unified">
              <h3 className="modal-title-unified">Editar recurso</h3>
              <p className="modal-subtitle-unified">
                {editDraft.kind === 'document' ? 'Documento' : editDraft.kind === 'link' ? 'Enlace' : 'Página de recursos'}
              </p>
            </div>
            <form className="modal-body-unified" onSubmit={(e) => { e.preventDefault(); submitEdit().catch(() => undefined); }}>
              <div className="space-y-1">
                <label className="modal-label-unified">Título</label>
                <input value={editDraft.title} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))} className="modal-input-unified" required />
              </div>
              <div className="space-y-1">
                <label className="modal-label-unified">Descripción</label>
                <textarea value={editDraft.description} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))} rows={3} className="modal-input-unified resize-none" />
              </div>
              {editDraft.kind === 'link' && (
                <div className="space-y-1">
                  <label className="modal-label-unified">URL</label>
                  <input value={editDraft.url} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, url: e.target.value } : prev))} placeholder="https://..." className="modal-input-unified" required />
                </div>
              )}
              <div className="space-y-1">
                <label className="modal-label-unified">Miniatura (URL opcional)</label>
                <input value={editThumbnailUrl} onChange={(e) => setEditThumbnailUrl(e.target.value)} placeholder="https://... o /uploads/..." className="modal-input-unified" />
              </div>
              <div className="space-y-2">
                <label className="modal-label-unified">Subir miniatura (opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setEditThumbnailFile(e.target.files?.[0] || null)} className="upload-input-unified" />
                {editThumbnailFile && <p className="text-xs text-stone-500">Archivo seleccionado: {editThumbnailFile.name}</p>}
              </div>
              {editError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{editError}</p>}
              <div className="modal-actions-unified">
                <button type="button" onClick={() => !editBusy && closeEditModal()} disabled={editBusy} className="modal-btn-secondary-unified">Cancelar</button>
                <button type="submit" disabled={editBusy} className="modal-btn-primary-unified">
                  {editBusy ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteDraft)}
        title="Eliminar recurso"
        itemName={deleteDraft?.title || ''}
        error={deleteError || null}
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleteDraft(null)}
        onConfirm={() => {
          deleteCard().catch(() => undefined);
        }}
      />
    </>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

function getCardIcon(card: CardItem, size = 60, className = '') {
  const iconClass = `text-red-700/90 group-hover:scale-110 transition-transform duration-500 relative z-10 ${className}`;
  if (card.kind === 'resource-page') return <GraduationCap size={size} className={iconClass} strokeWidth={1.5} />;
  if (card.kind === 'document') return <FileText size={size} className={iconClass} strokeWidth={1.5} />;
  if (card.kind === 'link') return <LinkIcon size={size} className={iconClass} strokeWidth={1.5} />;
  return null;
}

function ResourceCard({ card, isAdmin, onEdit, onDelete }: { card: CardItem; isAdmin: boolean; onEdit: () => void; onDelete: () => void; }) {
  const headerBg = 'bg-gradient-to-br from-red-400 to-red-600';
  const actionBtnClass = 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-md border-red-200';

  const normalizedThumbnailUrl = getGoogleDriveProxyImageUrl(card.thumbnailUrl);
  const thumbnailUrl = isValidImageSource(normalizedThumbnailUrl) ? normalizedThumbnailUrl : null;

  return (
    <article className="group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-stone-100 overflow-hidden">
      <div className={`${headerBg} h-40 flex items-center justify-center relative overflow-hidden`}>
        
        {isAdmin && (
          <div className="absolute right-3 top-3 z-20 flex gap-2">
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} aria-label="Editar" className="rounded-full bg-white/90 p-2 text-red-700 hover:bg-white hover:scale-110 transition-all shadow-sm">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} aria-label="Eliminar" className="rounded-full bg-white/90 p-2 text-red-600 hover:bg-white hover:scale-110 transition-all shadow-sm">
              <Trash2 size={15} />
            </button>
          </div>
        )}

        {thumbnailUrl ? (
          <>
            <img src={thumbnailUrl} alt={`Miniatura de ${card.title}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute left-4 bottom-4 z-20 rounded-xl bg-white/90 p-2 shadow-sm">
              {getCardIcon(card, 28, 'text-red-700')}
            </div>
          </>
        ) : (
          <>{getCardIcon(card)}</>
        )}
      </div>

      <a
        href={card.href}
        target={card.href.startsWith('/') ? undefined : '_blank'}
        rel={card.href.startsWith('/') ? undefined : 'noopener noreferrer'}
        className="flex flex-1 flex-col p-4 text-left no-underline group/link"
      >
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover/link:underline">{card.title}</h3>
        <p className="text-xs text-stone-600 line-clamp-2 mt-1 flex-1">{card.description}</p>
        <div className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold border ${actionBtnClass} w-fit`}>
          {card.badge}
        </div>
      </a>
    </article>
  );
}

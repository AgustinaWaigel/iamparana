'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/app/hooks/use-session';
import { ResourceCard, ResourceEmptyState, ResourceGrid, ResourceToolbar } from '@/app/components/common/area-resources';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';
import { anioDeRecurso, coincideBusqueda } from '@/lib/busqueda';
import { esAlbumDeFotos } from '@/lib/fotos';

// --- TYPES ---
type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; created_at: string; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; created_at: string; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; thumbnail_url?: string | null; texture_url?: string | null; created_at: string; };

// Eliminamos el tipo 'static'
type CardItem = {
  id: string;
  kind: 'document' | 'link' | 'resource-page';
  title: string;
  description: string;
  href: string;
  badge: string;
  accent: 'blue' | 'brown';
  resourceId: number; // Ahora es obligatorio, porque todos vienen de la DB
  googleDriveUrl?: string | null;
  linkUrl?: string;
  thumbnailUrl?: string | null;
  createdAt: string;
};

type EditDraft = { kind: CardItem['kind']; resourceId: number; title: string; description: string; url: string; };
type DeleteDraft = { kind: CardItem['kind']; resourceId: number; title: string; };

interface ComunicacionCardsGridProps {
  uploadedDocuments: UploadedDocument[];
  uploadedLinks: UploadedLink[];
  resourcePages: ResourcePageCard[];
}

// --- MAIN COMPONENT ---
export function ComunicacionCardsGrid({ uploadedDocuments, uploadedLinks, resourcePages }: ComunicacionCardsGridProps) {
  const { isAdmin } = useSession();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [anio, setAnio] = useState<number | null>(null);
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
            textureUrl: String(currentPage.texture_url || '/assets/textures/comunicacion.webp'),
            template: String(currentPage.template || 'gold'),
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
      id: `doc-${doc.id}`, kind: 'document', title: doc.title, description: doc.description || 'Documento compartido por el equipo de formación.', href: doc.google_drive_url || '#', badge: doc.file_type || 'Documento', accent: 'brown', resourceId: doc.id, googleDriveUrl: doc.google_drive_url, thumbnailUrl: doc.thumbnail_url || null, createdAt: doc.created_at,
    }));

    // Los álbumes de fotos ya se muestran en "Fotos de los eventos". Acá los ve solo quien
    // administra, para poder editarlos o borrarlos.
    const linkCards: CardItem[] = linksState.filter((resourceLink) => isAdmin || !esAlbumDeFotos(resourceLink.url)).map((resourceLink) => ({
      id: `link-${resourceLink.id}`, kind: 'link', title: resourceLink.title, description: resourceLink.description || 'Enlace compartido por el equipo de formación.', href: resourceLink.url, badge: esAlbumDeFotos(resourceLink.url) ? 'Álbum de fotos' : 'Enlace', accent: 'blue', resourceId: resourceLink.id, linkUrl: resourceLink.url, thumbnailUrl: resourceLink.thumbnail_url || null, createdAt: resourceLink.created_at,
    }));

    const resourcePageCards: CardItem[] = resourcePagesState.map((page) => ({
      id: `resource-page-${page.id}`, kind: 'resource-page', title: page.title, description: page.description || 'Página de recursos con secciones y contenido.', href: `/comunicacion/recursos/${page.slug}`, badge: 'Página de comunicación', accent: 'brown', resourceId: page.id, thumbnailUrl: page.thumbnail_url || page.texture_url || null, createdAt: page.created_at,
    }));

    // Ahora solo devolvemos lo que viene de la base de datos
    return [...resourcePageCards, ...documentCards, ...linkCards].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.resourceId - a.resourceId);
  }, [documentsState, linksState, resourcePagesState, isAdmin]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) =>
      (anio === null || anioDeRecurso(card.title, card.createdAt) === anio) &&
      coincideBusqueda(searchTerm, card.title, card.description, card.badge));
  }, [cards, searchTerm, anio]);

  // Años que tienen al menos un recurso, del más nuevo al más viejo.
  const anios = useMemo(() => {
    const encontrados = new Set<number>();
    for (const card of cards) {
      const valor = anioDeRecurso(card.title, card.createdAt);
      if (valor !== null) encontrados.add(valor);
    }
    return [...encontrados].sort((a, b) => b - a);
  }, [cards]);

  // Si el año elegido se queda sin recursos (por ejemplo, al borrar el último), se vuelve a "todos".
  useEffect(() => {
    if (anio !== null && !anios.includes(anio)) setAnio(null);
  }, [anio, anios]);


  // --- RENDER ---
  return (
    <>
      <ResourceToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Buscar recursos, temarios o enlaces..."
        resultCount={filteredCards.length}
        years={anios}
        selectedYear={anio}
        onYearChange={setAnio}
      />

      {filteredCards.length > 0 ? (
        <ResourceGrid>
          {filteredCards.map((card, index) => (
            <ResourceCard
              key={card.id}
              card={card}
              area="comunicacion"
              index={index}
              isAdmin={isAdmin}
              onEdit={() => openEditModal(card)}
              onDelete={() => openDeleteModal(card)}
            />
          ))}
        </ResourceGrid>
      ) : (
        <ResourceEmptyState area="comunicacion" searchTerm={searchTerm} onClear={() => { setSearchTerm(''); setAnio(null); }} />
      )}

      {editDraft && (
        <div className="modal-overlay-unified">
          <div className="modal-panel-unified max-w-lg transform transition-all">
            <div className="modal-header-unified">
              <h3 className="modal-title-unified">Editar recurso</h3>
              <p className="modal-subtitle-unified">
                {editDraft.kind === 'document' ? 'Documento' : editDraft.kind === 'link' ? 'Enlace' : 'Página de comunicación'}
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


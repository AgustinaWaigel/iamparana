'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, GraduationCap, Link as LinkIcon, Pencil, Search, Trash2, X, SearchX } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';

// --- TYPES ---
type UploadedDocument = { id: number; title: string; description: string | null; google_drive_url: string | null; file_type: string | null; };
type UploadedLink = { id: number; title: string; description: string | null; url: string; icon: string | null; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; };

// Eliminamos el tipo 'static'
type CardItem = {
  id: string;
  kind: 'document' | 'link' | 'resource-page';
  title: string;
  description: string;
  href: string;
  badge: string;
  accent: 'blue' | 'green' | 'blue';
  resourceId: number; // Ahora es obligatorio, porque todos vienen de la DB
  googleDriveUrl?: string | null;
  linkUrl?: string;
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
  const [documentsState, setDocumentsState] = useState(uploadedDocuments);
  const [linksState, setLinksState] = useState(uploadedLinks);
  const [resourcePagesState, setResourcePagesState] = useState(resourcePages);
  
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  
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

  const submitEdit = async () => {
    if (!editDraft) return;

    const nextTitle = editDraft.title.trim();
    const nextDescription = editDraft.description.trim();
    
    if (!nextTitle) return setEditError('El título es obligatorio.');
    if (editDraft.kind === 'link' && !editDraft.url.trim()) return setEditError('La URL es obligatoria para enlaces.');

    setEditError('');
    setEditBusy(true);

    try {
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
          }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el documento');
        setDocumentsState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription } : item)));
      } 
      else if (editDraft.kind === 'link') {
        const nextUrl = editDraft.url.trim();
        const response = await fetch(`/api/admin/links?id=${editDraft.resourceId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: nextTitle, description: nextDescription, url: nextUrl, icon: 'link' }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el enlace');
        setLinksState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription, url: nextUrl } : item)));
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
            textureUrl: String(currentPage.texture_url || '/assets/textures/comunicacion.webp'),
            template: String(currentPage.template || 'gold'),
          }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar la página');
        setResourcePagesState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription } : item)));
      }
      setEditDraft(null);
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
      id: `doc-${doc.id}`, kind: 'document', title: doc.title, description: doc.description || 'Documento compartido por el equipo de formación.', href: doc.google_drive_url || '#', badge: doc.file_type || 'Documento', accent: 'green', resourceId: doc.id, googleDriveUrl: doc.google_drive_url,
    }));

    const linkCards: CardItem[] = linksState.map((resourceLink) => ({
      id: `link-${resourceLink.id}`, kind: 'link', title: resourceLink.title, description: resourceLink.description || 'Enlace compartido por el equipo de formación.', href: resourceLink.url, badge: 'Enlace', accent: 'blue', resourceId: resourceLink.id, linkUrl: resourceLink.url,
    }));

    const resourcePageCards: CardItem[] = resourcePagesState.map((page) => ({
      id: `resource-page-${page.id}`, kind: 'resource-page', title: page.title, description: page.description || 'Página de recursos con secciones y contenido.', href: `/comunicacion/recursos/${page.slug}`, badge: 'Página de formación', accent: 'blue', resourceId: page.id,
    }));

    // Ahora solo devolvemos lo que viene de la base de datos
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
        <div className="relative group flex items-center bg-white rounded-full border border-stone-200 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-400/20 focus-within:shadow-md px-4 py-3">
          <Search size={18} className="text-stone-400 group-focus-within:text-blue-600 transition-colors shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar recursos, temarios o enlaces..."
            className="w-full bg-transparent border-none text-stone-700 placeholder:text-stone-400 focus:outline-none ml-3 text-[15px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
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
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <SearchX size={40} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-brand-brown mb-2">No encontramos nada</h3>
          <p className="text-stone-500 max-w-sm">
            No hay recursos que coincidan con &quot;{searchTerm}&quot;. Intenta con otras palabras clave.
          </p>
          <button 
            onClick={() => setSearchTerm('')} 
            className="mt-6 font-semibold text-blue-700 hover:text-blue-800 underline decoration-blue-300 underline-offset-4"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {editDraft && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden transform transition-all">
            <div className="border-b border-stone-100 px-6 py-5 bg-stone-50/50">
              <h3 className="text-xl font-black text-brand-brown">Editar recurso</h3>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-stone-400">
                {editDraft.kind === 'document' ? 'Documento' : editDraft.kind === 'link' ? 'Enlace' : 'Página de formación'}
              </p>
            </div>
            <form className="space-y-5 px-6 py-6" onSubmit={(e) => { e.preventDefault(); submitEdit().catch(() => undefined); }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Título</label>
                <input value={editDraft.title} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none transition-all" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Descripción</label>
                <textarea value={editDraft.description} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))} rows={3} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none transition-all resize-none" />
              </div>
              {editDraft.kind === 'link' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">URL</label>
                  <input value={editDraft.url} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, url: e.target.value } : prev))} placeholder="https://..." className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none transition-all" required />
                </div>
              )}
              {editError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{editError}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button type="button" onClick={() => !editBusy && setEditDraft(null)} disabled={editBusy} className="rounded-xl px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={editBusy} className="inline-flex items-center gap-2 rounded-xl bg-brand-brown px-6 py-2.5 text-sm font-black text-white disabled:opacity-50 hover:bg-amber-900 shadow-md transition-all active:scale-95">
                  {editBusy ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDraft && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-red-100 bg-red-50 px-6 py-5">
              <h3 className="text-xl font-black text-red-700">Eliminar recurso</h3>
            </div>
            <div className="space-y-5 px-6 py-6">
              <p className="text-stone-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar <span className="font-bold text-stone-900">{deleteDraft.title}</span>? Esta acción no se puede deshacer.
              </p>
              {deleteError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{deleteError}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button type="button" onClick={() => !deleteBusy && setDeleteDraft(null)} disabled={deleteBusy} className="rounded-xl px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors">Cancelar</button>
                <button type="button" onClick={() => deleteCard().catch(() => undefined)} disabled={deleteBusy} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-black text-white disabled:opacity-50 hover:bg-red-700 shadow-md transition-all active:scale-95">
                  {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

function getCardIcon(card: CardItem) {
  const iconClass = "text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10";
  // Ahora asignamos el ícono basado solo en el tipo de recurso
  if (card.kind === 'resource-page') return <GraduationCap size={60} className={iconClass} strokeWidth={1.5} />;
  if (card.kind === 'document') return <FileText size={60} className={iconClass} strokeWidth={1.5} />;
  if (card.kind === 'link') return <LinkIcon size={60} className={iconClass} strokeWidth={1.5} />;
  return null;
}

function ResourceCard({ card, isAdmin, onEdit, onDelete }: { card: CardItem; isAdmin: boolean; onEdit: () => void; onDelete: () => void; }) {
  const headerBg = {
    green: 'bg-gradient-to-br from-green-300 to-green-500',
    blue: 'bg-gradient-to-br from-blue-300 to-blue-500',
    yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-500'
  }[card.accent];

  const actionBtnClass = {
    green: 'bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-md border-green-200',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:shadow-md border-yellow-200'
  }[card.accent];

  const ActionWrapper = card.href.startsWith('/') ? Link : 'a';
  const externalProps = card.href.startsWith('/') ? {} : { target: "_blank", rel: "noopener noreferrer" };

  return (
    <article className="group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-stone-100 overflow-hidden">
      <div className={`${headerBg} h-40 flex items-center justify-center relative overflow-hidden`}>
        
        {/* Se quitó la verificación de !isStatic, ahora todos los admins pueden editar todas las cards */}
        {isAdmin && (
          <div className="absolute right-3 top-3 z-20 flex gap-2">
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} aria-label="Editar" className="rounded-full bg-white/90 p-2 text-brand-brown hover:bg-white hover:scale-110 transition-all shadow-sm">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} aria-label="Eliminar" className="rounded-full bg-white/90 p-2 text-red-600 hover:bg-white hover:scale-110 transition-all shadow-sm">
              <Trash2 size={15} />
            </button>
          </div>
        )}

        {getCardIcon(card)}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6 md:p-7 flex flex-col flex-1 bg-white">
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-[10px] font-black tracking-widest uppercase">
            {card.badge}
          </span>
        </div>
        <h3 className="text-xl font-black text-brand-brown mb-2 line-clamp-2 leading-tight">{card.title}</h3>
        <p className="text-stone-500 mb-8 flex-1 text-sm leading-relaxed line-clamp-3">{card.description}</p>
        
        <ActionWrapper 
          href={card.href} 
          {...externalProps} 
          className={`group/btn flex items-center justify-center gap-2 w-full text-center px-6 py-3.5 font-bold rounded-xl border transition-all no-underline ${actionBtnClass}`}
        >
          {card.kind === 'link' ? 'Abrir enlace' : 'Ver recurso'}
          <ExternalLink size={16} className="opacity-70 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </ActionWrapper>
      </div>
    </article>
  );
}
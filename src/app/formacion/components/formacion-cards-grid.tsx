'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, FileText, GraduationCap, Link as LinkIcon, Mail, Pencil, Search, Trash2 } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';

type UploadedDocument = {
  id: number;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  file_type: string | null;
};

type UploadedLink = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
};

type ResourcePageCard = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
};

type CardItem = {
  id: string;
  kind: 'static' | 'document' | 'link' | 'resource-page';
  title: string;
  description: string;
  href: string;
  badge: string;
  accent: 'yellow' | 'green' | 'blue';
  resourceId?: number;
  googleDriveUrl?: string | null;
  linkUrl?: string;
};

type EditableCardKind = Exclude<CardItem['kind'], 'static'>;

type EditDraft = {
  kind: EditableCardKind;
  resourceId: number;
  title: string;
  description: string;
  url: string;
};

type DeleteDraft = {
  kind: EditableCardKind;
  resourceId: number;
  title: string;
};

interface FormacionCardsGridProps {
  uploadedDocuments: UploadedDocument[];
  uploadedLinks: UploadedLink[];
  resourcePages: ResourcePageCard[];
}

export function FormacionCardsGrid({ uploadedDocuments, uploadedLinks, resourcePages }: FormacionCardsGridProps) {
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

  const openEditModal = (card: CardItem) => {
    if (!isAdmin || card.kind === 'static' || !card.resourceId) return;
    setEditError('');
    setEditDraft({
      kind: card.kind,
      resourceId: card.resourceId,
      title: card.title,
      description: card.description,
      url: card.kind === 'link' ? card.linkUrl || card.href : '',
    });
  };

  const closeEditModal = () => {
    if (editBusy) return;
    setEditError('');
    setEditDraft(null);
  };

  const openDeleteModal = (card: CardItem) => {
    if (!isAdmin || card.kind === 'static' || !card.resourceId) return;
    setDeleteError('');
    setDeleteDraft({
      kind: card.kind,
      resourceId: card.resourceId,
      title: card.title,
    });
  };

  const closeDeleteModal = () => {
    if (deleteBusy) return;
    setDeleteError('');
    setDeleteDraft(null);
  };

  const submitEdit = async () => {
    if (!editDraft) return;

    const nextTitle = editDraft.title.trim();
    const nextDescription = editDraft.description.trim();
    if (!nextTitle) {
      setEditError('El titulo es obligatorio.');
      return;
    }

    if (editDraft.kind === 'link' && !editDraft.url.trim()) {
      setEditError('La URL es obligatoria para enlaces.');
      return;
    }

    setEditError('');
    setEditBusy(true);

    try {
      if (editDraft.kind === 'document') {
        const response = await fetch('/api/admin/documentos', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editDraft.resourceId,
            title: nextTitle,
            description: nextDescription,
            googleDriveUrl: documentsState.find((item) => item.id === editDraft.resourceId)?.google_drive_url || '',
          }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el documento');
        setDocumentsState((prev) => prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription } : item)));
        setEditDraft(null);
        return;
      }

      if (editDraft.kind === 'link') {
        const nextUrl = editDraft.url.trim();
        const response = await fetch(`/api/admin/links?id=${editDraft.resourceId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: nextTitle,
            description: nextDescription,
            url: nextUrl,
            icon: 'link',
          }),
        });
        if (!response.ok) throw new Error('No se pudo actualizar el enlace');
        setLinksState((prev) =>
          prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription, url: nextUrl } : item))
        );
        setEditDraft(null);
        return;
      }

      const pagesResponse = await fetch('/api/admin/resource-pages', { credentials: 'include' });
      if (!pagesResponse.ok) throw new Error('No se pudo leer la pagina actual');
      const allPages = await pagesResponse.json();
      const currentPage = (Array.isArray(allPages) ? allPages : []).find((item) => Number(item.id) === editDraft.resourceId);
      if (!currentPage) throw new Error('Pagina no encontrada');

      const response = await fetch('/api/admin/resource-pages', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editDraft.resourceId,
          title: nextTitle,
          description: nextDescription,
          textureUrl: String(currentPage.texture_url || '/assets/textures/formacion.webp'),
          template: String(currentPage.template || 'gold'),
        }),
      });
      if (!response.ok) throw new Error('No se pudo actualizar la pagina');
      setResourcePagesState((prev) =>
        prev.map((item) => (item.id === editDraft.resourceId ? { ...item, title: nextTitle, description: nextDescription } : item))
      );
      setEditDraft(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al editar');
    } finally {
      setEditBusy(false);
    }
  };

  const cards = useMemo<CardItem[]>(() => {
    const staticCards: CardItem[] = [
      {
        id: 'static-temario',
        kind: 'static',
        title: 'Temario 2025',
        description:
          'Accede al temario completo de este año para prepararte y profundizar en los temas de animación.',
        href: 'https://drive.google.com/file/d/1FGd15NAkaXvkfaeyuwLZUgljkntrPJqs/view?usp=sharing',
        badge: 'Recurso fijo',
        accent: 'yellow',
      },
      {
        id: 'static-carta',
        kind: 'static',
        title: 'Carta del Papa',
        description:
          'Palabras inspiradoras del Santo Padre para nuestro andar como misioneros y animadores.',
        href: 'https://www.vatican.va/content/francesco/es/messages/missions/documents/20250125-giornata-missionaria.html',
        badge: 'Recurso fijo',
        accent: 'yellow',
      },
      {
        id: 'static-presentaciones',
        kind: 'static',
        title: 'Presentaciones',
        description:
          'Materiales de capacitación y diapositivas para potenciar tus habilidades como animador.',
        href: '/formacion/presentaciones',
        badge: 'Recurso fijo',
        accent: 'yellow',
      },
    ];

    const documentCards: CardItem[] = documentsState.map((doc) => ({
      id: `doc-${doc.id}`,
      kind: 'document',
      title: doc.title,
      description: doc.description || 'Documento compartido por el equipo de formación.',
      href: doc.google_drive_url || '#',
      badge: doc.file_type || 'Documento',
      accent: 'green',
      resourceId: doc.id,
      googleDriveUrl: doc.google_drive_url,
    }));

    const linkCards: CardItem[] = linksState.map((resourceLink) => ({
      id: `link-${resourceLink.id}`,
      kind: 'link',
      title: resourceLink.title,
      description: resourceLink.description || 'Enlace compartido por el equipo de formación.',
      href: resourceLink.url,
      badge: 'Enlace',
      accent: 'blue',
      resourceId: resourceLink.id,
      linkUrl: resourceLink.url,
    }));

    const resourcePageCards: CardItem[] = resourcePagesState.map((page) => ({
      id: `resource-page-${page.id}`,
      kind: 'resource-page',
      title: page.title,
      description: page.description || 'Pagina de recursos con secciones y contenido.',
      href: `/recursos/${page.slug}`,
      badge: 'Pagina de formacion',
      accent: 'yellow',
      resourceId: page.id,
    }));

    return [...staticCards, ...resourcePageCards, ...documentCards, ...linkCards];
  }, [documentsState, linksState, resourcePagesState]);

  const filteredCards = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return cards;

    return cards.filter((card) => {
      return (
        card.title.toLowerCase().includes(term) ||
        card.description.toLowerCase().includes(term) ||
        card.badge.toLowerCase().includes(term)
      );
    });
  }, [cards, searchTerm]);

  const deleteCard = async () => {
    if (!deleteDraft) return;

    setDeleteError('');
    setDeleteBusy(true);

    try {
      if (deleteDraft.kind === 'document') {
        const response = await fetch(`/api/admin/documentos?id=${deleteDraft.resourceId}`, { method: 'DELETE', credentials: 'include' });
        if (!response.ok) throw new Error('No se pudo eliminar el documento');
        setDocumentsState((prev) => prev.filter((item) => item.id !== deleteDraft.resourceId));
        setDeleteDraft(null);
        return;
      }

      if (deleteDraft.kind === 'link') {
        const response = await fetch(`/api/admin/links?id=${deleteDraft.resourceId}`, { method: 'DELETE', credentials: 'include' });
        if (!response.ok) throw new Error('No se pudo eliminar el enlace');
        setLinksState((prev) => prev.filter((item) => item.id !== deleteDraft.resourceId));
        setDeleteDraft(null);
        return;
      }

      const response = await fetch(`/api/admin/resource-pages?id=${deleteDraft.resourceId}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('No se pudo eliminar la pagina');
      setResourcePagesState((prev) => prev.filter((item) => item.id !== deleteDraft.resourceId));
      setDeleteDraft(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleteBusy(false);
    }
  };

  const headerBg = (accent: CardItem['accent']) => {
    if (accent === 'green') return 'bg-gradient-to-br from-green-200 to-green-400';
    if (accent === 'blue') return 'bg-gradient-to-br from-blue-200 to-blue-400';
    return 'bg-gradient-to-br from-yellow-200 to-yellow-400';
  };

  const actionBg = (accent: CardItem['accent']) => {
    if (accent === 'green') return 'bg-green-300 group-hover:bg-green-400';
    if (accent === 'blue') return 'bg-blue-300 group-hover:bg-blue-400';
    return 'bg-yellow-300 group-hover:bg-yellow-400';
  };

  return (
    <>
      <div className="mb-6 rounded-lg border border-yellow-200 bg-white p-4 shadow-md">
        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-stone-500">
          Buscar en recursos
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, descripción o tipo..."
            className="w-full rounded-xl border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/10"
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-stone-500">{filteredCards.length} cards encontradas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-20">
        {filteredCards.map((card) => {
          const content = (
            <>
              <div className={`${headerBg(card.accent)} h-44 flex items-center justify-center relative overflow-hidden`}>
                {isAdmin && card.kind !== 'static' && (
                  <div className="absolute right-2 top-2 z-20 flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditModal(card);
                      }}
                      className="rounded-full bg-white/90 px-2 py-1 text-xs font-black text-brand-brown hover:bg-white"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteModal(card);
                      }}
                      className="rounded-full bg-white/90 px-2 py-1 text-xs font-black text-red-700 hover:bg-white"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {card.kind === 'static' && card.id === 'static-temario' && (
                  <BookOpen size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
                )}
                {card.kind === 'static' && card.id === 'static-carta' && (
                  <Mail size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
                )}
                {card.kind === 'static' && card.id === 'static-presentaciones' && (
                  <GraduationCap size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
                )}
                {card.kind === 'resource-page' && (
                  <GraduationCap size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
                )}
                {card.kind === 'document' && (
                  <FileText size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
                )}
                {card.kind === 'link' && (
                  <LinkIcon size={64} className="text-brand-brown/90 group-hover:scale-110 transition-transform duration-500 relative z-10" strokeWidth={1.5} />
                )}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-2xl font-bold text-brand-brown mb-2 line-clamp-2">{card.title}</h3>
                <p className="text-gray-600 mb-2 text-xs font-semibold uppercase tracking-wide">{card.badge}</p>
                <p className="text-gray-600 mb-6 flex-1 leading-relaxed line-clamp-3">{card.description}</p>
                {card.href.startsWith('/') ? (
                  <Link
                    href={card.href}
                    className={`inline-flex items-center justify-center gap-2 w-full text-center px-6 py-3 text-brand-brown font-bold rounded-lg transition-colors no-underline ${actionBg(card.accent)}`}
                  >
                    {card.kind === 'link' ? <ExternalLink size={16} /> : null}
                    {card.kind === 'link' ? 'Abrir enlace' : 'Abrir recurso'}
                  </Link>
                ) : (
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 w-full text-center px-6 py-3 text-brand-brown font-bold rounded-lg transition-colors no-underline ${actionBg(card.accent)}`}
                  >
                    {card.kind === 'link' ? <ExternalLink size={16} /> : null}
                    {card.kind === 'link' ? 'Abrir enlace' : 'Abrir recurso'}
                  </a>
                )}
              </div>
            </>
          );

          return (
            <article
              key={card.id}
              className="group flex flex-col bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              {content}
            </article>
          );
        })}
      </div>

      {editDraft && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-2xl">
            <div className="border-b border-stone-200 px-5 py-4">
              <h3 className="text-lg font-black text-brand-brown">Editar recurso</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                {editDraft.kind === 'document' && 'Documento'}
                {editDraft.kind === 'link' && 'Enlace'}
                {editDraft.kind === 'resource-page' && 'Pagina de formacion'}
              </p>
            </div>

            <form
              className="space-y-3 px-5 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitEdit().catch(() => undefined);
              }}
            >
              <input
                value={editDraft.title}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                placeholder="Titulo"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
                required
              />
              <textarea
                value={editDraft.description}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                rows={3}
                placeholder="Descripcion"
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />

              {editDraft.kind === 'link' && (
                <input
                  value={editDraft.url}
                  onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, url: e.target.value } : prev))}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-stone-300 px-3 py-2"
                  required
                />
              )}

              {editError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editBusy}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                >
                  {editBusy ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDraft && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl">
            <div className="border-b border-stone-200 px-5 py-4">
              <h3 className="text-lg font-black text-red-700">Eliminar recurso</h3>
            </div>

            <div className="space-y-3 px-5 py-4">
              <p className="text-sm text-stone-700">
                Vas a eliminar <span className="font-bold">{deleteDraft.title}</span>. Esta accion no se puede deshacer.
              </p>

              {deleteError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleteBusy}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => deleteCard().catch(() => undefined)}
                  disabled={deleteBusy}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                >
                  {deleteBusy ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

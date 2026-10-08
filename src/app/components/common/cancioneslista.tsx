'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Music } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { SearchBar } from '@/app/components/common/search-bar';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';
import { AdminActionButton } from '@/app/components/common/admin-action-button';
import { SectionNote } from '@/app/components/common/area-sections';

type Cancion = {
  title: string;
  slug: string;
  artist?: string;
};

type CancionDraft = {
  slug: string;
  title: string;
  artist: string;
  content: string;
};

const EMPTY_DRAFT: CancionDraft = {
  slug: '',
  title: '',
  artist: '',
  content: '',
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export default function CancionesLista({ canciones }: { canciones: Cancion[] }) {
  const { isAdmin } = useSession();
  const [busqueda, setBusqueda] = useState('');
  const [songsState, setSongsState] = useState(canciones);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<CancionDraft>(EMPTY_DRAFT);

  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [deleteDraft, setDeleteDraft] = useState<Cancion | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const cancionesFiltradas = useMemo(() => {
    return songsState
      .filter((c) =>
        c.title.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.artist || '').toLowerCase().includes(busqueda.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [busqueda, songsState]);

  const openCreateModal = () => {
    setEditingSlug(null);
    setDraft(EMPTY_DRAFT);
    setSaveError('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (saveBusy) return;
    setIsEditorOpen(false);
    setEditingSlug(null);
    setDraft(EMPTY_DRAFT);
    setSaveError('');
  };

  const openEditModal = async (song: Cancion) => {
    setSaveError('');
    setSaveBusy(true);
    try {
      const res = await fetch(`/api/admin/canciones/${song.slug}`, { credentials: 'include' });
      if (!res.ok) throw new Error('No se pudo cargar la canción');
      const data = await res.json();
      setEditingSlug(song.slug);
      setDraft({
        slug: String(data.slug || song.slug),
        title: String(data.title || song.title),
        artist: String(data.artist || song.artist || ''),
        content: String(data.content || ''),
      });
      setIsEditorOpen(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al cargar');
    } finally {
      setSaveBusy(false);
    }
  };

  const submitSong = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError('');
    const slug = normalizeSlug(draft.slug || draft.title);
    if (!draft.title || !draft.artist || !draft.content) return setSaveError('Todos los campos son obligatorios.');

    setSaveBusy(true);
    try {
      const isEdit = Boolean(editingSlug);
      const url = isEdit ? `/api/admin/canciones/${editingSlug}` : '/api/admin/canciones';
      const method = isEdit ? 'PUT' : 'POST';
      const payload = isEdit ? { title: draft.title, artist: draft.artist, content: draft.content } : { ...draft };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error al guardar');

      const nextSong: Cancion = { title: draft.title, slug: isEdit ? editingSlug! : slug, artist: draft.artist };
      setSongsState(prev => isEdit ? prev.map(s => s.slug === editingSlug ? nextSong : s) : [...prev, nextSong]);
      setIsEditorOpen(false);
      setEditingSlug(null);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      setSaveError('Error al guardar en el servidor');
    } finally { setSaveBusy(false); }
  };

  const deleteSong = async () => {
    if (!deleteDraft) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/canciones/${deleteDraft.slug}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Error al eliminar');
      setSongsState(prev => prev.filter(s => s.slug !== deleteDraft.slug));
      setDeleteDraft(null);
    } catch (err) { setDeleteError('No se pudo eliminar'); } 
    finally { setDeleteBusy(false); }
  };

  const inputClass = "modal-input-unified";
  const labelClass = "block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 ml-1";

  return (
    <>
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <SearchBar
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por título o artista..."
            className="w-full sm:flex-1"
          />
          <div className="flex shrink-0 items-center justify-between gap-3">
            <p className="m-0 max-w-none text-left text-sm font-semibold tabular-nums text-brand-ink/60">
              {songsState.length} {songsState.length === 1 ? 'canción' : 'canciones'}
            </p>
            {isAdmin && (
              <AdminActionButton action="add" label="Nueva Canción" onClick={openCreateModal} />
            )}
          </div>
        </div>

        <ul className="m-0 list-none overflow-hidden rounded-2xl bg-white p-0 shadow-[0_10px_28px_-20px_rgba(58,21,8,0.4)] ring-1 ring-brand-brown/10 empty:hidden">
          {cancionesFiltradas.map((cancion) => (
            <li
              key={cancion.slug}
              className="group relative flex items-center gap-2 border-t border-brand-brown/10 transition-colors first:border-t-0 hover:bg-emerald-50"
            >
              <Link
                href={`/animacion/canciones/${cancion.slug}`}
                className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3.5 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-700 sm:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Music size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[17px] font-bold leading-snug text-brand-ink line-clamp-2">
                    {cancion.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-brand-ink/60">
                    {cancion.artist || 'Artista desconocido'}
                  </span>
                </span>
                <ChevronRight size={18} aria-hidden className="shrink-0 text-emerald-800 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transform-none" />
              </Link>

              {isAdmin && (
                <div className="flex gap-1 pr-3 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <AdminActionButton action="edit" compact onClick={() => openEditModal(cancion)} />
                  <AdminActionButton action="delete" compact onClick={() => { setDeleteError(''); setDeleteDraft(cancion); }} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {cancionesFiltradas.length === 0 && (
          <SectionNote>
            {busqueda.trim() ? `No encontramos canciones que coincidan con "${busqueda}".` : 'Todavía no hay canciones cargadas.'}
          </SectionNote>
        )}
      </section>

      {/* MODAL EDITOR */}
      {isEditorOpen && (
        <div className="modal-overlay-unified">
          <div className="modal-panel-unified max-h-[90vh] max-w-2xl flex flex-col rounded-[2.5rem]">
            <div className="modal-header-unified flex items-center justify-between p-6">
              <h2 className="modal-title-unified italic">
                {editingSlug ? 'Editar Canción' : 'Nueva Canción'}
              </h2>
              <AdminActionButton action="close" compact onClick={closeEditor} />
            </div>

            <form onSubmit={submitSong} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Título *</label>
                  <input type="text" className={inputClass} value={draft.title} onChange={(e) => setDraft(prev => ({...prev, title: e.target.value, slug: editingSlug ? prev.slug : normalizeSlug(e.target.value)}))} required />
                </div>
                <div>
                  <label className={labelClass}>Artista *</label>
                  <input type="text" className={inputClass} value={draft.artist} onChange={(e) => setDraft(prev => ({...prev, artist: e.target.value}))} required />
                </div>
              </div>

              <div>
                <label className={labelClass}>Letra y Acordes</label>
                <textarea className={`${inputClass} font-mono text-xs leading-relaxed`} rows={12} value={draft.content} onChange={(e) => setDraft(prev => ({...prev, content: e.target.value}))} placeholder="[G] El acorde va entre corchetes antes de la palabra" required />
              </div>

              {saveError && <p className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{saveError}</p>}

              <div className="flex gap-3 pt-4">
                <AdminActionButton action="close" label="Cancelar" tone="neutral" className="flex-1 py-3" onClick={closeEditor} />
                <AdminActionButton action="save" type="submit" disabled={saveBusy} label="Guardar" className="flex-[2] py-3 uppercase tracking-widest" />
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteDraft)}
        title="Eliminar cancion"
        itemName={deleteDraft?.title || ''}
        error={deleteError}
        busy={deleteBusy}
        confirmLabel="Si, borrar"
        onCancel={() => setDeleteDraft(null)}
        onConfirm={() => {
          deleteSong();
        }}
      />
    </>
  );
}

'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Music, Hash } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { SearchBar } from '@/app/components/common/search-bar';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';
import { AdminActionButton } from '@/app/components/common/admin-action-button';

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
      <div className="w-full max-w-4xl mx-auto space-y-6">
        
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por título o artista..."
        />

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
            <Hash size={12}/> {songsState.length} canciones encontradas
          </div>
          {isAdmin && (
            <AdminActionButton action="add" label="Nueva Canción" onClick={openCreateModal} />
          )}
        </div>

        {/* LISTADO TIPO BENTO */}
        <div className="grid grid-cols-1 gap-2">
          {cancionesFiltradas.map((cancion) => (
            <div key={cancion.slug} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 hover:border-emerald-200 hover:shadow-md transition-all">
              <Link href={`/animacion/canciones/${cancion.slug}`} className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-50 rounded-lg text-stone-400 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-colors">
                    <Music size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-900 leading-none">{cancion.title}</h3>
                    <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-tighter">{cancion.artist || 'Artista desconocido'}</p>
                  </div>
                </div>
              </Link>

              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdminActionButton action="edit" compact onClick={() => openEditModal(cancion)} />
                  <AdminActionButton action="delete" compact onClick={() => { setDeleteError(''); setDeleteDraft(cancion); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL EDITOR */}
      {isEditorOpen && (
        <div className="modal-overlay-unified">
          <div className="modal-panel-unified max-h-[90vh] max-w-2xl flex flex-col rounded-[2.5rem]">
            <div className="modal-header-unified flex items-center justify-between p-6">
              <h2 className="modal-title-unified italic">
                {editingSlug ? 'Editar Canción' : 'Nueva Canción'}
              </h2>
              <AdminActionButton action="close" compact onClick={() => setIsEditorOpen(false)} />
            </div>

            <form onSubmit={submitSong} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Título *</label>
                  <input type="text" className={inputClass} value={draft.title} onChange={(e) => setDraft(prev => ({...prev, title: e.target.value, slug: editingSlug ? prev.slug : normalizeSlug(e.target.value)}))} required />
                </div>
                <div>
                  <label className={labelClass}>Artista *</label>
                  <input type="text" className={inputClass} value={draft.artist} onChange={(e) => setDraft(prev => ({...prev, artist: e.target.value}))} required />
                </div>
              </div>

              {!editingSlug && (
                <div>
                  <label className={labelClass}>Slug (URL)</label>
                  <input type="text" className={inputClass} value={draft.slug} disabled />
                </div>
              )}

              <div>
                <label className={labelClass}>Letra y Acordes</label>
                <textarea className={`${inputClass} font-mono text-xs leading-relaxed`} rows={12} value={draft.content} onChange={(e) => setDraft(prev => ({...prev, content: e.target.value}))} placeholder="[G] El acorde va entre corchetes antes de la palabra" required />
              </div>

              {saveError && <p className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{saveError}</p>}

              <div className="flex gap-3 pt-4">
                <AdminActionButton action="close" label="Cancelar" tone="neutral" className="flex-1 py-3" onClick={() => setIsEditorOpen(false)} />
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
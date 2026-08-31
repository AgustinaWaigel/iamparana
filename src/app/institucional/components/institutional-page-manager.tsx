'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileUp, Layers3, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';

type InstitutionalSection = { id: number; slug: string; title: string; description: string | null };
type Modal = 'menu' | 'create' | 'edit' | null;

export function InstitutionalPageManager({ pages: sections }: { pages: InstitutionalSection[] }) {
  const router = useRouter();
  const { isAdmin } = useSession();
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<InstitutionalSection | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [remove, setRemove] = useState<InstitutionalSection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!sections.length && !isAdmin) return null;

  const openCreate = () => { setForm({ title: '', description: '' }); setError(''); setModal('create'); };
  const openEdit = (section: InstitutionalSection) => { setSelected(section); setForm({ title: section.title, description: section.description || '' }); setError(''); setModal('edit'); };

  const createSection = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const pageResponse = await fetch('/api/admin/resource-pages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'institucional', title: form.title, description: form.description, slug: '', textureUrl: '/assets/textures/areasg.webp', template: 'earth' }) });
      const pageData = await pageResponse.json().catch(() => ({}));
      if (!pageResponse.ok) throw new Error(pageData.error || 'No se pudo crear la sección');

      const contentResponse = await fetch('/api/admin/resource-sections', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId: Number(pageData.id), title: form.title, slug: '' }) });
      const contentData = await contentResponse.json().catch(() => ({}));
      if (!contentResponse.ok) throw new Error(contentData.error || 'La sección se creó, pero no se pudo preparar para recibir recursos');

      setModal(null); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocurrió un error'); } finally { setBusy(false); }
  };

  const updateSection = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/resource-pages', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, title: form.title, description: form.description, textureUrl: '/assets/textures/areasg.webp', template: 'earth' }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la sección');
      setModal(null); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocurrió un error'); } finally { setBusy(false); }
  };

  const deleteSection = async () => {
    if (!remove) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/resource-pages?id=${remove.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar la sección');
      setRemove(null); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocurrió un error'); } finally { setBusy(false); }
  };

  return <section>
    {isAdmin && <button onClick={() => { setModal('menu'); setError(''); }} className="fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 rounded-full bg-brand-brown p-4 font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-amber-900 hover:shadow-xl md:px-5"><Pencil size={21} /><span className="hidden md:inline">Editar recursos</span></button>}

    {modal && <div className="modal-overlay-unified"><div className="modal-panel-unified max-w-lg">
      <div className="modal-header-unified flex items-center justify-between"><div><h2 className="modal-title-unified">{modal === 'menu' ? 'Editar recursos' : modal === 'create' ? 'Nueva sección' : 'Editar sección'}</h2><p className="modal-subtitle-unified">Información Institucional</p></div><button type="button" onClick={() => setModal(null)} className="modal-close-unified"><X size={20} /></button></div>
      {modal === 'menu' ? <div className="modal-body-unified">
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={openCreate} className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm font-bold text-stone-700 hover:border-amber-400 hover:bg-amber-50"><Layers3 size={25} /> Nueva sección</button><button type="button" onClick={() => { setModal(null); window.dispatchEvent(new CustomEvent('institutional:add-document')); }} className="flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm font-bold text-stone-700 hover:border-amber-400 hover:bg-amber-50"><FileUp size={25} /> Agregar recurso</button></div>
        {sections.length > 0 && <div className="mt-6 border-t border-stone-200 pt-5"><p className="!mx-0 !mb-3 !max-w-none text-xs font-black uppercase tracking-wider text-stone-500">Secciones</p><div className="space-y-2">{sections.map((section) => <div key={section.id} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2"><span className="min-w-0 flex-1 truncate px-2 text-sm font-bold text-stone-700">{section.title}</span><button type="button" onClick={() => openEdit(section)} className="rounded-lg p-2 text-stone-500 hover:bg-amber-50 hover:text-amber-800" aria-label={`Editar ${section.title}`}><Pencil size={17} /></button><button type="button" onClick={() => setRemove(section)} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${section.title}`}><Trash2 size={17} /></button></div>)}</div></div>}
      </div> : <form onSubmit={modal === 'create' ? createSection : updateSection} className="modal-body-unified">{error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<div><label className="modal-label-unified">Título *</label><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="modal-input-unified" placeholder="Ej: Protocolos" /></div><div><label className="modal-label-unified">Descripción</label><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="modal-input-unified resize-none" /></div><div className="modal-actions-unified"><button type="button" onClick={() => setModal('menu')} className="modal-btn-secondary-unified">Volver</button><button disabled={busy} className="modal-btn-primary-unified">{busy && <Loader2 size={16} className="animate-spin" />}{modal === 'create' ? 'Crear sección' : 'Guardar cambios'}</button></div></form>}
    </div></div>}

    <DeleteConfirmModal isOpen={Boolean(remove)} title="Eliminar sección" itemName={remove?.title || ''} error={error || null} busy={busy} onCancel={() => !busy && setRemove(null)} onConfirm={() => void deleteSection()} />
  </section>;
}

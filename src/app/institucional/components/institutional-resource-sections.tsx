'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, FileText, Link as LinkIcon, Pencil, Trash2, X } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';

type Resource = { id: number; kind: 'document' | 'link'; title: string; description: string | null; href: string | null };
type Section = { id: number; title: string; resources: Resource[] };
type PageGroup = { id: number; title: string; description: string | null; sections: Section[] };

export function InstitutionalResourceSections({ groups }: { groups: PageGroup[] }) {
  const router = useRouter();
  const { isAdmin } = useSession();
  const [edit, setEdit] = useState<Resource | null>(null);
  const [remove, setRemove] = useState<Resource | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!edit) return;
    setBusy(true); setError('');
    try {
      const endpoint = edit.kind === 'document' ? '/api/admin/documentos' : `/api/admin/links?id=${edit.id}`;
      const body = edit.kind === 'document'
        ? { id: edit.id, title: edit.title, description: edit.description || '', googleDriveUrl: edit.href || '' }
        : { title: edit.title, description: edit.description || '', url: edit.href || '', icon: 'link' };
      const response = await fetch(endpoint, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el recurso');
      setEdit(null); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocurrió un error'); } finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    if (!remove) return;
    setBusy(true); setError('');
    try {
      const endpoint = remove.kind === 'document' ? '/api/admin/documentos' : '/api/admin/links';
      const response = await fetch(`${endpoint}?id=${remove.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el recurso');
      setRemove(null); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocurrió un error'); } finally { setBusy(false); }
  };

  return <>
    <div className="space-y-14">{groups.map((group) => <section key={group.id}>
      <div className="mb-6 border-l-4 border-[#622d0d] pl-4"><h2 className="!m-0 text-3xl font-black text-stone-900">{group.title}</h2>{group.description && <p className="!mx-0 !mb-0 !mt-2 !max-w-3xl text-stone-600">{group.description}</p>}</div>
      <div className="space-y-8">{group.sections.map((section) => section.resources.length > 0 && <div key={section.id}>
        {section.title !== group.title && <h3 className="!mb-4 !mt-0 text-xl font-black text-stone-800">{section.title}</h3>}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{section.resources.map((resource) => {
          const Icon = resource.kind === 'document' ? FileText : LinkIcon;
          return <article key={`${resource.kind}-${resource.id}`} className="group relative flex min-h-64 flex-col items-start rounded-3xl bg-stone-950 p-7 text-left text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#211e1d] hover:shadow-xl">
            {isAdmin && <div className="absolute right-4 top-4 z-10 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"><button type="button" onClick={() => { setError(''); setEdit({ ...resource }); }} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label={`Editar ${resource.title}`}><Pencil size={16} /></button><button type="button" onClick={() => { setError(''); setRemove(resource); }} className="rounded-full bg-white/10 p-2 text-white hover:bg-red-600" aria-label={`Eliminar ${resource.title}`}><Trash2 size={16} /></button></div>}
            <div className="mb-7 flex w-full items-center justify-between pr-16"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Icon size={20} /></span><span className="text-xs font-black uppercase tracking-widest text-stone-400">{resource.kind === 'document' ? 'Documento' : 'Enlace'}</span></div>
            <h4 className="!m-0 text-xl font-black leading-tight text-white">{resource.title}</h4>{resource.description && <p className="!mx-0 !mb-0 !mt-3 !max-w-none text-left !text-sm leading-relaxed text-stone-300">{resource.description}</p>}
            <a href={resource.href || '#'} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black text-amber-300 no-underline">Abrir recurso <ExternalLink size={15} /></a>
          </article>;
        })}</div>
      </div>)}</div>
    </section>)}</div>

    {edit && <div className="modal-overlay-unified"><div className="modal-panel-unified max-w-lg"><div className="modal-header-unified flex items-center justify-between"><div><h2 className="modal-title-unified">Editar recurso</h2><p className="modal-subtitle-unified">{edit.kind === 'document' ? 'Documento' : 'Enlace'}</p></div><button type="button" onClick={() => setEdit(null)} className="modal-close-unified"><X size={20} /></button></div><form onSubmit={save} className="modal-body-unified">{error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<div><label className="modal-label-unified">Título *</label><input required value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} className="modal-input-unified" /></div><div><label className="modal-label-unified">Descripción</label><textarea value={edit.description || ''} onChange={(event) => setEdit({ ...edit, description: event.target.value })} rows={3} className="modal-input-unified resize-none" /></div>{edit.kind === 'link' && <div><label className="modal-label-unified">Enlace *</label><input required type="url" value={edit.href || ''} onChange={(event) => setEdit({ ...edit, href: event.target.value })} className="modal-input-unified" /></div>}<div className="modal-actions-unified"><button type="button" onClick={() => setEdit(null)} className="modal-btn-secondary-unified">Cancelar</button><button disabled={busy} className="modal-btn-primary-unified">{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></form></div></div>}
    <DeleteConfirmModal isOpen={Boolean(remove)} title="Eliminar recurso" itemName={remove?.title || ''} error={error || null} busy={busy} onCancel={() => !busy && setRemove(null)} onConfirm={() => void confirmDelete()} />
  </>;
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, FileText, FolderOpen, Link as LinkIcon, Pencil, Trash2, X } from 'lucide-react';
import { useSession } from '@/app/hooks/use-session';
import { DeleteConfirmModal } from '@/app/components/common/delete-confirm-modal';

type Resource = { id: number; kind: 'document' | 'link'; title: string; description: string | null; href: string | null };
type Section = { id: number; title: string; resources: Resource[] };
type PageGroup = { id: number; title: string; description: string | null; sections: Section[] };

// Cada grupo de documentos (protocolos, orientaciones...) lleva un color, siempre en este orden.
const COLORES = [
  { fondo: 'bg-red-600 text-white', texto: 'text-red-700' },
  { fondo: 'bg-blue-700 text-white', texto: 'text-blue-800' },
  { fondo: 'bg-emerald-700 text-white', texto: 'text-emerald-800' },
  { fondo: 'bg-brand-deep text-white', texto: 'text-brand-brown' },
];

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
    <div className="space-y-12 sm:space-y-16">
      {groups.map((group, groupIndex) => {
        const color = COLORES[groupIndex % COLORES.length];
        const total = group.sections.reduce((suma, section) => suma + section.resources.length, 0);
        return (
          <section key={group.id} aria-labelledby={`grupo-doc-${group.id}`}>
            <div className="flex items-center gap-4">
              <span aria-hidden className={`flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${color.fondo}`}>
                <FolderOpen className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <h3 id={`grupo-doc-${group.id}`} className="m-0 text-balance text-left font-display text-[clamp(1.6rem,3.6vw,2.25rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-brand-ink">{group.title}</h3>
                <p className="m-0 mt-1 max-w-none text-left text-sm font-bold text-brand-ink/65">{total} {total === 1 ? 'recurso' : 'recursos'}</p>
              </div>
            </div>
            {group.description && <p className="m-0 mt-4 max-w-2xl text-left text-base leading-relaxed text-brand-ink/80">{group.description}</p>}

            {total === 0 ? (
              <p className="m-0 mt-5 max-w-none rounded-2xl border border-dashed border-brand-brown/25 px-5 py-8 text-center text-base text-brand-ink/70">Todavía no hay documentos en esta sección.</p>
            ) : (
              <div className="mt-6 space-y-7">
                {group.sections.map((section) => section.resources.length > 0 && (
                  <div key={section.id}>
                    {section.title !== group.title && <h4 className="m-0 mb-3 text-left font-display text-lg font-extrabold text-brand-ink">{section.title}</h4>}
                    <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
                      {section.resources.map((resource) => {
                        const Icon = resource.kind === 'document' ? FileText : LinkIcon;
                        return (
                          <li key={`${resource.kind}-${resource.id}`} className="group relative flex items-start gap-4 rounded-2xl bg-white p-4 shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none sm:p-5">
                            <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:-rotate-6 motion-reduce:transform-none ${color.fondo}`}>
                              <Icon size={22} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <a
                                href={resource.href || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded text-left font-display text-lg font-extrabold leading-snug text-brand-ink no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-brown"
                              >
                                {resource.title}
                              </a>
                              {resource.description && <p className="m-0 mt-1 line-clamp-3 max-w-none text-left text-sm leading-relaxed text-brand-ink/75">{resource.description}</p>}
                              <p className={`m-0 mt-2 flex max-w-none items-center gap-1.5 text-left text-sm font-bold ${color.texto}`}>
                                {resource.kind === 'document' ? 'Abrir el documento' : 'Abrir el enlace'}
                                <ArrowUpRight size={16} aria-hidden className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="relative z-10 flex shrink-0 gap-1">
                                <button type="button" onClick={() => { setError(''); setEdit({ ...resource }); }} className="rounded-full p-2 text-brand-ink/60 transition-colors hover:bg-brand-cream hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown" aria-label={`Editar ${resource.title}`}><Pencil size={16} /></button>
                                <button type="button" onClick={() => { setError(''); setRemove(resource); }} className="rounded-full p-2 text-brand-ink/60 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700" aria-label={`Eliminar ${resource.title}`}><Trash2 size={16} /></button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>

    {edit && <div className="modal-overlay-unified"><div className="modal-panel-unified max-w-lg"><div className="modal-header-unified flex items-center justify-between"><div><h2 className="modal-title-unified">Editar recurso</h2><p className="modal-subtitle-unified">{edit.kind === 'document' ? 'Documento' : 'Enlace'}</p></div><button type="button" onClick={() => setEdit(null)} className="modal-close-unified"><X size={20} /></button></div><form onSubmit={save} className="modal-body-unified">{error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<div><label className="modal-label-unified">Título *</label><input required value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} className="modal-input-unified" /></div><div><label className="modal-label-unified">Descripción</label><textarea value={edit.description || ''} onChange={(event) => setEdit({ ...edit, description: event.target.value })} rows={3} className="modal-input-unified resize-none" /></div>{edit.kind === 'link' && <div><label className="modal-label-unified">Enlace *</label><input required type="url" value={edit.href || ''} onChange={(event) => setEdit({ ...edit, href: event.target.value })} className="modal-input-unified" /></div>}<div className="modal-actions-unified"><button type="button" onClick={() => setEdit(null)} className="modal-btn-secondary-unified">Cancelar</button><button disabled={busy} className="modal-btn-primary-unified">{busy ? 'Guardando…' : 'Guardar cambios'}</button></div></form></div></div>}
    <DeleteConfirmModal isOpen={Boolean(remove)} title="Eliminar recurso" itemName={remove?.title || ''} error={error || null} busy={busy} onCancel={() => !busy && setRemove(null)} onConfirm={() => void confirmDelete()} />
  </>;
}

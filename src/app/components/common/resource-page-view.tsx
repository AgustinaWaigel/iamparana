import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { AreaHero, AreaPage } from './area-hero';
import { AreaSection, LinkCard, LinkGrid, SectionNote } from './area-sections';
import type { AreaKey } from './area-theme';

interface ResourcePageData {
  page: { title: string; description?: string | null; texture_url?: string | null };
  sections: Array<{
    id: number;
    title: string;
    documents: Array<{ id: number; title: string; description?: string | null; google_drive_url?: string | null }>;
    links: Array<{ id: number; title: string; description?: string | null; url: string }>;
  }>;
}

interface ResourcePageViewProps {
  area: AreaKey;
  data: ResourcePageData;
  /** Muestra los controles de edición que ya tenían estas páginas para administradores. */
  showAdminControls?: boolean;
  /** Botón flotante de edición u otros agregados de la página. */
  children?: ReactNode;
}

const ADMIN_ICON_BUTTON =
  'rounded-lg bg-white p-1.5 text-stone-500 shadow-sm ring-1 ring-black/5 transition-colors hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown';

/** Vista común de las páginas de recursos (`/<área>/recursos/[slug]`). */
export function ResourcePageView({ area, data, showAdminControls = false, children }: ResourcePageViewProps) {
  const cardOverlay = showAdminControls ? (
    <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
      <button type="button" aria-label="Editar recurso" className={ADMIN_ICON_BUTTON}><Pencil size={14} /></button>
      <button type="button" aria-label="Eliminar recurso" className={`${ADMIN_ICON_BUTTON} hover:text-red-600`}><Trash2 size={14} /></button>
    </div>
  ) : undefined;

  return (
    <AreaPage
      hero={
        <AreaHero
          area={area}
          title={data.page.title}
          description={data.page.description || undefined}
          textureUrl={data.page.texture_url}
          crumbs={[]}
        />
      }
    >
      {data.sections.map((section) => {
        const totalResources = section.documents.length + section.links.length;

        return (
          <AreaSection
            key={section.id}
            title={section.title}
            meta={`${totalResources} ${totalResources === 1 ? 'recurso' : 'recursos'}`}
            actions={showAdminControls ? (
              <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/section:opacity-100">
                <button type="button" title="Editar sección" aria-label="Editar sección" className={ADMIN_ICON_BUTTON}><Pencil size={16} /></button>
                <button type="button" title="Eliminar sección" aria-label="Eliminar sección" className={`${ADMIN_ICON_BUTTON} hover:text-red-600`}><Trash2 size={16} /></button>
              </div>
            ) : undefined}
          >
            <LinkGrid>
              {section.documents.map((doc) => (
                <LinkCard
                  key={`doc-${doc.id}`}
                  area={area}
                  kind="doc"
                  label="Documento"
                  title={doc.title}
                  description={doc.description}
                  href={doc.google_drive_url || '#'}
                  overlay={cardOverlay}
                />
              ))}
              {section.links.map((link) => (
                <LinkCard
                  key={`link-${link.id}`}
                  area={area}
                  kind="link"
                  label="Enlace"
                  title={link.title}
                  description={link.description}
                  href={link.url}
                  overlay={cardOverlay}
                />
              ))}
              {totalResources === 0 && <SectionNote>Esta sección aún no tiene recursos.</SectionNote>}
            </LinkGrid>
          </AreaSection>
        );
      })}

      {children}
    </AreaPage>
  );
}

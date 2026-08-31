import { notFound } from 'next/navigation';
import { HeroSection } from '@/app/components/common/hero-section';
import { getResourcePageWithContent } from '@/server/db/resource-pages-repository';
import { InstitutionalResourceSections } from '@/app/institucional/components/institutional-resource-sections';
import { ResourcePageEditorFab } from '@/app/components/common/resource-page-editor-fab';

export const dynamic = 'force-dynamic';

export default async function InstitutionalResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getResourcePageWithContent(slug);
  if (!detail) notFound();

  const groups = [{
    id: detail.page.id,
    title: detail.page.title,
    description: detail.page.description,
    sections: detail.sections.map((section) => ({
      id: section.id,
      title: section.title,
      resources: [
        ...section.documents.map((item) => ({ id: item.id, kind: 'document' as const, title: item.title, description: item.description, href: item.google_drive_url })),
        ...section.links.map((item) => ({ id: item.id, kind: 'link' as const, title: item.title, description: item.description, href: item.url })),
      ],
    })),
  }];

  return <>
    <HeroSection title={detail.page.title} textureUrl={detail.page.texture_url || '/assets/textures/areasg.webp'} overlayColor="rgba(41,37,36,.88), rgba(98,45,13,.84)" gradientClass="from-stone-950 to-amber-950" description={detail.page.description || 'Recursos de Información Institucional.'} textColor="text-white" />
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <InstitutionalResourceSections groups={groups} />
    </main>
    <ResourcePageEditorFab page={{ ...detail.page }} initialSections={detail.sections.map((section) => ({ id: section.id, title: section.title, section_key: section.section_key }))} />
  </>;
}

import type { Metadata } from 'next';
import { HeroSection } from '@/app/components/common/hero-section';
import { getAreaLandingContent } from '@/server/db/admin-repository';
import { getResourcePageWithContent } from '@/server/db/resource-pages-repository';
import { InstitutionalDocuments } from './components/institucional-documents';
import { InstitutionalPageManager } from './components/institutional-page-manager';
import { InstitutionalResourceSections } from './components/institutional-resource-sections';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Institucional', description: 'Documentos oficiales, protocolos y recursos institucionales de IAM Paraná.', alternates: { canonical: '/institucional' } };

export default async function InstitucionalPage() {
  const content = await getAreaLandingContent('institucional', ['institucional']);
  const pages: Array<{ id: number; slug: string; title: string; description: string | null }> = JSON.parse(JSON.stringify(content.pages)).map((item: Record<string, unknown>) => ({ id: Number(item.id), slug: String(item.slug || ''), title: String(item.title || ''), description: item.description ? String(item.description) : null })).reverse();
  const pageDetails = (await Promise.all(pages.map((page: { slug: string }) => getResourcePageWithContent(page.slug)))).filter(Boolean);
  const groups = pageDetails.flatMap((detail) => detail ? [{ id: detail.page.id, title: detail.page.title, description: detail.page.description, sections: detail.sections.map((section) => ({ id: section.id, title: section.title, resources: [...section.documents.map((item) => ({ id: item.id, kind: 'document' as const, title: item.title, description: item.description, href: item.google_drive_url })), ...section.links.map((item) => ({ id: item.id, kind: 'link' as const, title: item.title, description: item.description, href: item.url }))] })) }] : []);

  return <>
    <HeroSection title="Institucional" textureUrl="/assets/textures/areasg.webp" overlayColor="rgba(41,37,36,.86), rgba(98,45,13,.82)" gradientClass="from-stone-950 to-amber-950" description="Documentos oficiales, orientaciones y recursos para acompañar nuestra misión con responsabilidad y cuidado." textColor="text-white" />
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <InstitutionalResourceSections groups={groups} />
      <InstitutionalPageManager pages={pages} />
      <InstitutionalDocuments pages={pages} />
    </main>
  </>;
}

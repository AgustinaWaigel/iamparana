import { notFound } from 'next/navigation';
import { getResourcePageWithContent } from '@/server/db/resource-pages-repository';
import { ResourcePageEditorFab } from '@/app/components/common/resource-page-editor-fab';
import { ResourcePageView } from '@/app/components/common/resource-page-view';
import { getSessionUser } from '@/server/lib/api-utils';

export const dynamic = 'force-dynamic';

export default async function LogisticaResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getResourcePageWithContent(slug);
  if (!data || data.page.section !== 'logistica') notFound();

  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === 'admin';

  return (
    <ResourcePageView area="logistica" data={data} showAdminControls={false}>
      {isAdmin && <ResourcePageEditorFab page={{ ...data.page }} initialSections={data.sections.map((section) => ({ id: section.id, title: section.title, section_key: section.section_key }))} />}
    </ResourcePageView>
  );
}

import { notFound } from 'next/navigation';
import { getResourcePageWithContent } from '@/server/db/resource-pages-repository';
import { ResourcePageEditorFab } from '@/app/components/common/resource-page-editor-fab';
import { ResourcePageView } from '@/app/components/common/resource-page-view';
import { getSessionUser } from '@/server/lib/api-utils';

export const dynamic = 'force-dynamic';

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getResourcePageWithContent(slug);
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === 'admin';

  if (!data) notFound();

  return (
    <ResourcePageView area="comunicacion" data={data} showAdminControls={isAdmin}>
      <ResourcePageEditorFab page={{ ...data.page }} initialSections={data.sections.map((section) => ({ id: section.id, title: section.title, section_key: section.section_key }))} />
    </ResourcePageView>
  );
}

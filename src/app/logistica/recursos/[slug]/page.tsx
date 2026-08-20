import { notFound } from 'next/navigation';
import { ExternalLink, FileText, Link as LinkIcon } from 'lucide-react';
import { getResourcePageWithContent } from '@/server/db/resource-pages-repository';
import { ResourcePageEditorFab } from '@/app/components/common/resource-page-editor-fab';
import { getSessionUser } from '@/server/lib/api-utils';

export const dynamic = 'force-dynamic';

export default async function LogisticaResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getResourcePageWithContent(slug);
  if (!data || data.page.section !== 'logistica') notFound();

  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === 'admin';

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-gradient-to-br from-red-700 to-red-500 px-4 py-16 text-center text-white shadow-lg">
        <h1 className="mx-auto max-w-4xl break-words text-[clamp(1.8rem,9vw,3rem)] font-black leading-tight [overflow-wrap:anywhere]">{data.page.title}</h1>
        {data.page.description && <p className="mx-auto mt-4 max-w-2xl text-red-50">{data.page.description}</p>}
      </header>

      <section className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        {data.sections.map((section) => (
          <article key={section.id} className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-red-900">{section.title}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.documents.map((document) => (
                <a key={document.id} href={document.google_drive_url || '#'} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-stone-200 p-4 hover:border-red-300 hover:bg-red-50">
                  <FileText className="mb-3 text-red-600" size={22} /><h3 className="font-bold text-stone-900">{document.title}</h3>
                  {document.description && <p className="mt-1 text-sm text-stone-600">{document.description}</p>}
                </a>
              ))}
              {section.links.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-stone-200 p-4 hover:border-red-300 hover:bg-red-50">
                  <LinkIcon className="mb-3 text-red-600" size={22} /><h3 className="font-bold text-stone-900">{link.title}</h3>
                  {link.description && <p className="mt-1 text-sm text-stone-600">{link.description}</p>}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-700">Abrir <ExternalLink size={12} /></span>
                </a>
              ))}
              {section.documents.length + section.links.length === 0 && <p className="text-sm text-stone-500">Todavía no hay recursos en esta sección.</p>}
            </div>
          </article>
        ))}
      </section>

      {isAdmin && <ResourcePageEditorFab page={{ ...data.page }} initialSections={data.sections.map((section) => ({ id: section.id, title: section.title, section_key: section.section_key }))} />}
    </main>
  );
}

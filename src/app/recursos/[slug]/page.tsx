import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { getResourcePageWithContent } from "@/server/db/resource-pages-repository";
import { ResourcePageEditorFab } from "@/app/components/common/resource-page-editor-fab";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const TEMPLATE_MAP: Record<string, { bannerOverlay: string; titleColor: string; cardBorder: string }> = {
  gold: {
    bannerOverlay: "linear-gradient(90deg, rgba(253, 224, 71, 0.88), rgba(250, 204, 21, 0.9))",
    titleColor: "text-brand-brown",
    cardBorder: "border-yellow-200",
  },
  ocean: {
    bannerOverlay: "linear-gradient(90deg, rgba(59, 130, 246, 0.88), rgba(14, 165, 233, 0.9))",
    titleColor: "text-white",
    cardBorder: "border-blue-200",
  },
  earth: {
    bannerOverlay: "linear-gradient(90deg, rgba(120, 53, 15, 0.85), rgba(146, 64, 14, 0.9))",
    titleColor: "text-amber-100",
    cardBorder: "border-amber-300",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Cada página de recursos define su propia metadata según el slug solicitado.
  const { slug } = await params;
  const data = await getResourcePageWithContent(slug);

  if (!data) {
    return {
      title: "Recursos",
      description: "Pagina de recursos",
    };
  }

  return {
    title: data.page.title,
    description: data.page.description || `Recursos de ${data.page.title}`,
  };
}

export default async function ResourcePage({ params }: PageProps) {
  // Vista dinámica para cada página de recursos creada desde el panel de formación.
  const { slug } = await params;
  const data = await getResourcePageWithContent(slug);

  if (!data) {
    notFound();
  }

  const theme = TEMPLATE_MAP[data.page.template] || TEMPLATE_MAP.gold;
  const initialSections = JSON.parse(
    JSON.stringify(
      data.sections.map((section) => ({
        id: section.id,
        title: section.title,
        section_key: section.section_key,
      }))
    )
  ) as Array<{ id: number; title: string; section_key: string }>;

  return (
    <main className="pb-16">
      <div
        className="relative mt-16 overflow-hidden px-6 py-16 md:px-12 md:py-24 shadow-inner"
        style={{
          backgroundImage: `${theme.bannerOverlay}, url(${data.page.texture_url || "/assets/textures/formacion.webp"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className={`relative text-center text-4xl md:text-6xl font-black uppercase tracking-tight ${theme.titleColor}`}>
          {data.page.title}
        </h1>
        {data.page.description && (
          <p className={`relative mx-auto mt-4 max-w-3xl text-center font-semibold ${theme.titleColor}`}>
            {data.page.description}
          </p>
        )}
      </div>

      <section className="mx-auto mt-10 max-w-7xl px-4 space-y-8">
        {/* Si la página todavía no tiene secciones, se muestra un estado vacío claro. */}
        {data.sections.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">
            Esta pagina todavia no tiene secciones.
          </div>
        )}

        {/* Cada sección agrupa documentos y enlaces relacionados con el recurso. */}
        {data.sections.map((section) => (
          <article key={section.id} className={`rounded-2xl border bg-white shadow-sm p-6 ${theme.cardBorder}`}>
            <h2 className="text-2xl font-black text-brand-brown mb-4">{section.title}</h2>

            {section.documents.length === 0 && section.links.length === 0 && (
              <p className="text-sm text-stone-500">Sin contenido por ahora.</p>
            )}

            {section.documents.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm uppercase tracking-widest text-stone-500 font-black mb-2">Documentos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {section.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.google_drive_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-green-100 bg-green-50/40 p-4 no-underline hover:bg-green-50 transition"
                    >
                      <p className="font-bold text-brand-brown line-clamp-2">{doc.title}</p>
                      {doc.description && <p className="mt-1 text-sm text-stone-600 line-clamp-2">{doc.description}</p>}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-green-700">
                        <FileText size={14} /> Abrir documento
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {section.links.length > 0 && (
              <div>
                <h3 className="text-sm uppercase tracking-widest text-stone-500 font-black mb-2">Enlaces</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {section.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 no-underline hover:bg-blue-50 transition"
                    >
                      <p className="font-bold text-brand-brown line-clamp-2">{link.icon || "🔗"} {link.title}</p>
                      {link.description && <p className="mt-1 text-sm text-stone-600 line-clamp-2">{link.description}</p>}
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                        <ExternalLink size={14} /> Abrir enlace
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </section>

      <ResourcePageEditorFab
        page={{
          id: data.page.id,
          title: data.page.title,
          description: data.page.description,
          texture_url: data.page.texture_url,
          template: data.page.template,
        }}
        initialSections={initialSections}
      />
    </main>
  );
}

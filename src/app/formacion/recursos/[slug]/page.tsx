import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink, FileText, FolderKanban, Link as LinkIcon, File, Pencil, Trash2 } from "lucide-react";
import { getResourcePageWithContent } from "@/server/db/resource-pages-repository";
import { ResourcePageEditorFab } from "@/app/components/common/resource-page-editor-fab";
import { getSessionUser } from "@/server/lib/api-utils";

// --- TIPOS Y TEMAS ---
const TEMPLATE_MAP: Record<string, any> = {
  gold: {
    banner: "bg-yellow-400",
    accent: "text-yellow-600",
    bgAccent: "bg-yellow-50",
    border: "border-yellow-200",
    cardHover: "hover:border-yellow-400 hover:shadow-yellow-100",
  },
  blue: {
    banner: "bg-blue-600",
    accent: "text-blue-600",
    bgAccent: "bg-blue-50",
    border: "border-blue-200",
    cardHover: "hover:border-blue-400 hover:shadow-blue-100",
  },
  // ... puedes seguir extendiendo ocean y earth con esta misma lógica
};

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getResourcePageWithContent(slug);
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === "admin";

  if (!data) notFound();

  const theme = TEMPLATE_MAP[data.page.template] || TEMPLATE_MAP.gold;

  return (
    <main className="pb-24 bg-[#F9F9F8] min-h-screen font-sans sticky top-0">
      {/* Hero Section Minimalista */}
      <div className={`relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden ${theme.banner}`}>
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${data.page.texture_url || "/assets/textures/formacion.webp"})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-black/10" />
        
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 drop-shadow-md">
            {data.page.title}
          </h1>
          {data.page.description && (
            <p className="text-lg md:text-xl font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
              {data.page.description}
            </p>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <section className="max-w-7xl pt-24 mx-auto -mt-12 relative z-20 px-4 sm:px-6 lg:px-8 space-y-16">
        
        {data.sections.map((section) => {
          const totalResources = section.documents.length + section.links.length;

          return (
            <div key={section.id} className="group/section">
              {/* Header de la Sección */}
              <div className="flex items-center justify-between mb-6 border-b-2 border-brown-200 pb-4 ">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${theme.bgAccent} ${theme.accent} shadow-sm`}>
                    <FolderKanban size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-brown-800 tracking-tight">{section.title}</h2>
                    <p className="text-xs font-bold text-brown-400 uppercase tracking-widest">{totalResources} Recursos</p>
                  </div>
                </div>

                {/* Acciones de Admin para la Sección */}
                {isAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity">
                    <button title="Editar sección" className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button title="Eliminar sección" className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Grilla de Recursos Unificada (Bento Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                
                {/* Documents */}
                {section.documents.map((doc) => (
                  <ResourceItemCard 
                    key={doc.id} 
                    title={doc.title} 
                    description={doc.description} 
                    href={doc.google_drive_url} 
                    type="doc" 
                    theme={theme}
                    isAdmin={isAdmin}
                  />
                ))}

                {/* Links */}
                {section.links.map((link) => (
                  <ResourceItemCard 
                    key={link.id} 
                    title={link.title} 
                    description={link.description} 
                    href={link.url} 
                    type="link" 
                    theme={theme}
                    isAdmin={isAdmin}
                  />
                ))}

                {totalResources === 0 && (
                  <div className="col-span-full py-10 text-center bg-white rounded-2xl border-2 border-dashed border-stone-200">
                    <p className="text-stone-400 font-medium">Esta sección aún no tiene recursos.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <ResourcePageEditorFab
        page={{ ...data.page }}
        initialSections={data.sections.map(s => ({ id: s.id, title: s.title, section_key: s.section_key }))}
      />
    </main>
  );
}

// --- SUB-COMPONENTE: RESOURCE ITEM CARD ---
function ResourceItemCard({ title, description, href, type, theme, isAdmin }: any) {
  const Icon = type === 'doc' ? FileText : LinkIcon;
  
  return (
    <div className={`group relative flex flex-col justify-between bg-white rounded-2xl border border-stone-200 p-5 transition-all duration-300 shadow-sm ${theme.cardHover} hover:-translate-y-1`}>
      {/* Botones de acción rápidos (Admin) */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button className="p-1.5 bg-white/90 backdrop-blur shadow-sm rounded-md text-stone-400 hover:text-stone-700 border border-stone-100">
            <Pencil size={14} />
          </button>
          <button className="p-1.5 bg-white/90 backdrop-blur shadow-sm rounded-md text-stone-400 hover:text-red-600 border border-stone-100">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className={`shrink-0 p-2 rounded-lg ${theme.bgAccent} ${theme.accent}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-stone-800 leading-tight truncate group-hover:text-black transition-colors">
            {title}
          </h4>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-1">
            {type === 'doc' ? 'Documento' : 'Enlace'}
          </p>
        </div>
      </div>

      {description && (
        <p className="text-sm text-stone-500 line-clamp-2 mb-5 leading-relaxed">
          {description}
        </p>
      )}

      <a
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${theme.bgAccent} ${theme.accent} border-transparent hover:bg-white hover:${theme.border}`}
      >
        Abrir <ExternalLink size={12} />
      </a>
    </div>
  );
}

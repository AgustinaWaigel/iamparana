import { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, FolderOpen, Music2, Sparkles } from "lucide-react";
import { getDocumentsBySections, getLinksBySection } from "@/server/db/admin-repository";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Recursos de Animación | IAM Paraná",
  description: "Material y enlaces para animar encuentros, celebraciones y actividades de IAM.",
};

type UploadedDocument = {
  id: number;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  file_type: string | null;
};

type UploadedLink = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
};

export default async function AnimacionRecursosPage() {
  const [uploadedDocumentsRaw, uploadedLinksRaw] = await Promise.all([
    getDocumentsBySections(["animacion", "recursos"]),
    getLinksBySection("animacion"),
  ]);

  const uploadedDocumentsRows = JSON.parse(JSON.stringify(uploadedDocumentsRaw)) as Array<Record<string, unknown>>;
  const uploadedLinksRows = JSON.parse(JSON.stringify(uploadedLinksRaw)) as Array<Record<string, unknown>>;

  const uploadedDocuments: UploadedDocument[] = uploadedDocumentsRows
    .map((item) => ({
      id: Number(item.id),
      title: String(item.title || ""),
      description: item.description ? String(item.description) : null,
      google_drive_url: item.google_drive_url ? String(item.google_drive_url) : null,
      file_type: item.file_type ? String(item.file_type) : null,
    }))
    .filter((item) => Boolean(item.google_drive_url));

  const uploadedLinks: UploadedLink[] = uploadedLinksRows
    .map((item) => ({
      id: Number(item.id),
      title: String(item.title || ""),
      description: item.description ? String(item.description) : null,
      url: String(item.url || ""),
      icon: item.icon ? String(item.icon) : null,
    }))
    .filter((item) => Boolean(item.url));

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-lime-100 via-white to-emerald-100 p-6 md:p-8 shadow-sm mb-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-200/40 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles size={14} /> Recursos
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-emerald-900">Recursos de Animación</h1>
          <p className="mt-3 text-stone-700 max-w-3xl">
            Descargá materiales, abrí enlaces útiles y prepará tus encuentros con contenido listo para usar.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/animacion/canciones" className="no-underline inline-flex items-center gap-2 rounded-xl bg-emerald-800 text-white px-4 py-2.5 font-bold hover:bg-emerald-900 transition-colors">
              <Music2 size={16} /> Ir al cancionero
            </Link>
            <Link href="/animacion/juegos" className="no-underline inline-flex items-center gap-2 rounded-xl border border-emerald-300 text-emerald-900 bg-white px-4 py-2.5 font-bold hover:bg-emerald-50 transition-colors">
              <FolderOpen size={16} /> Ver juegos
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="rounded-3xl border border-stone-200 bg-white shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-stone-900 mb-1">Documentos</h2>
          <p className="text-sm text-stone-500 mb-4">Material descargable para formación y animación.</p>

          {uploadedDocuments.length === 0 ? (
            <p className="text-sm text-stone-500 rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
              Todavía no hay documentos cargados para esta sección.
            </p>
          ) : (
            <ul className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <li key={doc.id} className="rounded-2xl border border-stone-200 p-4 bg-stone-50/60">
                  <h3 className="font-bold text-stone-900">{doc.title}</h3>
                  {doc.description ? <p className="text-sm text-stone-600 mt-1">{doc.description}</p> : null}
                  <a
                    href={doc.google_drive_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-800 transition-colors"
                  >
                    <Download size={15} /> Descargar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white shadow-sm p-5 md:p-6">
          <h2 className="text-xl font-black text-stone-900 mb-1">Enlaces útiles</h2>
          <p className="text-sm text-stone-500 mb-4">Accesos directos a herramientas y contenido online.</p>

          {uploadedLinks.length === 0 ? (
            <p className="text-sm text-stone-500 rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
              Todavía no hay enlaces cargados para esta sección.
            </p>
          ) : (
            <ul className="space-y-3">
              {uploadedLinks.map((linkItem) => (
                <li key={linkItem.id} className="rounded-2xl border border-stone-200 p-4 bg-stone-50/60">
                  <h3 className="font-bold text-stone-900">{linkItem.title}</h3>
                  {linkItem.description ? <p className="text-sm text-stone-600 mt-1">{linkItem.description}</p> : null}
                  <a
                    href={linkItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300 text-emerald-900 bg-white px-3 py-2 text-sm font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    <ExternalLink size={15} /> Abrir enlace
                  </a>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { Gamepad2, Music2 } from "lucide-react";
import { AreaHero, AreaPage } from "@/app/components/common/area-hero";
import { AreaSection, LinkCard, LinkGrid, SectionNote } from "@/app/components/common/area-sections";
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
    <AreaPage
      hero={
        <AreaHero
          area="animacion"
          title="Recursos de Animación"
          description="Descargá materiales, abrí enlaces útiles y prepará tus encuentros con contenido listo para usar."
          crumbs={[]}
        />
      }
    >
      <div className="mb-12 flex flex-wrap gap-3">
        <Link
          href="/animacion/canciones"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          <Music2 size={16} aria-hidden /> Ir al cancionero
        </Link>
        <Link
          href="/animacion/juegos"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-700/30 bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 no-underline transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          <Gamepad2 size={16} aria-hidden /> Ver juegos
        </Link>
      </div>

      <AreaSection title="Documentos" description="Material descargable para formación y animación.">
        <LinkGrid>
          {uploadedDocuments.length === 0 ? (
            <SectionNote>Todavía no hay documentos cargados para esta sección.</SectionNote>
          ) : uploadedDocuments.map((doc) => (
            <LinkCard
              key={doc.id}
              area="animacion"
              kind="doc"
              label="Descargar"
              title={doc.title}
              description={doc.description}
              href={doc.google_drive_url || "#"}
            />
          ))}
        </LinkGrid>
      </AreaSection>

      <AreaSection title="Enlaces útiles" description="Accesos directos a herramientas y contenido online.">
        <LinkGrid>
          {uploadedLinks.length === 0 ? (
            <SectionNote>Todavía no hay enlaces cargados para esta sección.</SectionNote>
          ) : uploadedLinks.map((linkItem) => (
            <LinkCard
              key={linkItem.id}
              area="animacion"
              kind="link"
              label="Abrir enlace"
              title={linkItem.title}
              description={linkItem.description}
              href={linkItem.url}
            />
          ))}
        </LinkGrid>
      </AreaSection>
    </AreaPage>
  );
}

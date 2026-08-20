import React from "react";
import { Metadata, Viewport } from "next";
import { HeroSection } from "@/app/components/common/hero-section";

// Componentes
import { EspiritualidadClient } from "@/app/espiritualidad/components/espiritualidad-client";
import { EspiritualidadCardsGrid } from "./components/espiritualidad-cards-grid";

// Base de Datos
import { getAreaLandingContent } from "@/server/db/admin-repository";
import { listSpiritualPrayers } from "@/server/db/spiritual-prayers-repository";

export const revalidate = 60;

export const viewport: Viewport = {
  themeColor: "#6b7280",
};

export const metadata: Metadata = {
  title: "Espiritualidad",
  description: "Oraciones, guiones litúrgicos y recursos para profundizar en la espiritualidad",
  openGraph: {
    title: "Espiritualidad",
    description: "Oraciones, guiones litúrgicos y recursos para profundizar en la espiritualidad",
    url: "https://iamparana.com.ar/espiritualidad",
    images: [
      {
        url: "https://iamparana.com.ar/logoiam.jpg",
        alt: "Logo IAM Paraná",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/assets/resources/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Espiritualidad",
  },
};

type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; section: string; created_at: string; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; created_at: string; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; template: string; thumbnail_url: string | null; texture_url: string | null; created_at: string; };
type TextPrayer = { id: number; title: string; description: string | null; content: string; thumbnail_url: string | null; created_at: string; };

export default async function Espiritualidad() {
  const [areaContent, textPrayers] = await Promise.all([
    getAreaLandingContent('espiritualidad', ['espiritualidad', 'recursos', 'oraciones', 'guiones']),
    listSpiritualPrayers(),
  ]);
  const uploadedDocumentsRaw = areaContent.documents;
  const uploadedLinksRaw = areaContent.links;
  const resourcePagesRaw = areaContent.pages;

  const uploadedDocumentsRows = JSON.parse(JSON.stringify(uploadedDocumentsRaw)) as Array<Record<string, unknown>>;
  const uploadedLinksRows = JSON.parse(JSON.stringify(uploadedLinksRaw)) as Array<Record<string, unknown>>;
  const resourcePagesRows = JSON.parse(JSON.stringify(resourcePagesRaw)) as Array<Record<string, unknown>>;

  const uploadedDocuments = uploadedDocumentsRows
    .map((item) => ({
      id: Number(item.id),
      title: String(item.title || ''),
      description: item.description ? String(item.description) : null,
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      google_drive_url: item.google_drive_url ? String(item.google_drive_url) : null,
      file_type: item.file_type ? String(item.file_type) : null,
      section: String(item.section || 'espiritualidad'),
      created_at: String(item.created_at || ''),
    }))
    .filter((item) => Boolean(item.google_drive_url));

  const uploadedLinks = uploadedLinksRows.map((item) => ({
    id: Number(item.id),
    title: String(item.title || ''),
    description: item.description ? String(item.description) : null,
    thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
    url: String(item.url || ''),
    icon: item.icon ? String(item.icon) : null,
    created_at: String(item.created_at || ''),
  }));

  const resourcePages = resourcePagesRows
    .map((item) => ({
      id: Number(item.id),
      slug: String(item.slug || ''),
      title: String(item.title || ''),
      section: String(item.section || ''),
      description: item.description ? String(item.description) : null,
      template: String(item.template || 'purple'), // Mantenemos el fallback
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      texture_url: item.texture_url ? String(item.texture_url) : null,
      created_at: String(item.created_at || ''),
    }))

  return (
    <EspiritualidadClient>
      <section>
        <HeroSection
          title="Espiritualidad"
          textureUrl="/assets/textures/areasg.webp" // Cambiado de areasg.webp para mayor calidad
          overlayColor="rgba(31, 41, 55, 0.7), rgba(55, 65, 81, 0.8)" // Grises más profundos (Slate/Gray 800)
          gradientClass="from-gray-800 to-gray-700"
          description="En esta sección vas a encontrar oraciones y guiones para profundizar en la espiritualidad de la IAM."
          textColor="text-white"
        />
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8 md:pb-10">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-stone-600 md:text-base">
            Un espacio para encontrarnos con Jesús: elegí una oración, descargala o compartila en tu grupo de IAM.
          </p>
        </div>
        <EspiritualidadCardsGrid
          uploadedDocuments={uploadedDocuments}
          uploadedLinks={uploadedLinks}
          resourcePages={resourcePages}
          textPrayers={JSON.parse(JSON.stringify(textPrayers)) as TextPrayer[]}
        />
      </main>
    </EspiritualidadClient>
  );
}

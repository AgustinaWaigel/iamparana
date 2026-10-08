import React from "react";
import { Metadata, Viewport } from "next";
import { AreaHero } from '@/app/components/common/area-hero';

// Componentes
import { EspiritualidadClient } from "@/app/espiritualidad/components/espiritualidad-client";
import { EspiritualidadCardsGrid } from "./components/espiritualidad-cards-grid";

// Base de Datos
import { getAreaLandingContent } from "@/server/db/admin-repository";
import { listSpiritualPrayers } from "@/server/db/spiritual-prayers-repository";
import { listFechasDelMes } from "@/server/lib/agenda-mes";
import { FiestasDelMes } from "./components/fiestas-del-mes";
import { RosarioMisionero } from "./components/rosario-misionero";

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
    url: "https://iamparana.com/espiritualidad",
    images: [
      {
        url: "https://iamparana.com/logoiam.jpg",
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
  // Fiestas y eventos del mes en curso (hora de Argentina), tomados de la agenda del sitio.
  const [anioHoy, mesHoy, diaHoy] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date()).split('-').map(Number);
  const [areaContent, textPrayers, fechas] = await Promise.all([
    getAreaLandingContent('espiritualidad', ['espiritualidad', 'recursos', 'oraciones', 'guiones']),
    listSpiritualPrayers(),
    listFechasDelMes(anioHoy, mesHoy).catch(() => []),
  ]);
  const nombreMes = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', month: 'long' }).format(new Date());
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
      <div className="min-h-screen bg-brand-paper">
        <AreaHero
          area="espiritualidad"
          title="Espiritualidad"
          description="En esta sección vas a encontrar oraciones y guiones para profundizar en la espiritualidad de la IAM."
        />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <FiestasDelMes mes={nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} hoy={diaHoy} fechas={fechas} />
          <EspiritualidadCardsGrid
            uploadedDocuments={uploadedDocuments}
            uploadedLinks={uploadedLinks}
            resourcePages={resourcePages}
            textPrayers={JSON.parse(JSON.stringify(textPrayers)) as TextPrayer[]}
          />

          <RosarioMisionero />
        </div>
      </div>
    </EspiritualidadClient>
  );
}

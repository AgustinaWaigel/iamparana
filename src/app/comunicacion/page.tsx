import React from "react";
import { Metadata, Viewport } from "next";
import { AreaHero } from '@/app/components/common/area-hero';

// Componentes
import { ComunicacionClient } from "@/app/comunicacion/components/comunicacion-client";
import { ComunicacionCardsGrid } from "./components/comunicacion-cards-grid";

// Base de Datos
import { getAreaLandingContent } from "@/server/db/admin-repository";
export const revalidate = 60;

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "Comunicación",
  description: "Documentos, enlaces y recursos gráficos para la comunicación",
  openGraph: {
    title: "Comunicación",
    description: "Documentos, enlaces y recursos gráficos para la comunicación",
    url: "https://iamparana.com/comunicacion",
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
    title: "Comunicación",
  },
};

type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; created_at: string; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; created_at: string; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; template: string; thumbnail_url: string | null; texture_url: string | null; created_at: string; };

export default async function Comunicacion() {
  const areaContent = await getAreaLandingContent('comunicacion', ['comunicacion', 'logos', 'dibujos', 'recursos']);
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
      description: item.description ? String(item.description) : null,
      template: String(item.template || 'blue'),
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      texture_url: item.texture_url ? String(item.texture_url) : null,
      created_at: String(item.created_at || ''),
    }))
    .filter((item) => item.template === 'blue');

  return (
    <ComunicacionClient>
      <div className="min-h-screen bg-brand-paper">
        <AreaHero
          area="comunicacion"
          title="Comunicación"
          description="Aquí vas a poder encontrar recursos gráficos para ser utilizados en tus encuentros: logos, imágenes de la IAM, dibujos y mucho más."
        />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <ComunicacionCardsGrid 
            uploadedDocuments={uploadedDocuments} 
            uploadedLinks={uploadedLinks} 
            resourcePages={resourcePages} 
          />
        </div>
      </div>
    </ComunicacionClient>
  );
}

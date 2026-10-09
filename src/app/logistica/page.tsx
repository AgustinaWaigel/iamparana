import React from "react";
import { Metadata, Viewport } from "next";
import { AreaHero } from '@/app/components/common/area-hero';

// Componentes
import { LogisticaClient } from "@/app/logistica/components/logistica-client";
import { LogisticaCardsGrid } from "./components/logistica-cards-grid";

// Base de Datos
import { getAreaLandingContent } from "@/server/db/admin-repository";
import { listRendiciones } from "@/server/db/rendiciones-repository";
import { CuentasClaras } from "./components/cuentas-claras";

export const revalidate = 60;

export const viewport: Viewport = {
  themeColor: "#dc2626",
};

export const metadata: Metadata = {
  title: "Logística",
  description: "Resumen de gastos y transparencia en eventos realizados",
  openGraph: {
    title: "Logística",
    description: "Resumen de gastos y transparencia en eventos realizados",
    url: "https://iamparana.com.ar/logistica",
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
    title: "Logística",
  },
};

type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; created_at: string; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; created_at: string; };
type ResourcePageCard = { id: number; slug: string; title: string; section: string; description: string | null; template: string; thumbnail_url: string | null; texture_url: string | null; created_at: string; };

export default async function Logistica() {
  const [areaContent, rendiciones] = await Promise.all([
    getAreaLandingContent('logistica', ['logistica', 'presupuestos', 'rendiciones', 'inventario']),
    listRendiciones().catch(() => []),
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
      template: String(item.template || 'red'),
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      texture_url: item.texture_url ? String(item.texture_url) : null,
      created_at: String(item.created_at || ''),
    }))
    .filter((item) => item.section === 'logistica' && Boolean(item.slug));

  return (
    <LogisticaClient>
      <div className="min-h-screen bg-brand-paper">
        <AreaHero
          area="logistica"
          title="Logística"
          description="Es muy importante manejarse con transparencia. Aquí vas a poder encontrar los resúmenes de ingresos-egresos de los distintos eventos que hemos realizado."
        />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <CuentasClaras rendiciones={rendiciones} />

          <LogisticaCardsGrid
            uploadedDocuments={uploadedDocuments}
            uploadedLinks={uploadedLinks}
            resourcePages={resourcePages}
          />
        </div>
      </div>
    </LogisticaClient>
  );
}

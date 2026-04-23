import React from "react";
import { Metadata, Viewport } from "next";
import { HeroSection } from "@/app/components/common/hero-section";

// Componentes
import { ComunicacionClient } from "@/app/comunicacion/components/comunicacion-client";
import { ComunicacionCardsGrid } from "./components/comunicacion-cards-grid";

// Base de Datos
import { getDocumentsBySections, getLinksBySection } from "@/server/db/admin-repository";
import { listResourcePages } from "@/server/db/resource-pages-repository";

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "Comunicación",
  description: "Documentos, enlaces y recursos gráficos para la comunicación",
  openGraph: {
    title: "Comunicación",
    description: "Documentos, enlaces y recursos gráficos para la comunicación",
    url: "https://iamparana.com.ar/comunicacion",
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
    title: "Comunicación",
  },
};

type UploadedDocument = { id: number; title: string; description: string | null; google_drive_url: string | null; file_type: string | null; };
type UploadedLink = { id: number; title: string; description: string | null; url: string; icon: string | null; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; template: string; };

export default async function Comunicacion() {
  const [uploadedDocumentsRaw, uploadedLinksRaw, resourcePagesRaw] = await Promise.all([
    getDocumentsBySections(['comunicacion', 'logos', 'dibujos', 'recursos']),
    getLinksBySection('comunicacion'),
    listResourcePages(),
  ]);

  const uploadedDocumentsRows = JSON.parse(JSON.stringify(uploadedDocumentsRaw)) as Array<Record<string, unknown>>;
  const uploadedLinksRows = JSON.parse(JSON.stringify(uploadedLinksRaw)) as Array<Record<string, unknown>>;
  const resourcePagesRows = JSON.parse(JSON.stringify(resourcePagesRaw)) as Array<Record<string, unknown>>;

  const uploadedDocuments = uploadedDocumentsRows
    .map((item) => ({
      id: Number(item.id),
      title: String(item.title || ''),
      description: item.description ? String(item.description) : null,
      google_drive_url: item.google_drive_url ? String(item.google_drive_url) : null,
      file_type: item.file_type ? String(item.file_type) : null,
    }))
    .filter((item) => Boolean(item.google_drive_url));

  const uploadedLinks = uploadedLinksRows.map((item) => ({
    id: Number(item.id),
    title: String(item.title || ''),
    description: item.description ? String(item.description) : null,
    url: String(item.url || ''),
    icon: item.icon ? String(item.icon) : null,
  }));

  const resourcePages = resourcePagesRows
    .map((item) => ({
      id: Number(item.id),
      slug: String(item.slug || ''),
      title: String(item.title || ''),
      description: item.description ? String(item.description) : null,
      template: String(item.template || 'blue'),
    }))
    .filter((item) => item.template === 'blue');

  return (
    <ComunicacionClient>
      <section>
        <HeroSection
          title="Comunicación"
          textureUrl="/assets/textures/areasg.webp"
          overlayColor="rgba(59, 130, 246, 0.7), rgba(96, 165, 250, 0.75)"
          gradientClass="from-blue-500 to-blue-400"
          description="Aquí vas a poder encontrar recursos gráficos para ser utilizados en tus encuentros: logos, imágenes de la IAM, dibujos y mucho más."
          badges={["Logos", "Dibujos", "Imágenes", "Recursos"]}
          textColor="text-white"
          template="ocean"
        />
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8 md:pb-10">
        <ComunicacionCardsGrid 
          uploadedDocuments={uploadedDocuments} 
          uploadedLinks={uploadedLinks} 
          resourcePages={resourcePages} 
        />
      </main>
    </ComunicacionClient>
  );
}

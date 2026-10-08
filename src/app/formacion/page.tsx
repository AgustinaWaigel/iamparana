import React from 'react';
import { Metadata } from 'next';

// Componentes
import { FormacionClient } from '@/app/formacion/components/formacion-client';
import { FormacionCardsGrid } from './components/formacion-cards-grid';
import { EscuelaConJesus } from './components/escuela-con-jesus';
import { Temario } from './components/temario';
import { AreaHero } from '@/app/components/common/area-hero';
import { AreaQuote } from '@/app/components/common/area-quote';

// Base de Datos
import { getAreaLandingContent } from '@/server/db/admin-repository';
import { listTemario } from '@/server/db/temario-repository';

export const metadata: Metadata = {
  title: 'Formación',
  description: 'Materiales, documentos y propuestas de formación para animadores de Infancia y Adolescencia Misionera.',
  alternates: { canonical: '/formacion' },
  openGraph: {
    title: 'Formación',
    description: 'Materiales y propuestas de formación para animadores de IAM Paraná.',
    url: 'https://iamparana.com/formacion',
    images: [{ url: 'https://iamparana.com/logoiam.jpg', alt: 'Logo IAM Paraná', width: 800, height: 600 }],
    type: 'website',
  },
  icons: { icon: '/assets/resources/favicon.ico' },
};

type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; created_at: string; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; created_at: string; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; template: string; thumbnail_url: string | null; texture_url: string | null; created_at: string; };

export default async function FormacionPage() {
  const [areaContent, temario] = await Promise.all([
    getAreaLandingContent('formacion', ['formacion', 'temario', 'carta', 'otro']),
    listTemario(),
  ]);
  // Fecha de hoy en Argentina, para destacar el mes en curso.
  const [anioHoy, mesHoy] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric' }).format(new Date()).split('-').map(Number);
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
      template: String(item.template || 'gold'),
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      texture_url: item.texture_url ? String(item.texture_url) : null,
      created_at: String(item.created_at || ''),
    }))
    .filter((item) => item.template === 'gold');

  return (
    <FormacionClient>
      <div className="min-h-screen bg-brand-paper">
        <AreaHero
          area="formacion"
          title="Formación"
          description="Aquí podrás acceder a todos los recursos: presentaciones de talleres, el temario del año, la carta del Papa y mucho más."
        />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <Temario temario={temario} anioHoy={anioHoy} mesHoy={mesHoy} />

          <FormacionCardsGrid 
            uploadedDocuments={uploadedDocuments} 
            uploadedLinks={uploadedLinks} 
            resourcePages={resourcePages} 
          />

          <EscuelaConJesus />

          <AreaQuote
            quote="Mi caminito es el camino de una infancia espiritual, el camino de la confianza y de la entrega absoluta."
            author="Santa Teresita"
            accentClass="text-yellow-300"
          />
        </div>
      </div>
    </FormacionClient>
  );
}

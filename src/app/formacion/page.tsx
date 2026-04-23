import React from 'react';
import { Metadata } from 'next';
import { Quote } from 'lucide-react';

// Componentes
import { FormacionClient } from '@/app/formacion/components/formacion-client';
import { FormacionCardsGrid } from './components/formacion-cards-grid';
import { HeroSection } from '@/app/components/common/hero-section';

// Base de Datos
import { getDocumentsBySections, getLinksBySection } from '@/server/db/admin-repository';
import { listResourcePages } from '@/server/db/resource-pages-repository';

export const metadata: Metadata = {
  title: 'Formación',
  description: 'Página del área de formación',
  openGraph: {
    title: 'Formación',
    description: 'Página del área de formación',
    url: 'https://iamparana.com.ar/formacion',
    images: [{ url: 'https://iamparana.com.ar/logoiam.jpg', alt: 'Logo IAM Paraná', width: 800, height: 600 }],
    type: 'website',
  },
  icons: { icon: '/assets/resources/favicon.ico' },
};

type UploadedDocument = { id: number; title: string; description: string | null; google_drive_url: string | null; file_type: string | null; };
type UploadedLink = { id: number; title: string; description: string | null; url: string; icon: string | null; };
type ResourcePageCard = { id: number; slug: string; title: string; description: string | null; template: string; };

export default async function FormacionPage() {
  const [uploadedDocumentsRaw, uploadedLinksRaw, resourcePagesRaw] = await Promise.all([
    getDocumentsBySections(['formacion', 'temario', 'carta', 'otro']),
    getLinksBySection('formacion'),
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
      template: String(item.template || 'gold'),
    }))
    .filter((item) => item.template === 'gold');

  return (
    <FormacionClient>
      <section>
        <HeroSection
          title="Formación"
          textureUrl="/assets/textures/formacion.webp"
          overlayColor="rgba(253, 224, 71, 0.7), rgba(250, 204, 21, 0.75)"
          gradientClass="from-yellow-600 to-yellow-500"
          description="Aquí podrás acceder a todos los recursos: presentaciones de talleres, el temario del año, la carta del Papa y mucho más."
          badges={["Documentos", "Presentaciones", "Enlaces", "Material actualizado"]}
          textColor="text-brand-brown"
        />
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8 md:pb-10">
        <FormacionCardsGrid 
          uploadedDocuments={uploadedDocuments} 
          uploadedLinks={uploadedLinks} 
          resourcePages={resourcePages} 
        />

        <section className="relative overflow-hidden bg-brand-brown p-10 md:p-14 rounded-3xl shadow-lg text-center">
          <Quote size={120} className="absolute text-white/5 -top-4 -left-4 -rotate-12" />
          <div className="relative z-5 max-w-4xl mx-auto">
            <p className="text-2xl md:text-4xl font-bold text-yellow-300 leading-snug italic mb-6">
              &ldquo;Mi caminito es el camino de una infancia espiritual, el camino de la confianza y de la entrega absoluta.&rdquo;
            </p>
            <div className="w-16 h-1 bg-yellow-400 mx-auto mb-4 rounded-full" />
            <p className="text-lg md:text-xl text-white font-semibold uppercase tracking-widest">
              Santa Teresita
            </p>
          </div>
        </section>
      </main>
    </FormacionClient>
  );
}
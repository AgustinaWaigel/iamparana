import React from 'react';
import { Metadata } from 'next';
import { getAllJuegos } from '@/server/content/juegos';
import { JuegosClientContent } from '@/app/components/common/juegos-client-content';
import { BookOpen } from 'lucide-react';
import { AreaHero, AreaPage } from '@/app/components/common/area-hero';
import { AreaSection, LinkCard, LinkGrid, SectionNote } from '@/app/components/common/area-sections';
import { getDocumentsBySection } from '@/server/db/admin-repository';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Juegos',
  description: 'Juegos para tus encuentros',
  openGraph: {
    title: 'Juegos',
    description: 'Descripcion',
    url: 'https://iamparana.com/animacion/juegos',
    images: [
      {
        url: 'https://iamparana.com/logoiam.jpg',
        alt: 'Logo IAM Paraná',
        width: 800,
        height: 600,
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/assets/resources/favicon.ico',
  },

};

export default async function juegosPage() {
  const [juegos, gameDocumentsRaw] = await Promise.all([
    getAllJuegos(),
    getDocumentsBySection('juegos'),
  ]);
  const gameDocuments = JSON.parse(JSON.stringify(gameDocumentsRaw)) as Array<{ id: number; title: string; description: string | null; google_drive_url: string | null }>;

  return (
    <AreaPage
      hero={
        <AreaHero
          area="animacion"
          title="Juegos"
          description="Ideas para animar encuentros, juegos por categorias y dinamicas listas para usar."
          crumbs={[]}
        />
      }
    >
      <p className="m-0 mb-10 max-w-3xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">
        Aca vas a poder encontrar juegos de distintos tipos para realizar en tus encuentros, junto con libros con
        dinamicas y demas.
      </p>

      <JuegosClientContent juegos={juegos} />

      <AreaSection title="Libros con juegos y dinamicas" meta="Recursos">
        <LinkGrid columns={2}>
          {gameDocuments.length === 0 ? (
            <SectionNote>Todavía no hay documentos de juegos cargados.</SectionNote>
          ) : gameDocuments.map((document) => (
            <LinkCard
              key={document.id}
              area="animacion"
              kind="doc"
              icon={BookOpen}
              title={document.title}
              href={document.google_drive_url || '#'}
            />
          ))}
        </LinkGrid>
      </AreaSection>
    </AreaPage>
  );
}

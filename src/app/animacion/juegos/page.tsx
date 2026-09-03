import React from 'react';
import { Metadata } from 'next';
import { getAllJuegos } from '@/server/content/juegos';
import { JuegosClientContent } from '@/app/components/common/juegos-client-content';
import { HeroSection } from '@/app/components/common/hero-section';
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
    <>
      <section>
        <HeroSection
          title="Juegos"
          textureUrl="/assets/textures/areasg.webp"
          overlayColor="rgba(16, 63, 27, 0.7), rgba(22, 163, 74, 0.85)"
          gradientClass="from-emerald-950 via-emerald-800 to-green-600"
          description="Ideas para animar encuentros, juegos por categorias y dinamicas listas para usar."
          textColor="text-white"
        />
      </section>

      <main className="relative max-w-6xl mx-auto px-4 pb-12">
        <div className="pointer-events-none absolute -top-24 right-10 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative mt-8 space-y-10">
          <div className="rounded-3xl border border-emerald-100/80 bg-white/90 p-6 shadow-sm backdrop-blur">
            <p className="text-sm md:text-base text-stone-600 leading-relaxed">
              Aca vas a poder encontrar juegos de distintos tipos para realizar en tus encuentros, junto con libros con
              dinamicas y demas.
            </p>
          </div>

          <JuegosClientContent juegos={juegos} />

          <section className="rounded-3xl border border-emerald-100/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-black text-emerald-900 tracking-tight">Libros con juegos y dinamicas</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700/70">Recursos</span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {gameDocuments.length === 0 ? (
                <p className="text-sm text-stone-500">Todavía no hay documentos de juegos cargados.</p>
              ) : gameDocuments.map((document) => (
                <a
                  key={document.id}
                  href={document.google_drive_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-emerald-100/70 bg-emerald-50/60 px-5 py-4 font-bold text-emerald-900 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <span>{document.title}</span>
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700/60">Abrir</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

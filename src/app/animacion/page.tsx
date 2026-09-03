import { Metadata } from 'next';
import Link from 'next/link';
import { Quote } from 'lucide-react';
import { Gamepad2, Music2 } from 'lucide-react';
import { HeroSection } from '@/app/components/common/hero-section';
import { AnimacionClient } from '@/app/animacion/components/animacion-client';
import { AnimacionCardsGrid } from '@/app/animacion/components/animacion-cards-grid';
import { getAreaLandingContent } from '@/server/db/admin-repository';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Animación',
  description: 'Juegos, canciones, dinámicas y recursos para animar encuentros de Infancia y Adolescencia Misionera.',
  alternates: { canonical: '/animacion' },
  openGraph: {
    title: 'Animación - IAM Paraná',
    description: 'Juegos, canciones, dinámicas y recursos para animar encuentros de IAM Paraná.',
    url: 'https://iamparana.com/animacion',
    images: [{ url: 'https://iamparana.com/logoiam.jpg' }],
    type: 'website',
  },
};

type UploadedDocument = { id: number; title: string; description: string | null; thumbnail_url: string | null; google_drive_url: string | null; file_type: string | null; created_at: string; };
type UploadedLink = { id: number; title: string; description: string | null; thumbnail_url: string | null; url: string; icon: string | null; created_at: string; };
type ResourcePageCard = { id: number; slug: string; title: string; section: string; description: string | null; template: string; thumbnail_url: string | null; texture_url: string | null; created_at: string; };

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function AnimacionPage() {
  const areaContent = await getAreaLandingContent('animacion', ['animacion', 'recursos']);
  const uploadedDocumentsRaw = areaContent.documents;
  const uploadedLinksRaw = areaContent.links;
  const resourcePagesRaw = areaContent.pages;

  const uploadedDocumentsRows = JSON.parse(JSON.stringify(uploadedDocumentsRaw)) as Array<Record<string, unknown>>;
  const uploadedLinksRows = JSON.parse(JSON.stringify(uploadedLinksRaw)) as Array<Record<string, unknown>>;
  const resourcePagesRows = JSON.parse(JSON.stringify(resourcePagesRaw)) as Array<Record<string, unknown>>;

  const uploadedDocuments: UploadedDocument[] = uploadedDocumentsRows
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

  const uploadedLinks: UploadedLink[] = uploadedLinksRows
    .map((item) => ({
      id: Number(item.id),
      title: String(item.title || ''),
      description: item.description ? String(item.description) : null,
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      url: String(item.url || ''),
      icon: item.icon ? String(item.icon) : null,
      created_at: String(item.created_at || ''),
    }))
    .filter((item) => isValidHttpUrl(item.url));

  const resourcePages: ResourcePageCard[] = resourcePagesRows
    .map((item) => ({
      id: Number(item.id),
      slug: String(item.slug || ''),
      title: String(item.title || ''),
      section: String(item.section || ''),
      description: item.description ? String(item.description) : null,
      template: String(item.template || 'gold'),
      thumbnail_url: item.thumbnail_url ? String(item.thumbnail_url) : null,
      texture_url: item.texture_url ? String(item.texture_url) : null,
      created_at: String(item.created_at || ''),
    }))
    .filter((item) => item.section === 'animacion' && Boolean(item.slug));

  return (
    <AnimacionClient>
      <section>
        <HeroSection
          title="Animación"
          textureUrl="/assets/textures/areasg.webp"
          overlayColor="rgba(20, 83, 45, 0.65), rgba(22, 163, 74, 0.8)"
          gradientClass="from-green-900 via-green-800 to-emerald-700"
          description="Aquí podrás acceder a recursos, juegos, cancionero y material actualizado para encuentros con niños y adolescentes."
          textColor="text-white"
        />
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8 md:pb-10">
        <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <Link
            href="/animacion/juegos"
            className="no-underline rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 p-5 hover:shadow-md transition-all"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white mb-3">
              <Gamepad2 size={18} />
            </div>
            <h2 className="text-xl font-black text-emerald-900">Juegos</h2>
            <p className="mt-2 text-sm text-emerald-900/80">
              Dinámicas, propuestas y actividades para encuentros.
            </p>
          </Link>

          <Link
            href="/animacion/canciones"
            className="no-underline rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 p-5 hover:shadow-md transition-all"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white mb-3">
              <Music2 size={18} />
            </div>
            <h2 className="text-xl font-black text-emerald-900">Canciones</h2>
            <p className="mt-2 text-sm text-emerald-900/80">
              Accedé al cancionero con letras y acordes para animar.
            </p>
          </Link>

        </section>

        <section className="mb-4">
          <h2 className="text-2xl md:text-3xl font-black text-emerald-900">Recursos subidos</h2>
          <p className="text-emerald-900/80 mt-1">
            Buscá y abrí rápidamente materiales, enlaces y páginas de apoyo.
          </p>
        </section>

        <AnimacionCardsGrid
          uploadedDocuments={uploadedDocuments}
          uploadedLinks={uploadedLinks}
          resourcePages={resourcePages}
        />

        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-10 md:p-14 rounded-3xl shadow-lg text-center">
          <Quote size={120} className="absolute text-white/5 -top-4 -left-4 -rotate-12" />
          <div className="relative z-[5] max-w-4xl mx-auto">
            <p className="text-2xl md:text-4xl font-bold text-green-300 leading-snug italic mb-6">
              &ldquo;Cantar, jugar y rezar con alegría también es una forma de anunciar a Jesús.&rdquo;
            </p>
            <div className="w-16 h-1 bg-green-400 mx-auto mb-4 rounded-full" />
            <p className="text-lg md:text-xl text-white font-semibold uppercase tracking-widest">
              IAM Paraná
            </p>
          </div>
        </section>
      </main>
    </AnimacionClient>
  );
}

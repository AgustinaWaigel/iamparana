import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gamepad2, Music2, PlaySquare } from 'lucide-react';
import { AreaHero } from '@/app/components/common/area-hero';
import { AreaQuote } from '@/app/components/common/area-quote';
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
    url: 'https://iamparana.com.ar/animacion',
    images: [{ url: 'https://iamparana.com.ar/logoiam.jpg' }],
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
      <div className="min-h-screen bg-brand-paper">
        <AreaHero
          area="animacion"
          title="Animación"
          description="Aquí podrás acceder a recursos, juegos, cancionero y material actualizado para encuentros con niños y adolescentes."
        />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <section aria-label="Accesos rápidos" className="mb-12 grid grid-cols-1 gap-4 sm:mb-16 md:grid-cols-2 md:gap-5">
            <Link
              href="/animacion/juegos"
              className="group flex items-center gap-4 rounded-2xl bg-emerald-700 p-5 text-white no-underline shadow-[0_14px_30px_-18px_rgba(6,78,59,0.7)] transition-[transform,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 motion-reduce:transform-none sm:gap-5 sm:p-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Gamepad2 size={28} strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-left font-display text-2xl font-extrabold leading-tight text-white">Juegos</h2>
                <p className="m-0 mt-1 max-w-none text-left text-sm leading-relaxed text-emerald-50 sm:text-base">
                  Dinámicas, propuestas y actividades para encuentros.
                </p>
              </div>
              <ArrowRight size={22} className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden />
            </Link>

            <Link
              href="/animacion/canciones"
              className="group flex items-center gap-4 rounded-2xl bg-emerald-900 p-5 text-white no-underline shadow-[0_14px_30px_-18px_rgba(6,78,59,0.7)] transition-[transform,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 motion-reduce:transform-none sm:gap-5 sm:p-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Music2 size={28} strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-left font-display text-2xl font-extrabold leading-tight text-white">Canciones</h2>
                <p className="m-0 mt-1 max-w-none text-left text-sm leading-relaxed text-emerald-50 sm:text-base">
                  Accedé al cancionero con letras y acordes para animar.
                </p>
              </div>
              <ArrowRight size={22} className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden />
            </Link>
          </section>

          {/* Música y videos oficiales de IAM Paraná */}
          <section aria-labelledby="musica-videos" className="mb-12 overflow-hidden rounded-3xl bg-emerald-900 p-5 text-white shadow-[0_24px_48px_-28px_rgba(6,78,59,0.8)] sm:mb-16 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="musica-videos" className="m-0 text-left font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
                ¡Rezá cantando!
              </h2>
              <p className="m-0 max-w-md text-left text-base leading-relaxed text-emerald-50/90">
                Las canciones del Equipo de Animación para escuchar en cualquier momento, y los videos del canal de IAM Paraná.
              </p>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
              <div>
                <iframe
                  title="Canciones de IAM Paraná en Spotify"
                  src="https://open.spotify.com/embed/artist/74E30fNeM3IfOifV9JiCux?utm_source=generator&theme=0"
                  width="100%"
                  height="380"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  className="block w-full rounded-2xl border-0 bg-emerald-950"
                />
                <a
                  href="https://open.spotify.com/intl-es/artist/74E30fNeM3IfOifV9JiCux"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white no-underline transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Music2 size={16} aria-hidden /> Abrir en Spotify
                </a>
              </div>

              <div>
                <div className="aspect-video overflow-hidden rounded-2xl bg-emerald-950">
                  <iframe
                    title="Videos de IAM Paraná en YouTube"
                    src="https://www.youtube-nocookie.com/embed/videoseries?list=UUShR66tuvm-N-I5ZUZ6Oo6Q"
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="block h-full w-full border-0"
                  />
                </div>
                <a
                  href="https://www.youtube.com/@IAMArq.Paran%C3%A1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white no-underline transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <PlaySquare size={16} aria-hidden /> Ver todos los videos en YouTube
                </a>
              </div>
            </div>
          </section>

          <AnimacionCardsGrid
            uploadedDocuments={uploadedDocuments}
            uploadedLinks={uploadedLinks}
            resourcePages={resourcePages}
          />

          <AreaQuote
            quote="Cantar, jugar y rezar con alegría también es una forma de anunciar a Jesús."
            author="IAM Paraná"
            accentClass="text-green-300"
          />
        </div>
      </div>
    </AnimacionClient>
  );
}

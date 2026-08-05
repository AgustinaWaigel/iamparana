import Carousel from "@/app/components/common/carousel";
import AgendaHomeDark from "@/app/components/common/agenda-home-dark";
import { FadeInSection } from "@/app/components/common/fade-in-section";
import Link from "next/link";
import Image from "next/image";
import { listCarouselItems, listNoticiasPreview } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { CalendarDays, ChevronRight } from "lucide-react";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import { NoticiasAdminButtons } from "@/app/noticias/components/noticias-admin-buttons";

export const dynamic = "force-dynamic";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  cat?: string;
}

export default async function HomePage() {
  const carouselItems = await listCarouselItems();
  const noticias = (await listNoticiasPreview()) as Noticia[];
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-brand-paper">

      {/* ══════════════════════════════════════════
          1. HERO — Carrusel (banda contenida)
      ══════════════════════════════════════════ */}
      <section className="w-full px-3 sm:px-8 pt-8">
        <Carousel initialItems={carouselItems} isAdmin={isAdmin} />
      </section>

      {/* ══════════════════════════════════════════
          2. NOTICIAS (protagonistas, ancho completo)
      ══════════════════════════════════════════ */}
      <section className="mx-auto w-full px-3 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">
        <FadeInSection>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                Lo último
              </span>
              <h2 className="font-display mt-1.5 text-[32px] sm:text-[40px] font-extrabold leading-none tracking-tight text-brand-ink">
                Noticias
              </h2>
            </div>
            <Link
              href="/noticias"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-4 py-2 text-[13.5px] font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white no-underline"
            >
              Ver todas
              <ChevronRight size={15} />
            </Link>
          </div>
        </FadeInSection>

        <FadeInSection delay={80}>
          {noticias.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Noticia destacada */}
              <div key={noticias[0].slug} className="relative group">
                <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden h-full flex flex-col">
                  <Link href={`/noticias/${noticias[0].slug}`} className="block h-full no-underline flex flex-col">
                    <div className="relative h-64 overflow-hidden bg-gray-200">
                      {getGoogleDriveImageUrl(noticias[0].image) && (
                        <Image
                          src={getGoogleDriveImageUrl(noticias[0].image) || ''}
                          alt={noticias[0].title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={true}
                        />
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {noticias[0].cat && (
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-brown/70 mb-2">
                          • {noticias[0].cat}
                        </span>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-brand-brown mb-3 leading-tight group-hover:text-brand-gold transition-colors">
                          {noticias[0].title}
                        </h2>
                        <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                          {noticias[0].description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold">
                          {new Date(noticias[0].date).toLocaleDateString('es-AR')}
                        </p>
                        <span className="text-sm font-bold text-brand-brown group-hover:translate-x-1 transition-transform">
                          Leer más →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
                {isAdmin && <NoticiasAdminButtons noticia={noticias[0]} />}
              </div>

              {/* Grid de noticias restantes */}
              {noticias.length > 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {noticias.slice(1, 5).map((item) => (
                    <div key={item.slug} className="relative group">
                      <article className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden h-full flex flex-col">
                        <Link href={`/noticias/${item.slug}`} className="block h-full no-underline flex flex-col">
                          <div className="relative h-32 overflow-hidden bg-gray-200">
                            {getGoogleDriveImageUrl(item.image) && (
                              <Image
                                src={getGoogleDriveImageUrl(item.image) || ''}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                priority={false}
                              />
                            )}
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            {item.cat && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/60">
                                {item.cat}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-brand-brown line-clamp-3 group-hover:text-brand-gold transition-colors mt-1">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-gray-500 font-semibold mt-2">
                              {new Date(item.date).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </Link>
                      </article>
                      {isAdmin && <NoticiasAdminButtons noticia={item} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </FadeInSection>
      </section>

      <div className="mx-auto w-full px-3 sm:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-brown/20 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════
          3. AGENDA (banda oscura, abajo)
      ══════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden py-16 sm:py-20 mt-6 sm:mt-8"
        style={{
          backgroundColor: "#3a1508",
          backgroundImage: "url('/assets/header/headerbg.webp')",
          backgroundSize: "520px",
          backgroundBlendMode: "soft-light",
        }}
      >
        <div className="absolute inset-0 bg-brand-deep/80" />
        <div className="relative mx-auto max-w-[1180px] px-6">
          <FadeInSection>
            <div className="mb-9 flex items-end justify-between gap-6">
              <div>
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-gold">
                  Próximas fechas
                </span>
                <h2 className="font-display mt-1.5 text-[32px] sm:text-[40px] font-extrabold leading-none tracking-tight text-white">
                  Agenda misionera
                </h2>
              </div>
              <Link
                href="/calendario"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13.5px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20 no-underline"
              >
                <CalendarDays size={14} />
                Calendario completo
              </Link>
            </div>
          </FadeInSection>

          <FadeInSection delay={80}>
            <AgendaHomeDark />
          </FadeInSection>
        </div>
      </section>

    </div>
  );
}

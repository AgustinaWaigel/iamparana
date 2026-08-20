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
import { OnlineUsersBoard } from "@/app/components/common/online-users-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "IAM Paraná" },
  description: "Sitio oficial de Infancia y Adolescencia Misionera de Paraná. Encontrá noticias, agenda, formación y recursos para encuentros.",
  alternates: { canonical: "/" },
};

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
  const [carouselItems, noticiasResult, user] = await Promise.all([
    listCarouselItems(),
    listNoticiasPreview(),
    getSessionUser(),
  ]);
  const noticias = noticiasResult as Noticia[];
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-brand-paper">

      {/* ══════════════════════════════════════════
          1. HERO — Carrusel (banda contenida)
      ══════════════════════════════════════════ */}
      <section className="w-full px-3 sm:px-8 pt-8">
        <Carousel initialItems={carouselItems} isAdmin={isAdmin} />
      </section>

      <OnlineUsersBoard />

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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
              {noticias.slice(0, 5).map((item, index) => (
                <div
                  key={item.slug}
                  className={`group relative min-w-0 ${index === 0 ? "sm:col-span-2 lg:row-span-2" : ""}`}
                >
                  <article className={`flex h-full flex-col overflow-hidden bg-white shadow-md ring-1 ring-brand-brown/10 transition-all hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "min-h-[480px] rounded-3xl" : "min-h-[250px] rounded-2xl"}`}>
                    <Link href={`/noticias/${item.slug}`} className="flex h-full flex-col no-underline">
                      <div className={`relative shrink-0 overflow-hidden bg-gray-200 ${index === 0 ? "h-64 lg:flex-1" : "h-32"}`}>
                        {getGoogleDriveImageUrl(item.image) && (
                          <Image
                            src={getGoogleDriveImageUrl(item.image) || ''}
                            alt={item.title}
                            fill
                            sizes={index === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className={`flex flex-1 flex-col ${index === 0 ? "p-6 sm:p-7" : "p-4"}`}>
                        {item.cat && (
                          <span className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-brown/65">
                            {item.cat}
                          </span>
                        )}
                        <h3 className={`m-0 line-clamp-2 font-bold leading-tight text-brand-brown transition-colors group-hover:text-brand-gold ${index === 0 ? "text-2xl sm:text-3xl" : "text-base"}`}>
                          {item.title}
                        </h3>
                        {index === 0 && (
                          <p className="m-0 mt-3 line-clamp-3 w-full text-left text-sm leading-relaxed text-gray-600 sm:text-base">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                          <p className="m-0 text-left text-xs font-semibold text-gray-500">
                            {new Date(item.date).toLocaleDateString('es-AR')}
                          </p>
                          <span className="text-sm font-bold text-brand-brown">Leer más →</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                  {isAdmin && <NoticiasAdminButtons noticia={item} />}
                </div>
              ))}
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

import Carousel from "@/app/components/common/carousel";
import AgendaHomeDark from "@/app/components/common/agenda-home-dark";
import Novedades from "@/app/components/common/novedades";
import { FadeInSection } from "@/app/components/common/fade-in-section";
import Link from "next/link";
import { listCarouselItems } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { CalendarDays, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const carouselItems = await listCarouselItems();
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
      <section className="mx-auto w-full px-3 sm:px-8 pt-8 sm:pt-8">
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
          <Novedades gridLayout limit={5} />
        </FadeInSection>
      </section>

      {/* ══════════════════════════════════════════
          3. AGENDA (banda oscura, abajo)
      ══════════════════════════════════════════ */}
      <section
        className="relative w-full overflow-hidden py-16 sm:py-20"
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

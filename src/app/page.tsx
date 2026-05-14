import Carousel from "@/app/components/common/carousel";
import Agenda from "@/app/components/common/agenda";
import AgendaTitle from "@/app/components/common/agenda-title";
import Novedades from "@/app/components/common/novedades";
import { FadeInSection } from "@/app/components/common/fade-in-section";
import Link from "next/link";
import { listCarouselItems } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import {
  CalendarDays,
  Newspaper,
  BookOpen,
  Sparkles,
  Megaphone,
  Package,
  Building2,
  Music2,
  ChevronRight,
  Instagram,
  Youtube,
  Facebook,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Áreas del sitio ──────────────────────────────────────────────
const AREAS = [
  {
    href: "/formacion",
    label: "Formación",
    Icon: BookOpen,
    bg: "from-amber-400 to-yellow-500",
    shadow: "shadow-amber-200",
    text: "text-amber-900",
  },
  {
    href: "/espiritualidad",
    label: "Espiritualidad",
    Icon: Sparkles,
    bg: "from-stone-600 to-stone-800",
    shadow: "shadow-stone-300",
    text: "text-white",
  },
  {
    href: "/animacion",
    label: "Animación",
    Icon: Music2,
    bg: "from-emerald-500 to-green-600",
    shadow: "shadow-emerald-200",
    text: "text-white",
  },
  {
    href: "/comunicacion",
    label: "Comunicación",
    Icon: Megaphone,
    bg: "from-blue-600 to-indigo-700",
    shadow: "shadow-blue-200",
    text: "text-white",
  },
  {
    href: "/logistica",
    label: "Logística",
    Icon: Package,
    bg: "from-red-600 to-rose-700",
    shadow: "shadow-red-200",
    text: "text-white",
  },
];

export default async function HomePage() {
  const carouselItems = await listCarouselItems();
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f0ea]">
      <main className="flex-grow">

        {/* ══════════════════════════════════════════
            1. HERO — Carrusel
        ══════════════════════════════════════════ */}
        <section className="w-full">
          <Carousel initialItems={carouselItems} isAdmin={isAdmin} />
        </section>

        {/* ══════════════════════════════════════════
            2. SEPARADOR visual
        ══════════════════════════════════════════ */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-brand-brown/20 to-transparent" />

        {/* ══════════════════════════════════════════
            3. NOTICIAS + AGENDA
        ══════════════════════════════════════════ */}
        <section className="w-full max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* — Noticias — */}
            <div className="w-full lg:flex-1 min-w-0">
              <FadeInSection>
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-brown flex items-center justify-center shadow-md shadow-brand-brown/25">
                      <Newspaper size={17} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-stone-800 tracking-tight leading-none">
                        Noticias
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">Lo más reciente de la IAM</p>
                    </div>
                  </div>
                  <Link
                    href="/noticias"
                    className="text-xs font-bold text-brand-brown/70 hover:text-brand-brown transition-colors uppercase tracking-wider flex items-center gap-1"
                  >
                    Ver todas
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </FadeInSection>

              <FadeInSection delay={100}>
                <Novedades gridLayout limit={6} />
              </FadeInSection>
            </div>

            {/* — Agenda — */}
            <div className="w-full lg:w-[340px] shrink-0">
              <FadeInSection>
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-brown flex items-center justify-center shadow-md shadow-brand-brown/25">
                      <CalendarDays size={17} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-stone-800 tracking-tight leading-none">
                        Agenda
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">Próximas actividades</p>
                    </div>
                  </div>
                  <AgendaTitle isAdmin={isAdmin} compact />
                </div>
              </FadeInSection>

              <FadeInSection delay={100}>
                <div className="rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <Agenda />
                  </div>
                  <Link
                    href="/calendario"
                    className="flex items-center justify-center gap-2 py-3 border-t border-stone-100 bg-stone-50/70 text-[11px] font-bold uppercase tracking-widest text-stone-400 hover:text-brand-brown transition-colors"
                  >
                    <CalendarDays size={12} />
                    Ver calendario completo
                  </Link>
                </div>
              </FadeInSection>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════
            4. ACCESO RÁPIDO — Áreas del sitio
        ══════════════════════════════════════════ */}
        <section className="w-full bg-white border-b border-stone-100 py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <FadeInSection>
              <div className="text-center mb-10">
                <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-brand-brown/60 mb-3">
                  Explorá el sitio
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-stone-800 tracking-tight">
                  Nuestras áreas
                </h2>
                <p className="mt-3 text-stone-500 text-sm max-w-md mx-auto">
                  Todo lo que necesitás para tu comunidad IAM en un solo lugar
                </p>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {AREAS.map((area, i) => (
                <FadeInSection key={area.href} delay={i * 70}>
                  <Link
                    href={area.href}
                    className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br ${area.bg} p-5 md:p-6 shadow-lg ${area.shadow} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl no-underline overflow-hidden`}
                  >
                    {/* Gloss overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-2xl" />
                    {/* Icono */}
                    <area.Icon
                      size={30}
                      className={`drop-shadow ${area.text} transition-transform duration-300 group-hover:scale-110`}
                      aria-hidden
                    />
                    {/* Label */}
                    <span className={`font-black text-sm md:text-base text-center leading-tight ${area.text} drop-shadow`}>
                      {area.label}
                    </span>
                    {/* Arrow on hover */}
                    <ChevronRight
                      size={14}
                      className={`absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-60 transition-all duration-200 group-hover:translate-x-0.5 ${area.text}`}
                    />
                  </Link>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            5. BANDA — Seguinos en redes
        ══════════════════════════════════════════ */}
        <section className="w-full bg-brand-brown relative overflow-hidden">
          {/* Patrón decorativo de fondo */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative max-w-5xl mx-auto px-6 py-14 text-center">
            <FadeInSection>
              <span className="inline-block text-amber-300/80 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                Comunidad
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                Seguinos en las redes
              </h2>
              <p className="text-amber-100/70 text-sm max-w-md mx-auto mb-8">
                Noticias, fotos y novedades de la Infancia y Adolescencia Misionera de la Arquidiócesis de Paraná
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a
                  href="https://www.instagram.com/iamarqparana/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Instagram size={17} className="shrink-0" />
                  Instagram
                </a>
                <a
                  href="https://www.facebook.com/IamParana/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Facebook size={17} className="shrink-0" />
                  Facebook
                </a>
                <a
                  href="https://www.youtube.com/channel/UCShR66tuvm-N-I5ZUZ6Oo6Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Youtube size={17} className="shrink-0" />
                  YouTube
                </a>
              </div>
            </FadeInSection>
          </div>
        </section>

      </main>
      <footer className="site-footer" />
    </div>
  );
}
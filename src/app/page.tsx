import Carousel from "@/app/components/common/carousel";
import AgendaHomeDark from "@/app/components/common/agenda-home-dark";
import { FadeInSection } from "@/app/components/common/fade-in-section";
import Link from "next/link";
import Image from "next/image";
import { listCarouselItems, listNoticiasPreview } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { ArrowDown, ArrowRight, CalendarDays, ChevronRight, ClipboardPen } from "lucide-react";
import { AREA_ICONS } from "@/app/components/common/area-icons";
import { AREA_ORDER, AREA_THEME } from "@/app/components/common/area-theme";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import { NoticiasAdminButtons } from "@/app/noticias/components/noticias-admin-buttons";
import { OnlineUsersBoard } from "@/app/components/common/online-users-board";
import { MisionGlobo } from "@/app/components/common/mision-globo";
import { Ondas } from "@/app/components/common/ondas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "IAM Paraná" },
  description: "Sitio oficial de Infancia y Adolescencia Misionera de Paraná. Encontrá noticias, agenda, formación y recursos para encuentros.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

const HOME_BUTTON =
  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown";

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
          PORTADA — el carrusel primero, enmarcado en una banda cálida con ondas de colores
      ══════════════════════════════════════════ */}
      <section
        className="relative isolate overflow-hidden text-white"
        style={{
          backgroundColor: "#3a1508",
          backgroundImage: "url('/assets/header/headerbg.webp')",
          backgroundSize: "520px",
          backgroundBlendMode: "soft-light",
        }}
      >
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_0%,rgba(246,196,69,0.22),transparent_55%),linear-gradient(to_bottom,rgba(98,45,13,0.55),rgba(58,21,8,0.9))]" />

        <div className="mx-auto w-full max-w-7xl px-4 pb-36 pt-5 sm:px-6 sm:pb-56 sm:pt-7">
          <div className="hero-rise rounded-[26px] shadow-[0_34px_70px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/15" style={{ ["--d" as string]: "60ms" }}>
            <Carousel initialItems={carouselItems} isAdmin={isAdmin} frameClass="h-[min(62svh,600px)] min-h-[400px] rounded-[26px]" />
          </div>

          <div className="mt-9 grid gap-6 sm:mt-11 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
            <div>
              {/* Rosario misionero: un color por continente. */}
              <div aria-hidden className="mb-4 flex items-center gap-2.5">
                {["#2e9e4f", "#d62828", "#ffffff", "#2563eb", "#f6c445"].map((color, index) => (
                  <span key={color} className="bead block h-3.5 w-3.5 rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.35)] sm:h-4 sm:w-4" style={{ backgroundColor: color, ["--d" as string]: `${300 + index * 90}ms` }} />
                ))}
              </div>
              <h1 className="m-0 text-balance text-left font-display text-[clamp(2.1rem,5.6vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.035em] text-white">
                <span className="hero-rise block" style={{ ["--d" as string]: "220ms" }}>Infancia y Adolescencia</span>
                <span className="hero-rise block" style={{ ["--d" as string]: "320ms" }}>
                  Misionera <span className="text-brand-gold">de Paraná</span>
                </span>
              </h1>
            </div>
            <div className="hero-rise flex flex-wrap gap-3 lg:justify-end lg:pb-2" style={{ ["--d" as string]: "440ms" }}>
              <a href="#areas" className={`${HOME_BUTTON} group bg-brand-gold text-brand-deep shadow-[0_10px_24px_-10px_rgba(246,196,69,0.7)] hover:bg-brand-goldsoft focus-visible:outline-brand-gold`}>
                Explorar recursos
                <ArrowDown size={15} aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-y-0.5 motion-reduce:transform-none" />
              </a>
              <Link href="/calendario" className={`${HOME_BUTTON} border border-white/30 text-white hover:bg-white hover:text-brand-deep focus-visible:outline-brand-gold`}>
                <CalendarDays size={15} aria-hidden />
                Ver agenda
              </Link>
              <Link href="/inscripciones" className={`${HOME_BUTTON} border border-white/30 text-white hover:bg-white hover:text-brand-deep focus-visible:outline-brand-gold`}>
                <ClipboardPen size={15} aria-hidden />
                Inscripciones
              </Link>
            </div>
          </div>
        </div>

        <Ondas hacia="#220c04" />
      </section>

      {/* ══════════════════════════════════════════
          MISIÓN DEL AÑO — el país al que ayudamos, en un globo
      ══════════════════════════════════════════ */}
      <div id="mision" className="scroll-mt-20">
        <MisionGlobo />
      </div>

      {/* ══════════════════════════════════════════
          ÁREAS — accesos a las cinco secciones de recursos
      ══════════════════════════════════════════ */}
      <section id="areas" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pt-12 sm:px-6 sm:pt-16">
        <FadeInSection>
        <h2 className="pop-in m-0 mb-6 text-left font-display text-[32px] font-extrabold leading-none tracking-tight text-brand-ink sm:text-[40px]">
          Recursos por área
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          {AREA_ORDER.map((key, index) => {
            const area = AREA_THEME[key];
            const Icon = AREA_ICONS[key];
            return (
              <Link
                key={key}
                href={area.href}
                style={{ backgroundImage: 'url("/assets/textures/areasg.webp")', backgroundSize: '420px', ["--d" as string]: `${120 + index * 80}ms` }}
                className={`pop-in group flex items-center gap-4 rounded-2xl bg-blend-multiply p-5 no-underline shadow-[0_14px_30px_-20px_rgba(58,21,8,0.55)] transition-[transform,background-color] duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transform-none sm:last:col-span-2 lg:min-h-[230px] lg:flex-col lg:items-start lg:gap-0 lg:last:col-span-1 ${area.tile}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/10 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none">
                  <Icon size={24} strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 lg:mt-5">
                  <span className="block font-display text-[22px] font-extrabold leading-tight">{area.label}</span>
                  <span className="mt-1 block text-sm leading-snug opacity-90">{area.summary}</span>
                </span>
                <ArrowRight size={20} aria-hidden className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none lg:mt-4" />
              </Link>
            );
          })}
        </div>
        </FadeInSection>
      </section>

      <OnlineUsersBoard />

      {/* ══════════════════════════════════════════
          2. NOTICIAS (protagonistas, ancho completo)
      ══════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14">
        <FadeInSection>
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 className="m-0 font-display text-[32px] font-extrabold leading-none tracking-tight text-brand-ink sm:text-[40px]">
              Noticias
            </h2>
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
                  style={{ ["--d" as string]: `${index * 90}ms` }}
                  className={`pop-in group relative min-w-0 ${index === 0 ? "sm:col-span-2 lg:row-span-2" : ""}`}
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
                            className="paralaje object-cover"
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

        <div className="mt-6 sm:hidden">
          <Link href="/noticias" className={`${HOME_BUTTON} w-full justify-center border border-brand-brown/20 text-brand-brown hover:bg-brand-brown hover:text-white`}>
            Ver todas
            <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
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
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <FadeInSection>
            <div className="mb-9 flex items-end justify-between gap-6">
              <h2 className="m-0 font-display text-[32px] font-extrabold leading-none tracking-tight text-white sm:text-[40px]">
                Agenda misionera
              </h2>
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

          <div className="mt-6 sm:hidden">
            <Link href="/calendario" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold">
              <CalendarDays size={15} aria-hidden />
              Calendario completo
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

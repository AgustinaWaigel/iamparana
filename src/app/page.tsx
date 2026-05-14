import Carousel from "@/app/components/common/carousel";
import Agenda from "@/app/components/common/agenda";
import AgendaTitle from "@/app/components/common/agenda-title";
import Novedades from "@/app/components/common/novedades";
import Link from "next/link";
import { listCarouselItems } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { CalendarDays, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const carouselItems = await listCarouselItems();
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">

        {/* ── Carrusel hero ── */}
        <section className="w-full">
          <Carousel initialItems={carouselItems} isAdmin={isAdmin} />
        </section>

        {/* ── Cuerpo principal ── */}
        <section className="w-full max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">

            {/* ── NOTICIAS (columna principal) ── */}
            <div className="w-full lg:flex-1 min-w-0">
              {/* Encabezado sección */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-brown flex items-center justify-center shadow-sm">
                    <Newspaper size={16} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black text-stone-800 tracking-tight">Noticias</h2>
                </div>
                <Link
                  href="/noticias"
                  className="text-xs font-bold text-brand-brown/80 hover:text-brand-brown transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  Ver todas →
                </Link>
              </div>

              <Novedades gridLayout limit={5} />
            </div>

            {/* ── AGENDA (columna lateral) ── */}
            <div className="w-full lg:w-[340px] shrink-0">
              {/* Encabezado sección */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-brown flex items-center justify-center shadow-sm">
                    <CalendarDays size={16} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black text-stone-800 tracking-tight">Agenda</h2>
                </div>
                <AgendaTitle isAdmin={isAdmin} compact />
              </div>

              {/* Panel de la agenda */}
              <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
                <div className="p-4">
                  <Agenda />
                </div>
                <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/70">
                  <Link
                    href="/calendario"
                    className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-brand-brown transition-colors"
                  >
                    <CalendarDays size={12} />
                    Ver calendario completo
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>
      <footer className="site-footer" />
    </div>
  );
}
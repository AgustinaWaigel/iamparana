import Carousel from "@/app/components/common/carousel";
import Agenda from "@/app/components/common/agenda";
import AgendaTitle from "@/app/components/common/agenda-title";
import Novedades from "@/app/components/common/novedades";
import Link from 'next/link';
import { listCarouselItems } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const carouselItems = await listCarouselItems();
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  return (
    <>
      <div className="flex flex-col min-h-screen relative">
        <main className="flex-grow">
          <section className="w-full text-center bg-brand-cream animate-fadeIn">
            <section className="w-full md:pb-12">
              <Carousel initialItems={carouselItems} isAdmin={isAdmin} />
            </section>

            {/* ... Resto de tus botones de acceso rápido ... */}
            <div className="w-full px-3 pb-4">
               {/* (Mantené el código de tus Links aquí igual) */}
            </div>
          </section>

          <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto px-4 pb-16 mb-8">
            <section className="w-full md:w-2/3">
              <h2 className="text-2xl font-bold text-white bg-brand-brown p-4 mb-4 rounded-lg">Noticias</h2>
              <Novedades />
            </section>

            <section className="w-full md:w-1/3">
              <AgendaTitle isAdmin={isAdmin} />
              <Agenda />
            </section>
          </div>
        </main>
        <footer className="site-footer" />
      </div>
    </>
  );
}
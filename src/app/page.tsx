import Carousel from "@/app/components/common/carousel";
import Agenda from "@/app/components/common/agenda";
import AgendaTitle from "@/app/components/common/agenda-title";
import Novedades from "@/app/components/common/novedades";
import Link from 'next/link';
import { listCarouselItems } from "@/server/db/content-repository";
import { getSessionUser } from "@/server/lib/api-utils";
export const dynamic = "force-dynamic";

interface CarouselItem {
  imageDesktop: string;
  imageMobile: string;
  alt: string;
  link?: string;
  buttonText?: string;
}

export default async function HomePage() {
  const carouselItems = await listCarouselItems();
  const user = await getSessionUser();
const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Pantalla principal: presenta el carrusel, accesos rápidos, noticias y agenda. */}
      <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Bloque superior con el carrusel de imágenes destacado. */}
        <section className="w-full text-center bg-brand-cream animate-fadeIn">
          <section className="w-full md:pb-12">
            <Carousel initialItems={carouselItems} />
          </section>

          {/* Botones de acceso a las áreas principales del sitio. */}
          <div className="w-full px-3 pb-4">
            <div className="mx-auto my-[10px] h-auto w-full text-center">
              <div className="mx-auto grid h-auto w-full max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                {/* Animación Button */}
                <Link
                  href="/animacion"
                  className="group flex min-h-[84px] w-full items-center justify-center rounded-lg bg-center bg-cover bg-no-repeat px-4 py-6 text-center text-sm font-bold text-black no-underline transition-all duration-300 hover:scale-[0.98] hover:shadow-sm active:scale-95 sm:min-h-[110px] sm:text-lg md:min-h-[130px] md:text-xl"
                  style={{
                    backgroundImage: "url(/assets/textures/cartoon.webp)",
                    backgroundColor: "rgba(41, 218, 47, 0.7)",
                    backgroundBlendMode: "overlay",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  Animación
                </Link>

                {/* Formación Button */}
                <Link
                  href="/formacion"
                  className="flex min-h-[84px] w-full items-center justify-center rounded-lg bg-center bg-cover bg-no-repeat px-4 py-6 text-center text-sm font-bold text-black no-underline transition-all duration-300 hover:scale-[0.98] hover:shadow-sm active:scale-95 sm:min-h-[110px] sm:text-lg md:min-h-[130px] md:text-xl"
                  style={{
                    backgroundImage: "url(/assets/textures/cartoon.webp)",
                    backgroundColor: "rgba(227, 252, 4, 0.7)",
                    backgroundBlendMode: "overlay",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  Formación
                </Link>

                {/* Espiritualidad Button */}
                <Link
                  href="/espiritualidad"
                  className="flex min-h-[84px] w-full items-center justify-center rounded-lg bg-center bg-cover bg-no-repeat px-4 py-6 text-center text-sm font-bold text-black no-underline transition-all duration-300 hover:scale-[0.98] hover:shadow-sm active:scale-95 sm:min-h-[110px] sm:text-lg md:min-h-[130px] md:text-xl"
                  style={{
                    backgroundImage: "url(/assets/textures/cartoon.webp)",
                    backgroundColor: "rgba(105, 101, 101, 0.7)",
                    backgroundBlendMode: "overlay",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  Espiritualidad
                </Link>

                {/* Logística Button */}
                <Link
                  href="/logistica"
                  className="flex min-h-[84px] w-full items-center justify-center rounded-lg bg-center bg-cover bg-no-repeat px-4 py-6 text-center text-sm font-bold text-black no-underline transition-all duration-300 hover:scale-[0.98] hover:shadow-sm active:scale-95 sm:min-h-[110px] sm:text-lg md:min-h-[130px] md:text-xl"
                  style={{
                    backgroundImage: "url(/assets/textures/cartoon.webp)",
                    backgroundColor: "rgba(233, 42, 61, 0.7)",
                    backgroundBlendMode: "overlay",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  Logística
                </Link>

                {/* Comunicación Button */}
                <Link
                  href="/comunicacion"
                  className="flex min-h-[84px] w-full items-center justify-center rounded-lg bg-center bg-cover bg-no-repeat px-4 py-6 text-center text-sm font-bold text-black no-underline transition-all duration-300 hover:scale-[0.98] hover:shadow-sm active:scale-95 sm:min-h-[110px] sm:text-lg md:min-h-[130px] md:text-xl"
                  style={{
                    backgroundImage: "url(/assets/textures/cartoon.webp)",
                    backgroundColor: "rgba(34, 173, 238, 0.7)",
                    backgroundBlendMode: "overlay",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  Comunicación
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Columna izquierda: novedades. Columna derecha: agenda resumida. */}
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



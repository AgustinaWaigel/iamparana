import Carousel from "@/app/components/common/carousel";
import Agenda from "@/app/components/common/agenda";
import AgendaTitle from "@/app/components/common/agenda-title";
import Novedades from "@/app/components/common/novedades";
import Link from 'next/link';
import { fetchAPI } from "@/app/lib/api-client";

interface CarouselItem {
  imageDesktop: string;
  imageMobile: string;
  alt: string;
  link?: string;
  buttonText?: string;
}

export default async function HomePage() {
  const carouselItems = await fetchAPI<CarouselItem>("/api/carousel");

  return (
    <>
      <header className="site-header" />
      <main className="w-full">
        <section className="w-full text-center bg-brand-cream p-0 animate-fadeIn">
          <section className="w-full 0 md:pt-12 md:pb-12">
            <Carousel initialItems={carouselItems} />
          </section>

          <div className="flex flex-wrap gap-4 justify-between min-h-[200px] w-full">
            <div className="w-full text-center my-[10px] mx-auto h-auto">
              <div className="flex flex-nowrap justify-center gap-6 max-w-full mx-auto overflow-x-auto pb-2 px-2 h-auto">
                {/* Animación Button */}
                <Link
                  href="/animacion"
                  className="group flex justify-center items-center px-4 py-8 sm:px-6 sm:py-12 md:px-6 md:py-12 text-black no-underline text-center bg-center bg-cover bg-no-repeat transition-all duration-300 rounded-lg min-w-[120px] sm:min-w-[160px] md:min-w-[200px] w-auto min-h-[80px] sm:min-h-[110px] md:min-h-[140px] font-bold text-sm sm:text-lg md:text-xl hover:scale-95 hover:shadow-sm whitespace-nowrap active:scale-90"
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
                  className="flex justify-center items-center px-4 py-8 sm:px-6 sm:py-12 md:px-6 md:py-12 text-black no-underline text-center bg-center bg-cover bg-no-repeat transition-all duration-300 rounded-lg min-w-[120px] sm:min-w-[160px] md:min-w-[200px] w-auto min-h-[80px] sm:min-h-[110px] md:min-h-[140px] font-bold text-sm sm:text-lg md:text-xl hover:scale-95 hover:shadow-sm whitespace-nowrap active:scale-90"
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
                  className="flex justify-center items-center px-4 py-8 sm:px-6 sm:py-12 md:px-6 md:py-12 text-black no-underline text-center bg-center bg-cover bg-no-repeat transition-all duration-300 rounded-lg min-w-[120px] sm:min-w-[160px] md:min-w-[200px] w-auto min-h-[80px] sm:min-h-[110px] md:min-h-[140px] font-bold text-sm sm:text-lg md:text-xl hover:scale-95 hover:shadow-sm whitespace-nowrap active:scale-90"
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
                  className="flex justify-center items-center px-4 py-8 sm:px-6 sm:py-12 md:px-6 md:py-12 text-black no-underline text-center bg-center bg-cover bg-no-repeat transition-all duration-300 rounded-lg min-w-[120px] sm:min-w-[160px] md:min-w-[200px] w-auto min-h-[80px] sm:min-h-[110px] md:min-h-[140px] font-bold text-sm sm:text-lg md:text-xl hover:scale-95 hover:shadow-sm whitespace-nowrap active:scale-90"
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
                  className="flex justify-center items-center px-4 py-8 sm:px-6 sm:py-12 md:px-6 md:py-12 text-black no-underline text-center bg-center bg-cover bg-no-repeat transition-all duration-300 rounded-lg min-w-[120px] sm:min-w-[160px] md:min-w-[200px] w-auto min-h-[80px] sm:min-h-[110px] md:min-h-[140px] font-bold text-sm sm:text-lg md:text-xl hover:scale-95 hover:shadow-sm whitespace-nowrap active:scale-90"
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

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto px-4 pb-16 mb-8">
          <section className="w-full md:w-2/3">
            <h2 className="text-2xl font-bold text-white bg-brand-brown p-4 mb-4 rounded-lg">Noticias</h2>
            <Novedades />
          </section>

          <section className="w-full md:w-1/3">
            <AgendaTitle />
            <Agenda />
          </section>
        </div>
      </main>
      <footer className="site-footer" />
    </>
  );
}



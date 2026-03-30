import Image from "next/image";
import Link from "next/link";
import { fetchAPI } from "@/lib/api-client";
import { NoticiasClient } from "@/components/noticias-client";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

export default async function Noticias() {
  const noticias = await fetchAPI<Noticia>("/api/noticias");

  const content = (
    <>
      <div id="header"></div>
      <main className="mt-20">
        <div className="bg-gradient-to-r from-brand-brown to-brand-brown/80 py-8 px-4 text-white text-center mb-12">
          <h1 className="text-4xl font-bold m-0 mb-2">Noticias de la IAM</h1>
          <p className="text-brand-cream/90 m-0">Entérate de las últimas novedades de la IAM Paraná</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 pb-12">
          {noticias.map((item) => (
            <article key={item.slug} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden hover:scale-105">
              <Link href={`/noticias/${item.slug}`} className="block h-full no-underline">
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <Image src={item.image} alt={item.title} width={400} height={300} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-brand-brown mb-2 line-clamp-2 hover:text-brand-gold transition-colors">{item.title}</h2>
                  <p className="text-gray-700 text-sm line-clamp-3 mb-3">{item.description}</p>
                  <p className="text-xs text-gray-500 font-semibold">{new Date(item.date).toLocaleDateString('es-AR')}</p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
      <div id="footer"></div>
    </>
  );

  return <NoticiasClient>{content}</NoticiasClient>;
}

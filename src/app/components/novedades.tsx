import Image from "next/image"
import Link from "next/link";
import { fetchAPI } from "@/lib/api-client";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
}

export default async function Novedades() {
  const noticias = await fetchAPI<Noticia>("/api/noticias");
  const novedades = noticias.slice(0, 4);

  return (
    <ul id="novedades-list" className="flex flex-col gap-6">
      {novedades.map((item) => (
        <li key={item.slug} className="flex gap-6 items-start bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <div className="flex-shrink-0 w-28 h-28 md:w-32 md:h-32">
            <Image 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover rounded-lg" 
              width={500}
              height={500}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brand-brown mb-3">{item.title}</h3>
            <p className="text-base text-gray-800 leading-relaxed mb-3 line-clamp-3">
              {item.description}
            </p>
            <Link href={`/noticias/${item.slug}`} className="text-blue-600 font-semibold hover:text-blue-800 hover:underline">
              Ver más →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

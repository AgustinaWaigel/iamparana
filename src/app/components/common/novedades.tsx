import Link from "next/link";
import { listNoticiasPreview } from "@/server/db/content-repository";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
}

interface NovedadesProps {
  currentSlug?: string;
  limit?: number;
}

export default async function Novedades({ currentSlug, limit = 4 }: NovedadesProps) {
  // Muestra un pequeño bloque con las noticias más recientes en la portada o en la noticia individual.
  const noticias = await listNoticiasPreview();
  const novedades = noticias
    .filter((item) => item.slug !== currentSlug)
    .slice(0, limit);

  if (novedades.length === 0) {
    return <p className="text-sm text-gray-500">No hay mas noticias para mostrar.</p>;
  }

  return (
    <ul id="novedades-list" className="flex flex-col gap-4 md:gap-5">
      {novedades.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/noticias/${item.slug}`}
            className="group relative flex items-center gap-4 md:gap-5 rounded-2xl border border-[#eadfd5] bg-gradient-to-br from-white to-[#fff8f2] p-4 md:p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown/40 no-underline"
            aria-label={`Abrir noticia: ${item.title}`}
          >
            <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-[#e8ddd2] bg-gray-100 md:h-48 md:w-48">
              <img
                src={getGoogleDriveImageUrl(item.image)}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-brown/70">Novedad</p>
              <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-[#6b3f24] transition-colors group-hover:text-[#7a4628] md:text-xl">{item.title}</h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-gray-700 md:text-[15px]">
                {item.description}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-brown/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Abrir noticia
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
import Link from "next/link";
import { listNoticiasPreview } from "@/server/db/content-repository";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  cat?: string;
}

interface NovedadesProps {
  currentSlug?: string;
  limit?: number;
  /** Si es true, usa el layout en grilla visual (portada) */
  gridLayout?: boolean;
}

export default async function Novedades({
  currentSlug,
  limit = 4,
  gridLayout = false,
}: NovedadesProps) {
  const noticias = await listNoticiasPreview();
  const novedades = noticias
    .filter((item) => item.slug !== currentSlug)
    .slice(0, limit) as Noticia[];

  if (novedades.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No hay noticias para mostrar.
      </p>
    );
  }

  /* ── Layout lista clásico (usado en otras páginas) ────────────────── */
  if (!gridLayout) {
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
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-brown/70">
                  {item.cat || "Novedad"}
                </p>
                <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-[#6b3f24] transition-colors group-hover:text-[#7a4628] md:text-xl">
                  {item.title}
                </h3>
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

  /* ── Layout grilla visual (portada) ──────────────────────────────── */
  const [featured, ...rest] = novedades;

  return (
    <div className="w-full">
      {/* Primera noticia: card grande */}
      {featured && (
        <Link
          href={`/noticias/${featured.slug}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e8ddd2] bg-white shadow-md hover:shadow-xl transition-all duration-300 mb-4 no-underline"
          aria-label={`Abrir noticia: ${featured.title}`}
        >
          {/* Imagen grande */}
          <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-gray-100">
            <img
              src={getGoogleDriveImageUrl(featured.image)}
              alt={featured.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
              decoding="async"
            />
            {/* Badge categoría */}
            <span className="absolute top-3 left-3 bg-brand-brown text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
              {featured.cat || "Novedad"}
            </span>
          </div>
          {/* Texto */}
          <div className="p-4 sm:p-5">
            <h3 className="text-lg sm:text-xl font-bold text-[#4a2c14] leading-tight mb-2 line-clamp-2 group-hover:text-brand-brown transition-colors">
              {featured.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
              {featured.description}
            </p>
            <span className="mt-3 inline-block text-xs font-bold uppercase tracking-wide text-brand-brown/80 opacity-0 group-hover:opacity-100 transition-opacity">
              Leer más →
            </span>
          </div>
        </Link>
      )}

      {/* Resto: grid 2 columnas */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((item) => (
            <Link
              key={item.slug}
              href={`/noticias/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#e8ddd2] bg-white shadow-sm hover:shadow-lg transition-all duration-300 no-underline"
              aria-label={`Abrir noticia: ${item.title}`}
            >
              {/* Imagen */}
              <div className="relative h-36 overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={getGoogleDriveImageUrl(item.image)}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <span className="absolute top-2 left-2 bg-brand-brown/90 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                  {item.cat || "Novedad"}
                </span>
              </div>
              {/* Texto */}
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-[#4a2c14] leading-snug line-clamp-2 mb-1 group-hover:text-brand-brown transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                  {item.description}
                </p>
                <span className="mt-2 text-[10px] font-bold uppercase tracking-wide text-brand-brown/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  Leer más →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
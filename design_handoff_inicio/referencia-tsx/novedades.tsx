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
  /** Si es true, usa el layout editorial de portada (destacada + lista) */
  gridLayout?: boolean;
}

export default async function Novedades({
  currentSlug,
  limit = 5,
  gridLayout = false,
}: NovedadesProps) {
  const noticias = await listNoticiasPreview();
  const novedades = noticias
    .filter((item) => item.slug !== currentSlug)
    .slice(0, limit) as Noticia[];

  if (novedades.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No hay noticias para mostrar.</p>;
  }

  /* ── Layout lista clásico (usado en otras páginas) ────────────────── */
  if (!gridLayout) {
    return (
      <ul id="novedades-list" className="flex flex-col gap-4 md:gap-5">
        {novedades.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/noticias/${item.slug}`}
              className="group relative flex items-center gap-4 md:gap-5 rounded-2xl border border-[#eadfd5] bg-gradient-to-br from-white to-[#fff8f2] p-4 md:p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg no-underline"
              aria-label={`Abrir noticia: ${item.title}`}
            >
              {getGoogleDriveImageUrl(item.image) && (
                <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-[#e8ddd2] bg-gray-100 md:h-48 md:w-48">
                  <img
                    src={getGoogleDriveImageUrl(item.image) || undefined}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-brown/70">
                  {item.cat || "Novedad"}
                </p>
                <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-[#6b3f24] md:text-xl">
                  {item.title}
                </h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-700 md:text-[15px]">
                  {item.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  /* ── Layout editorial de PORTADA: destacada grande + lista lateral ── */
  const [featured, ...rest] = novedades;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_1fr]">
      {/* ── Nota destacada ── */}
      {featured && (
        <Link
          href={`/noticias/${featured.slug}`}
          className="group flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_18px_44px_-26px_rgba(58,21,8,0.5)] ring-1 ring-brand-brown/10 transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-26px_rgba(58,21,8,0.55)] no-underline"
          aria-label={`Abrir noticia: ${featured.title}`}
        >
          <div className="h-[280px] sm:h-[340px] w-full overflow-hidden bg-stone-100">
            {getGoogleDriveImageUrl(featured.image) ? (
              <img
                src={getGoogleDriveImageUrl(featured.image) || undefined}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand-brown to-stone-900" />
            )}
          </div>
          <div className="flex flex-1 flex-col p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-brown/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-brown">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e3a92c]" />
                {featured.cat || "Novedad"}
              </span>
            </div>
            <h3 className="mt-3.5 text-2xl sm:text-[28px] font-black leading-[1.1] text-stone-900 text-balance">
              {featured.title}
            </h3>
            <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-stone-600">
              {featured.description}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-brown">
              Leer la nota
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </Link>
      )}

      {/* ── Lista de secundarias ── */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[24px] bg-[#f6f1ea]/70 p-3 ring-1 ring-brand-brown/10">
          {rest.map((item, k) => (
            <div key={item.slug}>
              <Link
                href={`/noticias/${item.slug}`}
                className="group flex gap-4 rounded-2xl p-2.5 transition-colors hover:bg-white no-underline"
                aria-label={`Abrir noticia: ${item.title}`}
              >
                <div className="h-[92px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  {getGoogleDriveImageUrl(item.image) ? (
                    <img
                      src={getGoogleDriveImageUrl(item.image) || undefined}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-brown">
                      {item.cat || "Novedad"}
                    </span>
                  </div>
                  <h4 className="mt-1 line-clamp-3 text-[16.5px] font-bold leading-[1.18] text-stone-900 group-hover:text-brand-brown">
                    {item.title}
                  </h4>
                </div>
              </Link>
              {k < rest.length - 1 && <div className="mx-3 h-px bg-brand-brown/10" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { NoticiasClient } from "@/app/noticias/components/noticias-client";
import { NoticiasAdminButtons } from "@/app/noticias/components/noticias-admin-buttons";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import { listNoticiasPreview } from "@/server/db/content-repository";
import { Search, X } from "lucide-react";
export const dynamic = "force-dynamic";

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return new Date(0);
}

function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (d.getTime() === 0) return dateStr;
  return d.toLocaleDateString('es-AR');
}

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  cat?: string;
}

export default async function Noticias({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const searchQuery = q.trim();
  let noticias = await listNoticiasPreview() as Noticia[];

  if (searchQuery) {
    const normalizedQuery = searchQuery.toLocaleLowerCase('es');
    noticias = noticias.filter((noticia) =>
      [noticia.title, noticia.description, noticia.cat]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es').includes(normalizedQuery))
    );
  }
  
  // Sort by date descending
  noticias = noticias.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  // Las categorías se construyen exclusivamente con los valores presentes
  // en Turso. Las variantes de mayúsculas/minúsculas se agrupan juntas.
  const categoryMap = new Map<string, { label: string; key: string; count: number }>();
  for (const noticia of noticias) {
    const label = noticia.cat?.trim();
    if (!label) continue;

    const key = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const existing = categoryMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(key, { label, key, count: 1 });
    }
  }

  const categorias = [
    { label: "Todas", key: "todas", count: noticias.length },
    ...Array.from(categoryMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'es')),
  ];

  const content = (
    <>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b border-brand-gold/20 px-5 py-14 sm:px-10 sm:py-20"
        style={{
          backgroundColor: "#3a1508",
          backgroundImage: `
            linear-gradient(
              115deg,
              rgba(44, 15, 5, 0.98) 0%,
              rgba(86, 42, 20, 0.94) 58%,
              rgba(105, 61, 31, 0.9) 100%
            ),
            url('/assets/textures/areasg.webp')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                Enterate de todas las novedades
              </div>

              <h1 className="m-0 max-w-3xl text-left font-display text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Noticias de la IAM
              </h1>

              <p className="m-0 mt-6 max-w-2xl text-left text-base leading-relaxed text-amber-50/80 sm:text-lg">
                Eventos, noticias, encuentros y propuestas de la Infancia y Adolescencia
                Misionera de Paraná.
              </p>

              <form action="/noticias" method="get" className="mt-7 flex max-w-2xl items-center gap-2">
                <label className="relative block min-w-0 flex-1">
                  <span className="sr-only">Buscar noticias</span>
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/50"
                    size={18}
                  />
                  <input
                    type="search"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Buscar por título, descripción o categoría..."
                    className="h-12 w-full rounded-full border border-white/20 bg-white py-3 pl-11 pr-5 text-sm font-medium text-brand-brown shadow-xl outline-none placeholder:text-brand-brown/45 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/20"
                  />
                </label>
                <button
                  type="submit"
                  className="h-12 shrink-0 rounded-full bg-brand-gold px-5 text-sm font-black text-brand-deep transition hover:bg-brand-goldsoft"
                >
                  Buscar
                </button>
                {searchQuery && (
                  <Link
                    href="/noticias"
                    aria-label="Limpiar búsqueda"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <X size={18} />
                  </Link>
                )}
              </form>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full bg-white">
        {/* Filtros */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <NoticiasFiltersSection categorias={categorias} />
        </div>

        {/* Grid Principal - Noticia destacada + cuatro noticias */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {noticias.length === 0 && (
            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-6 py-16 text-center">
              <Search className="mx-auto mb-4 text-stone-300" size={34} />
              <h2 className="m-0 text-xl font-black text-brand-brown">No encontramos noticias</h2>
              <p className="m-0 mt-2 text-sm text-stone-500">
                {searchQuery ? `No hay resultados para “${searchQuery}”.` : 'Todavía no hay noticias publicadas.'}
              </p>
              {searchQuery && (
                <Link href="/noticias" className="mt-5 inline-flex rounded-full bg-brand-brown px-5 py-2.5 text-sm font-bold text-white">
                  Ver todas las noticias
                </Link>
              )}
            </div>
          )}
          {noticias.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Noticia destacada izquierda */}
              <div className="relative group">
                <article className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden h-full flex flex-col border border-gray-100">
                  <Link href={`/noticias/${noticias[0].slug}`} className="block h-full no-underline flex flex-col">
                    <div className="relative h-64 overflow-hidden bg-gray-200">
                      {getGoogleDriveImageUrl(noticias[0].image) && (
                        <Image
                          src={getGoogleDriveImageUrl(noticias[0].image) || ''}
                          alt={noticias[0].title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          priority={true}
                        />
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {noticias[0].cat && (
                        <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-brown/70 mb-2">
                          • {noticias[0].cat}
                        </span>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-brand-brown mb-3 leading-tight group-hover:text-brand-gold transition-colors">
                          {noticias[0].title}
                        </h2>
                        <p className="m-0 mb-4 w-full text-left text-gray-700 text-sm line-clamp-2">
                          {noticias[0].description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="m-0 w-full text-left text-xs text-gray-500 font-semibold">
                          {formatDate(noticias[0].date)}
                        </p>
                        <span className="text-sm font-bold text-brand-brown group-hover:translate-x-1 transition-transform">
                          Leer más →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
                {<NoticiasAdminButtons noticia={noticias[0]} />}
              </div>

              {/* Grid de 4 noticias derecha */}
              {noticias.length > 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {noticias.slice(1, 5).map((item) => (
                    <div key={item.slug} className="relative group">
                      <article className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden h-full flex flex-col border border-gray-100">
                        <Link href={`/noticias/${item.slug}`} className="block h-full no-underline flex flex-col">
                          <div className="relative h-32 overflow-hidden bg-gray-200">
                            {getGoogleDriveImageUrl(item.image) && (
                              <Image
                                src={getGoogleDriveImageUrl(item.image) || ''}
                                alt={item.title}
                                fill
                                sizes="(max-width: 1024px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                priority={false}
                              />
                            )}
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            {item.cat && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/60">
                                {item.cat}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-brand-brown line-clamp-3 group-hover:text-brand-gold transition-colors">
                              {item.title}
                            </h3>
                            <p className="m-0 mt-2 w-full text-left text-[11px] text-gray-500 font-semibold">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </Link>
                      </article>
                      {<NoticiasAdminButtons noticia={item} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Más noticias */}
        {noticias.length > 5 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-brand-brown mb-8">Más noticias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticias.slice(5).map((item) => (
                <div key={item.slug} className="relative group">
                  <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100">
                    <Link href={`/noticias/${item.slug}`} className="block h-full no-underline">
                      <div className="relative h-48 overflow-hidden bg-gray-200">
                        {getGoogleDriveImageUrl(item.image) && (
                          <Image
                            src={getGoogleDriveImageUrl(item.image) || ''}
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            priority={false}
                          />
                        )}
                      </div>
                      <div className="p-4">
                        {item.cat && (
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-brown/70 block mb-2">
                            {item.cat}
                          </span>
                        )}
                        <h2 className="text-lg font-bold text-brand-brown mb-2 line-clamp-2 group-hover:text-brand-gold transition-colors">
                          {item.title}
                        </h2>
                        <p className="m-0 mb-3 w-full text-left text-gray-600 text-sm line-clamp-2">
                          {item.description}
                        </p>
                        <p className="m-0 w-full text-left text-xs text-gray-500 font-semibold">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </Link>
                  </article>
                  {<NoticiasAdminButtons noticia={item} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );

  return <NoticiasClient noticias={noticias}>{content}</NoticiasClient>;
}

// Componente de filtros
function NoticiasFiltersSection({ categorias }: { categorias: { label: string; key: string; count: number }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categorias.map((cat) => (
        <button
          key={cat.key}
          className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 flex-shrink-0 ${
            cat.key === "todas"
              ? "bg-brand-brown text-white"
              : "bg-white text-brand-brown border-2 border-brand-brown/20 hover:border-brand-brown/40"
          }`}
        >
          {cat.label}
          <span className="font-bold">{cat.count}</span>
        </button>
      ))}
    </div>
  );
}

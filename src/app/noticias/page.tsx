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

function normalizeCategory(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
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
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q = '', categoria = 'todas' } = await searchParams;
  const searchQuery = q.trim();
  const allNoticias = await listNoticiasPreview() as Noticia[];

  const categoryMap = new Map<string, { label: string; key: string; count: number }>();
  for (const noticia of allNoticias) {
    const label = noticia.cat?.trim();
    if (!label) continue;
    const key = normalizeCategory(label);
    const existing = categoryMap.get(key);
    if (existing) existing.count += 1;
    else categoryMap.set(key, { label: label.toUpperCase(), key, count: 1 });
  }

  const categorias = [
    { label: "TODAS", key: "todas", count: allNoticias.length },
    ...Array.from(categoryMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'es')),
  ];
  const selectedCategory = categoria === 'todas' ? 'todas' : normalizeCategory(categoria);
  let noticias = selectedCategory === 'todas'
    ? allNoticias
    : allNoticias.filter((noticia) => normalizeCategory(noticia.cat || '') === selectedCategory);

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
                {selectedCategory !== 'todas' && <input type="hidden" name="categoria" value={selectedCategory} />}
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
          <NoticiasFiltersSection categorias={categorias} selectedCategory={selectedCategory} searchQuery={searchQuery} />
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
            <div className="flex flex-wrap gap-5">
              {noticias.map((item, index) => (
                <div key={item.slug} className="group relative min-w-0 flex-[1_1_320px]">
                  <article className="flex h-full min-h-[430px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                    <Link href={`/noticias/${item.slug}`} className="flex h-full flex-col no-underline">
                      <div className="relative h-52 shrink-0 overflow-hidden bg-gray-200 sm:h-56">
                        {getGoogleDriveImageUrl(item.image) && (
                          <Image
                            src={getGoogleDriveImageUrl(item.image) || ''}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={index === 0}
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        {item.cat && (
                          <span className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-brown/70">
                            {item.cat}
                          </span>
                        )}
                        <h2 className="m-0 line-clamp-2 text-xl font-bold leading-tight text-brand-brown transition-colors group-hover:text-brand-gold">
                          {item.title}
                        </h2>
                        <p className="m-0 mt-3 line-clamp-3 w-full text-left text-sm leading-relaxed text-gray-600">
                          {item.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                          <p className="m-0 text-left text-xs font-semibold text-gray-500">
                            {formatDate(item.date)}
                          </p>
                          <span className="text-sm font-bold text-brand-brown transition-transform group-hover:translate-x-1">
                            Leer más →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                  <NoticiasAdminButtons noticia={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );

  return <NoticiasClient noticias={noticias}>{content}</NoticiasClient>;
}

// Componente de filtros
function NoticiasFiltersSection({ categorias, selectedCategory, searchQuery }: { categorias: { label: string; key: string; count: number }[]; selectedCategory: string; searchQuery: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categorias.map((cat) => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (cat.key !== 'todas') params.set('categoria', cat.key);
        const href = params.size ? `/noticias?${params.toString()}` : '/noticias';
        const active = cat.key === selectedCategory;

        return (
          <Link
            key={cat.key}
            href={href}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold uppercase no-underline transition-all ${
              active
                ? "bg-brand-brown text-white"
                : "border-2 border-brand-brown/20 bg-white text-brand-brown hover:border-brand-brown/40"
            }`}
          >
            {cat.label}
            <span className="font-black">{cat.count}</span>
          </Link>
        );
      })}
    </div>
  );
}

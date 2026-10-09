import Link from "next/link";
import Image from "next/image";
import { NoticiasClient } from "@/app/noticias/components/noticias-client";
import { NoticiasAdminButtons } from "@/app/noticias/components/noticias-admin-buttons";
import { MandarNoticia } from "@/app/comunicacion/components/mandar-noticia";
import { Ondas } from "@/app/components/common/ondas";
import { Paginacion } from "@/app/components/common/paginacion";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import { colorDeCategoria, fechaLargaNoticia, nombreDeCategoria, parseFechaNoticia } from "@/app/noticias/formato";
import { listNoticiasPreview } from "@/server/db/content-repository";
import { ArrowRight, Megaphone, Newspaper, Search, X } from "lucide-react";
import type { Metadata } from "next";
import { coincideBusqueda } from '@/lib/busqueda';

// Todas las noticias: la más nueva en la portada, como tapa de diario; después los filtros
// (categoría, año y orden), las tarjetas y el formulario para mandar una noticia propia.

export const metadata: Metadata = {
  title: "Noticias",
  description: "Últimas noticias, actividades y novedades de Infancia y Adolescencia Misionera de Paraná.",
  alternates: { canonical: "/noticias" },
};
export const dynamic = "force-dynamic";

function normalizeCategory(value: string): string {
  return value.normalize('NFD').replace(/\p{M}+/gu, '').trim().toLowerCase();
}

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  cat?: string;
}

/** Noticias por página, sin contar la destacada de la portada. */
const POR_PAGINA = 9;

const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown";
/** El mismo botón en todas las noticias, la destacada incluida. */
const LEER = "inline-flex items-center gap-2 rounded-full bg-brand-deep px-4 py-2.5 text-sm font-extrabold text-white";
const CHIP = `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold no-underline transition-colors ${FOCO}`;

function Etiqueta({ categoria }: { categoria?: string }) {
  if (!categoria?.trim()) return null;
  return <span className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-extrabold ${colorDeCategoria(categoria)}`}>{nombreDeCategoria(categoria)}</span>;
}

function BotonLeer() {
  return (
    <span className={LEER}>
      Leer la noticia
      <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
    </span>
  );
}

export default async function Noticias({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; anio?: string; orden?: string; pagina?: string }>;
}) {
  const { q = '', categoria = 'todas', anio = '', orden = '', pagina = '1' } = await searchParams;
  const searchQuery = q.trim();
  const allNoticias = await listNoticiasPreview() as Noticia[];
  const anioDe = (noticia: Noticia) => parseFechaNoticia(noticia.date)?.getFullYear() ?? null;

  const categoryMap = new Map<string, { label: string; key: string; count: number }>();
  for (const noticia of allNoticias) {
    const label = noticia.cat?.trim();
    if (!label) continue;
    const key = normalizeCategory(label);
    const existing = categoryMap.get(key);
    if (existing) existing.count += 1;
    else categoryMap.set(key, { label: nombreDeCategoria(label), key, count: 1 });
  }
  const categorias = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
  const anios = [...new Set(allNoticias.map(anioDe).filter((valor): valor is number => valor !== null))].sort((a, b) => b - a);

  const selectedCategory = categoria === 'todas' ? 'todas' : normalizeCategory(categoria);
  const selectedYear = anios.includes(Number(anio)) ? Number(anio) : null;
  const viejasPrimero = orden === 'viejas';

  let noticias = allNoticias.filter((noticia) =>
    (selectedCategory === 'todas' || normalizeCategory(noticia.cat || '') === selectedCategory)
    && (selectedYear === null || anioDe(noticia) === selectedYear)
    && (!searchQuery || coincideBusqueda(searchQuery, noticia.title, noticia.description, noticia.cat)));
  noticias = noticias.sort((a, b) => ((parseFechaNoticia(b.date)?.getTime() ?? 0) - (parseFechaNoticia(a.date)?.getTime() ?? 0)) * (viejasPrimero ? -1 : 1));

  /** Enlace al listado con los filtros actuales, cambiando solo lo que se le pasa. */
  const enlace = (cambios: { q?: string; categoria?: string; anio?: string; orden?: string; pagina?: string }) => {
    // Al cambiar un filtro se vuelve a la primera página.
    const actual = { q: searchQuery, categoria: selectedCategory === 'todas' ? '' : selectedCategory, anio: selectedYear ? String(selectedYear) : '', orden: viejasPrimero ? 'viejas' : '', ...cambios };
    const params = new URLSearchParams(Object.entries(actual).filter(([, valor]) => valor));
    return params.size ? `/noticias?${params.toString()}#listado` : cambios.pagina === '' ? '/noticias#listado' : '/noticias';
  };

  const filtrando = Boolean(searchQuery) || selectedCategory !== 'todas' || selectedYear !== null || viejasPrimero;
  // La más nueva va en la portada; al buscar o filtrar, todas iguales para comparar resultados.
  const destacada = !filtrando && noticias.length >= 3 ? noticias[0] : null;
  const todasLasDemas = destacada ? noticias.slice(1) : noticias;
  const paginas = Math.ceil(todasLasDemas.length / POR_PAGINA);
  const paginaActual = Math.min(Math.max(1, Number.parseInt(pagina, 10) || 1), Math.max(1, paginas));
  const resto = todasLasDemas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const imagenDestacada = destacada ? getGoogleDriveImageUrl(destacada.image) : null;

  const content = (
    <div className="min-h-screen bg-brand-paper">
      {/* ── Portada: el título, el buscador y la última noticia como tapa ── */}
      <section
        className="relative isolate overflow-hidden text-white"
        style={{ backgroundColor: "#3a1508", backgroundImage: "url('/assets/header/headerbg.webp')", backgroundSize: "520px", backgroundBlendMode: "soft-light" }}
      >
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_15%,rgba(246,196,69,0.28),transparent_55%),linear-gradient(to_bottom,rgba(98,45,13,0.55),rgba(58,21,8,0.92))]" />
        <div className={`mx-auto grid max-w-7xl items-center gap-10 px-4 pb-28 pt-16 sm:px-6 sm:pb-36 sm:pt-20 ${destacada ? "lg:grid-cols-[1fr_1.05fr] lg:gap-14" : ""}`}>
          <div>
            <div aria-hidden className="mb-5 flex items-center gap-2.5">
              {["#2e9e4f", "#d62828", "#ffffff", "#2563eb", "#f6c445"].map((color, index) => (
                <span key={color} className="bead block h-3.5 w-3.5 rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.35)] sm:h-4 sm:w-4" style={{ backgroundColor: color, ["--d" as string]: `${200 + index * 90}ms` }} />
              ))}
            </div>
            <h1 className="hero-rise m-0 text-left font-display text-[clamp(3rem,11vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-white">
              Noticias <span className="block text-brand-gold">de la IAM</span>
            </h1>
            <p className="hero-rise m-0 mt-5 max-w-xl text-left text-base leading-relaxed text-white/85 sm:text-lg" style={{ ["--d" as string]: "100ms" }}>
              Lo que pasa en los encuentros, las parroquias y la misión, contado por la propia comunidad.
            </p>

            <form action="/noticias" method="get" role="search" className="hero-rise mt-7 flex max-w-xl items-center gap-2" style={{ ["--d" as string]: "200ms" }}>
              {selectedCategory !== 'todas' && <input type="hidden" name="categoria" value={selectedCategory} />}
              {selectedYear && <input type="hidden" name="anio" value={selectedYear} />}
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">Buscar noticias</span>
                <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/70" size={18} />
                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Buscar una noticia..."
                  className="h-12 w-full rounded-full border-0 bg-white py-3 pl-11 pr-5 text-base text-brand-ink outline-none placeholder:text-stone-500 focus:ring-4 focus:ring-brand-gold/60"
                />
              </label>
              <button type="submit" className="h-12 shrink-0 rounded-full bg-brand-gold px-5 text-sm font-extrabold text-brand-deep transition-colors hover:bg-brand-goldsoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Buscar
              </button>
              {searchQuery && (
                <Link href={enlace({ q: '' })} aria-label="Borrar la búsqueda" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <X size={18} aria-hidden />
                </Link>
              )}
            </form>

            <a href="#mandar-noticia" className="hero-rise group mt-5 inline-flex items-center gap-2 rounded-full border border-white/35 px-5 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-white hover:text-brand-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold" style={{ ["--d" as string]: "300ms" }}>
              <Megaphone size={16} aria-hidden className="transition-transform duration-300 ease-out group-hover:-rotate-12 motion-reduce:transform-none" />
              ¿Tenés una noticia? Mandánosla
            </a>
          </div>

          {/* La última noticia, como la tapa del día. */}
          {destacada && (
            <div className="hero-rise group relative mx-auto w-full max-w-xl lg:max-w-none" style={{ ["--d" as string]: "260ms" }}>
              <article className="rotate-1 overflow-hidden rounded-[28px] bg-white text-brand-ink shadow-[0_34px_70px_-30px_rgba(0,0,0,0.85)] transition-transform duration-500 ease-out group-hover:rotate-0 motion-reduce:transform-none">
                <Link href={`/noticias/${destacada.slug}`} className="block no-underline focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-brown">
                  <div className="relative aspect-[16/10] overflow-hidden bg-brand-cream">
                    {imagenDestacada && (
                      <Image src={imagenDestacada} alt="" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none" />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3.5 py-1.5 text-xs font-extrabold text-brand-deep shadow-[0_8px_14px_-8px_rgba(58,21,8,0.9)]">Lo último</span>
                  </div>
                  <div className="p-6 sm:p-7">
                    <Etiqueta categoria={destacada.cat} />
                    <h2 className="m-0 mt-3 text-balance text-left font-display text-[clamp(1.6rem,3vw,2.25rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-brand-ink">
                      {destacada.title}
                    </h2>
                    <p className="m-0 mt-3 line-clamp-2 max-w-none text-left text-base leading-relaxed text-brand-ink/80">{destacada.description}</p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="m-0 max-w-none text-left text-sm font-medium text-brand-ink/70">{fechaLargaNoticia(destacada.date)}</p>
                      <BotonLeer />
                    </div>
                  </div>
                </Link>
              </article>
              <NoticiasAdminButtons noticia={destacada} />
            </div>
          )}
        </div>
        <Ondas hacia="#fbf8f3" simple />
      </section>

      <main id="listado" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
        {/* ── Filtros ── */}
        <div role="navigation" aria-label="Filtrar las noticias">
          {/* Categorías: un bloque de color por cada una. */}
          {categorias.length > 1 && (
            <ul className="-mx-4 m-0 flex list-none snap-x gap-3 overflow-x-auto px-4 pb-3 pt-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
              {[{ label: "Todas", key: "todas", count: allNoticias.length }, ...categorias].map((cat) => {
                const activa = cat.key === selectedCategory;
                const color = cat.key === "todas" ? "bg-brand-deep text-white" : colorDeCategoria(cat.label);
                return (
                  <li key={cat.key} className="shrink-0 snap-start sm:flex-1 sm:basis-40">
                    <Link
                      href={enlace({ categoria: cat.key === "todas" ? "" : cat.key })}
                      aria-current={activa ? "true" : undefined}
                      className={`group/cat relative flex h-24 w-36 flex-col justify-between overflow-hidden rounded-2xl p-3.5 no-underline transition-[transform,opacity] duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none sm:w-auto ${FOCO} ${color} ${activa ? "outline outline-[3px] outline-offset-2 outline-brand-ink" : selectedCategory === "todas" ? "" : "opacity-60 hover:opacity-100"}`}
                    >
                      <Newspaper aria-hidden strokeWidth={1.5} className="absolute -bottom-4 -right-3 h-20 w-20 -rotate-12 opacity-20 transition-transform duration-500 ease-out group-hover/cat:rotate-0 motion-reduce:transform-none" />
                      <span className="relative font-display text-lg font-extrabold leading-none tracking-[-0.02em]">{cat.label}</span>
                      <span className="relative text-sm font-bold tabular-nums">{cat.count} {cat.count === 1 ? "noticia" : "noticias"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            {/* Año: solo si hay noticias de más de uno. */}
            {anios.length > 1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-brand-ink/70">Año</span>
                {[null, ...anios].map((valor) => {
                  const activo = valor === selectedYear;
                  return (
                    <Link key={valor ?? "todos"} href={enlace({ anio: valor ? String(valor) : "" })} aria-current={activo ? "true" : undefined} className={`${CHIP} tabular-nums ${activo ? "bg-brand-deep text-white" : "bg-white text-brand-ink hover:bg-brand-cream"}`}>
                      {valor ?? "Todos"}
                    </Link>
                  );
                })}
              </div>
            ) : <span />}

            <div className="flex rounded-full bg-brand-brown/10 p-1">
              {[{ clave: "", nombre: "Más nuevas" }, { clave: "viejas", nombre: "Más viejas" }].map((item) => {
                const activo = (item.clave === "viejas") === viejasPrimero;
                return (
                  <Link key={item.nombre} href={enlace({ orden: item.clave })} aria-current={activo ? "true" : undefined} className={`rounded-full px-3.5 py-1.5 text-sm font-bold no-underline transition-colors ${FOCO} ${activo ? "bg-brand-deep text-white" : "text-brand-ink/75 hover:text-brand-ink"}`}>
                    {item.nombre}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {filtrando && noticias.length > 0 && (
          <p aria-live="polite" className="m-0 mt-5 flex max-w-none flex-wrap items-center gap-x-3 gap-y-1 text-left text-sm font-medium text-brand-ink/70">
            <span>{noticias.length} {noticias.length === 1 ? "noticia" : "noticias"}{searchQuery && ` para «${searchQuery}»`}</span>
            <Link href="/noticias" className={`rounded font-bold text-blue-800 underline underline-offset-2 ${FOCO}`}>Quitar los filtros</Link>
          </p>
        )}

        {noticias.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-brand-brown/25 px-6 py-14 text-center">
            <h2 className="m-0 font-display text-2xl font-extrabold text-brand-ink">No encontramos noticias</h2>
            <p className="m-0 mt-2 max-w-none text-base text-brand-ink/70">
              {searchQuery ? `No hay resultados para «${searchQuery}».` : filtrando ? 'No hay noticias con esos filtros.' : 'Todavía no hay noticias publicadas.'}
            </p>
            {filtrando && (
              <Link href="/noticias" className={`mt-5 inline-flex rounded-full bg-brand-deep px-5 py-2.5 text-sm font-extrabold text-white no-underline transition-colors hover:bg-brand-brown ${FOCO}`}>
                Ver todas las noticias
              </Link>
            )}
          </div>
        )}

        {resto.length > 0 && (
          <ul className="m-0 mt-7 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {resto.map((item, index) => {
              const imagen = getGoogleDriveImageUrl(item.image);
              return (
                <li key={item.slug} className="hero-rise group relative min-w-0" style={{ ["--d" as string]: `${Math.min(index, 8) * 60}ms` }}>
                  <article className="h-full overflow-hidden rounded-2xl bg-white shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none">
                    <Link href={`/noticias/${item.slug}`} className={`flex h-full flex-col no-underline ${FOCO}`}>
                      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-brand-cream">
                        {imagen && (
                          <Image src={imagen} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <Etiqueta categoria={item.cat} />
                        <h2 className="m-0 mt-3 line-clamp-3 text-left font-display text-xl font-extrabold leading-snug text-brand-ink">{item.title}</h2>
                        <p className="m-0 mt-2 line-clamp-3 max-w-none text-left text-sm leading-relaxed text-brand-ink/75">{item.description}</p>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                          <p className="m-0 max-w-none text-left text-sm font-medium text-brand-ink/65">{fechaLargaNoticia(item.date)}</p>
                          <BotonLeer />
                        </div>
                      </div>
                    </Link>
                  </article>
                  <NoticiasAdminButtons noticia={item} />
                </li>
              );
            })}
          </ul>
        )}

        <Paginacion pagina={paginaActual} paginas={paginas} hrefDe={(numero) => enlace({ pagina: numero > 1 ? String(numero) : '' })} de="noticias" className="mt-10" />

        {/* ── ¿Tenés una noticia? ── */}
        <div id="mandar-noticia" className="scroll-mt-24">
          <MandarNoticia />
        </div>
      </main>
    </div>
  );

  return <NoticiasClient noticias={noticias}>{content}</NoticiasClient>;
}

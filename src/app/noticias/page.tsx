import Link from "next/link";
import Image from "next/image";
import { NoticiasClient } from "@/app/noticias/components/noticias-client";
import { NoticiasAdminButtons } from "@/app/noticias/components/noticias-admin-buttons";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import { listNoticiasPreview } from "@/server/db/content-repository";
import { Search } from "lucide-react";
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

export default async function Noticias() {
  let noticias = await listNoticiasPreview() as Noticia[];
  
  // Sort by date descending
  noticias = noticias.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  // Contar noticias por categoría
  const categorias = [
    { label: "Todas", key: "todas", count: noticias.length },
    { label: "Iglesia", key: "iglesia", count: noticias.filter(n => n.cat === "Iglesia").length },
    { label: "Encuentros", key: "encuentros", count: noticias.filter(n => n.cat === "Encuentros").length },
    { label: "Campamento", key: "campamento", count: noticias.filter(n => n.cat === "Campamento").length },
    { label: "Formación", key: "formacion", count: noticias.filter(n => n.cat === "Formación").length },
    { label: "Espiritualidad", key: "espiritualidad", count: noticias.filter(n => n.cat === "Espiritualidad").length },
  ];

  const content = (
    <>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden px-6 sm:px-12 py-20 sm:py-28"
        style={{
          backgroundColor: "#5a3a24",
          backgroundImage: `
            linear-gradient(
              135deg,
              rgba(58, 34, 20, 0.98) 0%,
              rgba(90, 58, 36, 0.95) 100%
            ),
            url('/assets/textures/areasg.webp')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_70%)]" />

        <div className="relative max-w-7xl mx-auto text-left">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            
            {/* Contenido izquierdo */}
            <div className="lg:col-span-2 text-left">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold block mb-4">
                Sala de Prensa
              </span>

              <h1 className="m-0 text-6xl sm:text-7xl lg:text-8xl font-black leading-none mb-6 text-white drop-shadow-lg">
                Noticias
              </h1>

              <p className="m-0 max-w-lg text-lg sm:text-xl leading-relaxed text-amber-100">
                Entérate de las últimas novedades, encuentros y propuestas de la
                Infancia y Adolescencia Misionera de Paraná.
              </p>
            </div>

            {/* Buscador derecho */}
            <div className="mt-8 lg:mt-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  className="w-full px-6 py-3.5 pr-12 rounded-full bg-white text-brand-brown placeholder-brand-brown/40 border-0 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all shadow-2xl"
                />

                <Search
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-brown/50 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

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
                        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                          {noticias[0].description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold">
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
                            <p className="text-[11px] text-gray-500 font-semibold mt-2">
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
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold">
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
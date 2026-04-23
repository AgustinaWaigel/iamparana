import Link from "next/link";
import Image from "next/image";
import { NoticiasClient } from "@/app/noticias/components/noticias-client";
import { NoticiasAdminButtons } from "@/app/noticias/components/noticias-admin-buttons";
import { HeroSection } from "@/app/components/common/hero-section";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";
import { listNoticiasPreview } from "@/server/db/content-repository";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

export default async function Noticias() {
  // La página de noticias arma la grilla pública y superpone controles de administración
  // cuando el usuario tiene permisos.
  const noticias = await listNoticiasPreview();

  const content = (
    <>
      {/* Encabezado visual del área de noticias. */}
      <section>
        <HeroSection
          title="Noticias"
          textureUrl="/assets/textures/areasg.webp"
          overlayColor="rgba(120, 75, 40, 0.7), rgba(139, 87, 42, 0.75)"
          gradientClass="from-brand-brown to-brand-brown/80"
          description="Entérate de las últimas novedades de la IAM Paraná"
          textColor="text-white"
        />
      </section>

      <main className="max-w-6xl mx-auto px-4 pt-0 pb-12">
        {/* Listado de noticias en tarjetas, una por cada publicación disponible. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticias.map((item) => (
            <div key={item.slug} className="relative group">
              <article className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden hover:scale-105 transform duration-300">
                <Link href={`/noticias/${item.slug}`} className="block h-full no-underline">
                  {/* Imagen principal de la noticia, usando fill para cubrir el bloque completo. */}
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={getGoogleDriveImageUrl(item.image)}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover hover:scale-110 transition-transform duration-300"
                      priority={false}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-brand-brown mb-2 line-clamp-2 hover:text-brand-gold transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold">
                      {new Date(item.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </Link>
              </article>
              {/* Botones de editar/eliminar solo visibles para administradores. */}
              <NoticiasAdminButtons noticia={item} />
            </div>
          ))}
        </div>
      </main>
    </>
  );

  return <NoticiasClient noticias={noticias}>{content}</NoticiasClient>;
}
import { getAllNoticiasSlugs, getNoticiaBySlug } from '@/app/lib/noticias';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Novedades from '@/app/components/novedades';
import { NoticiaGaleriaView } from '@/app/components/noticia-galeria-view';
import { notFound } from 'next/navigation';
import { getGoogleDriveImageUrl } from '@/lib/drive-utils';

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

interface BloqueContenido {
  id: string;
  type: 'text' | 'image';
  value: string;
}

export async function generateStaticParams() {
  const slugs = await getAllNoticiasSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const noticia = await getNoticiaBySlug(params.slug);
  if (!noticia) {
    return {};
  }

  const { frontmatter } = noticia;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      images: [getGoogleDriveImageUrl(frontmatter.image)],
      type: 'article',
    },
  };
}

export default async function NoticiaPage(props: Props) {
  const params = await props.params;
  const noticia = await getNoticiaBySlug(params.slug);

  if (!noticia) {
    notFound();
  }

  const { frontmatter, content } = noticia;
  const { title, date, description, image, cat, bajada } = frontmatter;
  const categoryLabel = typeof cat === 'string' && cat.trim().length > 0 ? cat.trim().toUpperCase() : 'NACIONAL';

  let bloques: BloqueContenido[] = [];
  try {
    const contenidoParseado = JSON.parse(content);
    bloques = Array.isArray(contenidoParseado) ? contenidoParseado : [];
  } catch (error) {
    bloques = [{ id: 'old-content', type: 'text', value: content }];
  }

  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-16">
      <article className="w-full bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5 md:p-10">

        <span className="inline-flex rounded-full bg-brand-brown/10 px-3 py-1 text-brand-brown font-bold text-xs uppercase tracking-wider mb-3">
          {categoryLabel}
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-[#6b3f24] mb-4 break-words leading-tight">
          {title}
        </h1>

        <p className="text-lg text-gray-700 mb-4 break-words whitespace-pre-wrap leading-relaxed">
          {bajada || description}
        </p>

        <p className="text-sm text-gray-500 mb-6 font-medium">
          Publicado el {new Date(date).toLocaleDateString('es-AR')}
        </p>

        <hr className="w-full border-t border-gray-200 my-8" />

        {/* Portada Principal con img normal */}
        <div className="w-full mb-10">
          <img
            src={getGoogleDriveImageUrl(image)}
            alt={title}
            className="w-full h-auto object-cover rounded-xl shadow-sm border border-gray-100"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* CONTENIDO DINÁMICO (Bloques) */}
        <div className="space-y-6 text-gray-800 w-full break-words text-base leading-7">
          {bloques.map((bloque) => {
            if (bloque.type === 'text') {
              return (
                <div key={bloque.id} className="break-words">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold text-[#3a2a1c] mt-6 mb-3 leading-tight">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold text-[#3a2a1c] mt-6 mb-3 leading-tight">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold text-[#3a2a1c] mt-5 mb-2 leading-tight">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-lg font-bold text-[#3a2a1c] mt-4 mb-2 leading-tight">{children}</h4>,
                      p: ({ children }) => <p className="mb-4 leading-7 text-gray-800">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#d6b680] bg-[#faf7f1] px-4 py-2 my-4 text-gray-700">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a href={href} className="text-blue-700 underline hover:text-blue-900">
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => (
                        <img
                          src={getGoogleDriveImageUrl(typeof src === 'string' ? src : '')}
                          alt={alt || 'Imagen de la noticia'}
                          className="w-full h-auto object-cover rounded-xl shadow-sm border border-gray-100 my-6"
                          loading="lazy"
                          decoding="async"
                        />
                      ),
                    }}
                  >
                    {bloque.value}
                  </ReactMarkdown>
                </div>
              );
            }

            if (bloque.type === 'image') {
              return (
                <div key={bloque.id} className="w-full my-8">
                  <img
                    src={getGoogleDriveImageUrl(bloque.value)}
                    alt="Imagen de la noticia"
                    className="w-full h-auto object-cover rounded-xl shadow-sm border border-gray-100"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="mt-12">
          <NoticiaGaleriaView slug={params.slug} />
        </div>

        <hr className="w-full border-t border-gray-200 my-10" />

        <div className="bg-gradient-to-br from-[#fff8f2] to-white p-8 rounded-2xl text-center border border-[#eadfd5] shadow-sm">
          <h3 className="text-xs font-bold text-brand-brown/80 uppercase tracking-widest mb-6">
            Compartí esta noticia
          </h3>

          <ul className="flex justify-center gap-5 items-center">
            <li>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=https://iamparana.com.ar/noticias/${params.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                title="Compartir en Facebook"
              >
                <img
                  src="/assets/socialmedia/facebook.webp"
                  alt="Facebook"
                  className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 object-contain"
                />
              </a>
            </li>
            <li>
              <a
                href={`https://api.whatsapp.com/send?text=¡Mirá esta noticia! https://iamparana.com.ar/noticias/${params.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                title="Compartir en WhatsApp"
              >
                <img
                  src="/assets/socialmedia/whatsapp.webp"
                  alt="WhatsApp"
                  className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 object-contain"
                />
              </a>
            </li>
          </ul>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-brand-brown mb-6">Más noticias</h2>
          <Novedades currentSlug={params.slug} />
        </section>
      </article>
    </main>
  );
}
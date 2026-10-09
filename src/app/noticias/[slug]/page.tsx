import { getAllNoticiasSlugs, getNoticiaBySlug } from '@/server/content/noticias';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { listNoticiasPreview } from '@/server/db/content-repository';
import { colorDeCategoria, fechaLargaNoticia, nombreDeCategoria } from '@/app/noticias/formato';
import { NoticiaGaleriaView } from '@/app/noticias/components/noticia-galeria-view';
import { notFound } from 'next/navigation';
import { getGoogleDriveImageUrl } from '@/lib/drive-utils';
import { NoticiasClient } from '@/app/noticias/components/noticias-client';
import { NoticiasAdminButtons } from '@/app/noticias/components/noticias-admin-buttons';
import { NewsEngagement } from '@/app/noticias/components/news-engagement';
import Image from 'next/image';

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
  // Genera las rutas estáticas de todas las noticias publicadas.
  const slugs = await getAllNoticiasSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  // Cada noticia publica su metadata para SEO y compartir en redes.
  const params = await props.params;
  const noticia = await getNoticiaBySlug(params.slug);
  if (!noticia) {
    return {};
  }

  const { frontmatter } = noticia;

  const imageUrl = getGoogleDriveImageUrl(frontmatter.image);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      images: imageUrl ? [imageUrl] : [],
      type: 'article',
    },
  };
}

export default async function NoticiaPage(props: Props) {
  // La página de detalle reconstruye el contenido dinámico de cada noticia por slug.
  const params = await props.params;
  const noticia = await getNoticiaBySlug(params.slug);

  if (!noticia) {
    notFound();
  }

  const { frontmatter, content } = noticia;
  const { title, date, description, image, cat, bajada } = frontmatter;
  const categoria = typeof cat === 'string' && cat.trim().length > 0 ? cat.trim() : 'Nacional';

  let bloques: BloqueContenido[] = [];
  try {
    const contenidoParseado = JSON.parse(content);
    bloques = Array.isArray(contenidoParseado) ? contenidoParseado : [];
  } catch (error) {
    bloques = [{ id: 'old-content', type: 'text', value: content }];
  }

  // Cuánto lleva leerla, contando solo el texto.
  const palabras = bloques.filter((bloque) => bloque.type === 'text').map((bloque) => bloque.value).join(' ').split(/\s+/).filter(Boolean).length;
  const minutos = Math.max(1, Math.round(palabras / 200));
  const portada = getGoogleDriveImageUrl(image);
  const enlace = `https://iamparana.com.ar/noticias/${params.slug}`;
  const otras = ((await listNoticiasPreview().catch(() => [])) as Array<{ slug: string; title: string; image: string; date: string; cat?: string }>)
    .filter((item) => item.slug !== params.slug)
    .slice(0, 3);

  const FOCO = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown';
  const FOTO = 'h-auto w-full rounded-2xl object-cover shadow-[0_18px_36px_-24px_rgba(58,21,8,0.7)]';

  return (
    <NoticiasClient>
      <main className="min-h-screen w-full bg-brand-paper pb-20 pt-16 sm:pt-20">
        <article className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
          <NoticiasAdminButtons noticia={{ slug: params.slug, title, description, image, date }} alwaysVisible={true} />

          <Link href="/noticias" className={`inline-flex items-center gap-1.5 rounded-full py-1 text-sm font-bold text-brand-brown no-underline hover:underline ${FOCO}`}>
            <ArrowLeft size={16} aria-hidden /> Todas las noticias
          </Link>

          <header className="mt-5">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${colorDeCategoria(categoria)}`}>{nombreDeCategoria(categoria)}</span>
            <h1 className="m-0 mt-4 text-balance text-left font-display text-[clamp(2.1rem,6vw,3.5rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-brand-ink [overflow-wrap:anywhere]">
              {title}
            </h1>
            <p className="m-0 mt-5 max-w-none whitespace-pre-wrap text-left text-lg leading-relaxed text-brand-ink/80 sm:text-xl [overflow-wrap:anywhere]">
              {bajada || description}
            </p>
            <p className="m-0 mt-5 max-w-none text-left text-sm font-medium text-brand-ink/70">
              {fechaLargaNoticia(date)}{palabras > 0 && ` · ${minutos} min de lectura`}
            </p>
          </header>

          {/* Imagen principal de la noticia. */}
          {portada && (
            <Image src={portada} alt="" width={1600} height={900} priority sizes="(max-width: 768px) 100vw, 768px" className={`mt-8 ${FOTO}`} />
          )}

          {/* Contenido principal de la noticia: bloques de texto e imágenes. */}
          <div className="mt-9 w-full text-left text-lg leading-8 text-brand-ink [overflow-wrap:anywhere]">
            {bloques.map((bloque) => {
              if (bloque.type === 'text') {
                return (
                  <ReactMarkdown
                    key={bloque.id}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      // Dentro de la nota no puede haber otro h1: los títulos del texto bajan un nivel.
                      h1: ({ children }) => <h2 className="m-0 mb-3 mt-10 text-left font-display text-3xl font-extrabold leading-tight text-brand-ink">{children}</h2>,
                      h2: ({ children }) => <h2 className="m-0 mb-3 mt-10 text-left font-display text-2xl font-extrabold leading-tight text-brand-ink sm:text-3xl">{children}</h2>,
                      h3: ({ children }) => <h3 className="m-0 mb-2 mt-8 text-left font-display text-xl font-extrabold leading-tight text-brand-ink sm:text-2xl">{children}</h3>,
                      h4: ({ children }) => <h4 className="m-0 mb-2 mt-6 text-left font-display text-lg font-extrabold leading-tight text-brand-ink">{children}</h4>,
                      p: ({ children }) => <p className="m-0 mb-5 max-w-none text-left text-lg leading-8 text-brand-ink">{children}</p>,
                      ul: ({ children }) => <ul className="m-0 mb-5 list-disc space-y-1.5 pl-6">{children}</ul>,
                      ol: ({ children }) => <ol className="m-0 mb-5 list-decimal space-y-1.5 pl-6">{children}</ol>,
                      li: ({ children }) => <li className="pl-1">{children}</li>,
                      // Las citas van como frase destacada, sin la barra al costado.
                      blockquote: ({ children }) => (
                        <blockquote className="mx-0 my-8 max-w-none rounded-2xl border-0 bg-yellow-400 px-6 py-5 font-display text-xl font-extrabold not-italic leading-snug text-brand-deep [&_p]:m-0 [&_p]:text-xl [&_p]:font-extrabold [&_p]:leading-snug [&_p]:text-brand-deep">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a href={href} className={`font-bold text-blue-800 underline underline-offset-2 hover:text-blue-950 ${FOCO}`}>
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => {
                        const imageUrl = getGoogleDriveImageUrl(typeof src === 'string' ? src : '');
                        return imageUrl ? (
                          <Image src={imageUrl} alt={alt || ''} width={1400} height={788} sizes="(max-width: 768px) 100vw, 768px" className={`my-8 ${FOTO}`} loading="lazy" />
                        ) : null;
                      },
                    }}
                  >
                    {bloque.value}
                  </ReactMarkdown>
                );
              }

              if (bloque.type === 'image') {
                const imageUrl = getGoogleDriveImageUrl(bloque.value);
                if (!imageUrl) return null;
                return <Image key={bloque.id} src={imageUrl} alt="" width={1400} height={788} sizes="(max-width: 768px) 100vw, 768px" className={`my-8 ${FOTO}`} loading="lazy" />;
              }

              return null;
            })}
          </div>

          {/* Galería asociada a la noticia. */}
          <div className="mt-12">
            <NoticiaGaleriaView slug={params.slug} />
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-deep px-6 py-5 text-white">
            <h2 className="m-0 text-left font-display text-xl font-extrabold text-white">Compartí esta noticia</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              <li>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${enlace}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-brand-deep no-underline transition-colors hover:bg-brand-goldsoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/socialmedia/whatsapp.webp" alt="" className="h-5 w-5 object-contain" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(enlace)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-brand-deep no-underline transition-colors hover:bg-brand-goldsoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/socialmedia/facebook.webp" alt="" className="h-5 w-5 object-contain" />
                  Facebook
                </a>
              </li>
            </ul>
          </div>

          <NewsEngagement slug={params.slug} />
        </article>

        {/* Otras noticias para seguir leyendo. */}
        {otras.length > 0 && (
          <section aria-labelledby="mas-noticias" className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <h2 id="mas-noticias" className="m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-none tracking-[-0.03em] text-brand-ink">Más noticias</h2>
              <Link href="/noticias" className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown no-underline transition-colors hover:bg-brand-brown hover:text-white ${FOCO}`}>
                Ver todas <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
            <ul className="m-0 mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {otras.map((item) => {
                const imagen = getGoogleDriveImageUrl(item.image);
                return (
                  <li key={item.slug} className="sm:last:hidden lg:last:block">
                    <Link href={`/noticias/${item.slug}`} className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white no-underline shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none ${FOCO}`}>
                      <div className="relative aspect-[16/10] overflow-hidden bg-brand-cream">
                        {imagen && <Image src={imagen} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none" />}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        {item.cat?.trim() && <span className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-extrabold ${colorDeCategoria(item.cat)}`}>{nombreDeCategoria(item.cat)}</span>}
                        <h3 className="m-0 mt-3 line-clamp-3 text-left font-display text-xl font-extrabold leading-snug text-brand-ink">{item.title}</h3>
                        <p className="m-0 mt-auto max-w-none pt-4 text-left text-sm font-medium text-brand-ink/65">{fechaLargaNoticia(item.date)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </NoticiasClient>
  );
}

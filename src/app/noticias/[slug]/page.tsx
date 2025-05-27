import { getAllNoticiasSlugs, getNoticiaBySlug } from '@/lib/noticias';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import Novedades from '@/components/novedades';
import Image from "next/image";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = getAllNoticiasSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { frontmatter } = getNoticiaBySlug(params.slug);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      images: [frontmatter.image],
      type: 'article',
    },
  };
}

export default async function NoticiaPage(props: Props) {
  const params = await props.params;
  const { frontmatter, content } = getNoticiaBySlug(params.slug);
  const { title, date, description, image, cat, bajada } = frontmatter;

  return (
    <main>
        <p className="separador"></p>
      <section className="nota">
        <p className='titulo-categoria'>{cat}</p>
        <p className="nota-titulo">{title}</p>
        <p className="nota-descripcion">{bajada}</p>
        <p className="nota-fecha">
          Publicado el {new Date(date).toLocaleDateString('es-AR')}
        </p>

        <hr className="divisor" />
        <Image src={image} alt={description} className="nota-imagen" height={400}width={640}/>

        <ReactMarkdown>{content}</ReactMarkdown>

        <hr className="divisor" />
        <div className="social-share">
          <h3>Compartí esta página</h3>
          <ul>
            <li>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=https://iamparana.com.ar/noticias/${params.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/assets/socialmedia/facebook.webp" alt="Facebook" />
              </a>
            </li>
            <li>
              <a
                href={`https://api.whatsapp.com/send?text=¡Mirá esta noticia! https://iamparana.com.ar/noticias/${params.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/assets/socialmedia/whatsapp.webp" alt="WhatsApp" />
              </a>
            </li>
          </ul>
        </div>
        <section className="nota-novedades">
          <h2 className="titulo-novedades">Más noticias</h2>
          <Novedades />
        </section>
      </section>
    </main>
  );
}


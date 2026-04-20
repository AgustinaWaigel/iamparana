import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { marked, Renderer } from 'marked';
import ChordTransposer from '@/app/components/common/chordtransposer';
import { getAllCanciones, getCancionBySlug } from '@/app/lib/canciones';

const renderer = new Renderer();
renderer.code = function ({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }): string {
  if (lang === 'song') {
    return `<pre class="song">${text}</pre>`;
  }
  const safeCode = escaped ? text : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre><code class="language-${lang}">${safeCode}</code></pre>`;
};
marked.setOptions({ renderer });

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const cancion = await getCancionBySlug(params.slug);
  if (!cancion) return {};

  const title = `${cancion.title} – IAM Paraná`;
  const description = `Letra y acordes de "${cancion.title}"`;
  const url = `https://iamparana.ar/canciones/${params.slug}`;
  const image = 'https://iamparana.com.ar/logoiam.jpg';

  return {
    title,
    description,
    alternates: {
      canonical: `/canciones/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'IAM Paraná',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: 'IAM Paraná',
        },
      ],
      locale: 'es_AR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

function parseAcordes(content: string): string {
  const lines = content.split('\n');
  const parsedLines = lines.map((line) => {
    return line.replace(/\[([^\]]+)\]([^\s]+)/g, (_match, acorde, silaba) => {
      return `<span class="notamusical"><span class="Chord" data-original="${acorde}">${acorde}</span>${silaba}</span>`;
    });
  });
  return parsedLines.join('\n');
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const canciones = await getAllCanciones();
  return canciones.map((cancion) => ({ slug: cancion.slug }));
}

// Acá está el cambio clave en el tipado de props, nada de any ni PageProps raros
export default async function CancionPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const cancion = await getCancionBySlug(params.slug);

  if (!cancion) return notFound();

  const contentConAcordes = parseAcordes(cancion.content);
  const html = marked(contentConAcordes, { renderer });

  return (
    <main>
      <h2 className="barra-contextual color-animacion-boton"></h2>
      <p className="subtitulo-seccion color-animacion-boton">{cancion.title}</p>
      <h3 className="subtitulo-artista">{cancion.artist}</h3>

      <ChordTransposer />

      <div
        className="contenido-cancion"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}

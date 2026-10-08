import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { marked, Renderer } from 'marked';
import ChordTransposer from '@/app/components/common/chordtransposer';
import Link from 'next/link';
import { AreaHero, AreaPage } from '@/app/components/common/area-hero';
import { getAllCanciones, getCancionBySlug } from '@/server/content/canciones';
import { ArrowLeft, Music } from 'lucide-react';

const renderer = new Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }): string {
  if (lang === 'song') {
    return `<pre class="song-block">${text}</pre>`;
  }
  return `<pre><code class="language-${lang}">${text}</code></pre>`;
};
marked.setOptions({ renderer });

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const cancion = await getCancionBySlug(params.slug);
  if (!cancion) return {};
  const title = `${cancion.title} – IAM Paraná`;
  return {
    title,
    description: `Letra y acordes de "${cancion.title}"`,
  };
}

function parseAcordes(content: string): string {
  const lines = content.split('\n');
  const parsedLines = lines.map((line) => {
    // Regex mejorada para capturar acordes incluso al final de palabras o solos
    return line.replace(/\[([^\]]+)\]([^\s\n]*)/g, (_match, acorde, silaba) => {
      return `<span class="notamusical"><span class="Chord font-black bg-brand-brown/5 px-1 rounded" data-original="${acorde}">${acorde}</span>${silaba}</span>`;
    });
  });
  return parsedLines.join('\n');
}

export async function generateStaticParams() {
  const canciones = await getAllCanciones();
  return canciones.map((cancion) => ({ slug: cancion.slug }));
}

export default async function CancionPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const cancion = await getCancionBySlug(params.slug);

  if (!cancion) return notFound();

  const contentConAcordes = parseAcordes(cancion.content);
  const html = await marked(contentConAcordes, { renderer });

  return (
    <>
      <AreaPage
        narrow
        hero={
          <AreaHero
            area="animacion"
            title={cancion.title}
            description={cancion.artist || ''}
            crumbs={[{ label: 'Canciones', href: '/animacion/canciones' }]}
          />
        }
      >
        {/* TRANSPOSER FLOTANTE O FIJO */}
        <div className="sticky top-[5.5rem] z-30 mb-10">
          <div className="rounded-2xl bg-white p-4 shadow-[0_14px_30px_-18px_rgba(58,21,8,0.45)] ring-1 ring-brand-brown/10">
            <ChordTransposer />
          </div>
        </div>

        <div
          className="prose prose-stone max-w-none
                     prose-pre:bg-transparent prose-pre:p-0
                     text-brand-ink leading-relaxed
                     font-medium text-lg md:text-xl"
        >
          <div
            className="contenido-cancion whitespace-pre-wrap font-sans"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        <div className="mt-16 flex flex-col items-center gap-5 border-t border-brand-brown/15 pt-10">
          <div className="flex items-center gap-3 text-emerald-800">
            <Music size={20} aria-hidden />
            <p className="m-0 max-w-none text-sm font-bold uppercase tracking-[0.16em]">Fin de la canción</p>
          </div>
          <Link
            href="/animacion/canciones"
            className="inline-flex items-center gap-2 rounded-full border border-brand-brown/20 px-4 py-2 text-sm font-bold text-brand-brown no-underline transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
          >
            <ArrowLeft size={15} aria-hidden />
            Volver al cancionero
          </Link>
        </div>
      </AreaPage>

      {/* CSS ADICIONAL PARA LOS ACORDES */}
      <style dangerouslySetInnerHTML={{ __html: `
        .notamusical {
          position: relative;
          display: inline-block;
          vertical-align: baseline;
          padding-top: 0.95em;
          margin-top: 0.65em;
          margin-right: 0.08em;
          white-space: nowrap;
        }
        .Chord {
          position: absolute;
          left: 0;
          top: 0;
          font-size: 0.78em;
          line-height: 1;
          font-weight: 700;
          transform: none;
        }
        .silaba-acorde {
          display: inline-block;
          line-height: 1.2;
        }
        .song-block {
          font-family: inherit;
          white-space: pre-wrap;
        }
      `}} />
    </>
  );
}
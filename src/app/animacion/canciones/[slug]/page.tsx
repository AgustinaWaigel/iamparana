import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { marked, Renderer } from 'marked';
import ChordTransposer from '@/app/components/common/chordtransposer';
import { HeroSection } from '@/app/components/common/hero-section';
import { getAllCanciones, getCancionBySlug } from '@/server/content/canciones';
import { Music } from 'lucide-react';

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
      return `<span class="notamusical"><span class="Chord font-black text-emerald-900 bg-emerald-300/25 px-1 rounded" data-original="${acorde}">${acorde}</span>${silaba}</span>`;
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
      <section>
        <HeroSection
          title={cancion.title}
          textureUrl="/assets/textures/areasg.webp"
          overlayColor="rgba(20, 83, 45, 0.65), rgba(22, 163, 74, 0.8)"
          gradientClass="from-green-900 via-green-800 to-emerald-700"
          description={cancion.artist || ''}
          textColor="text-white"
        />
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8 md:pb-10">
        <section className="mx-auto max-w-3xl">
          
          {/* TRANSPOSER FLOTANTE O FIJO */}
          <div className="sticky top-20 z-30 mb-10 mt-10">
            <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-sm">
              <ChordTransposer />
            </div>
          </div>

          <div 
            className="prose prose-stone max-w-none 
                       prose-pre:bg-transparent prose-pre:p-0
                       text-emerald-950 leading-relaxed
                       font-medium text-lg md:text-xl"
          >
            <div
              className="contenido-cancion whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          <div className="mt-20 pt-10 border-t border-emerald-200 flex flex-col items-center gap-4 opacity-70">
            <Music className="text-emerald-700" size={32} />
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700/70">Fin de la canción</p>
          </div>
        </section>
      </main>

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
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { marked, Renderer } from 'marked';
import ChordTransposer from '@/app/components/common/chordtransposer';
import { getAllCanciones, getCancionBySlug } from '@/server/content/canciones';
import { Music, Mic2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/60">
      
      {/* PORTADA DE CANCIÓN (ESTILO RECURSOS) */}
      <div className="relative h-[30vh] md:h-[40vh] bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url(/assets/textures/music-pattern.webp)', backgroundSize: '200px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />
        <div className="absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />
        
        <div className="relative z-10 text-center px-6">
           <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter italic drop-shadow-xl">
            {cancion.title}
          </h1>
          <p className="mt-2 text-emerald-200 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <Mic2 size={16} /> {cancion.artist}
          </p>
        </div>
      </div>

      {/* CUERPO DE LA CANCIÓN */}
      <section className="relative z-10 -mt-12 bg-white rounded-t-[3rem] shadow-[0_-20px_50px_rgba(16,185,129,0.12)] min-h-screen border-t border-emerald-100">
        <div className="mx-auto max-w-3xl px-6 py-12">
          
          {/* TRANSPOSER FLOTANTE O FIJO */}
          <div className="sticky top-20 z-30 mb-10">
            <div className="bg-white/90 backdrop-blur-md border border-emerald-200 p-4 rounded-2xl shadow-sm">
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
        </div>
      </section>

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
    </main>
  );
}
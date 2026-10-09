import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ClipboardPen, Images, ShoppingBag } from 'lucide-react';
import { FadeInSection } from '@/app/components/common/fade-in-section';

// Lo que lleva adelante Comunicación además de los recursos gráficos: las inscripciones
// a los eventos, el merch, las fotos de los encuentros y las redes de IAM Paraná.

const H2 = 'm-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink';

function fechaLarga(ymd: string) {
  const [year, month, day] = ymd.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

export interface InscripcionAbierta {
  id: string;
  nombre: string;
  fecha: string;
  fechaFin: string | null;
  cierraAt: string | null;
}

export function InscripcionesAbiertas({ eventos }: { eventos: InscripcionAbierta[] }) {
  if (eventos.length === 0) return null;
  return (
    <section aria-labelledby="inscripciones-titulo" className="mb-14 sm:mb-20">
      <FadeInSection>
        <div className="relative overflow-hidden rounded-[28px] bg-blue-700 px-6 py-8 text-white shadow-[0_26px_50px_-28px_rgba(30,64,175,0.9)] sm:px-10 sm:py-10">
          <div aria-hidden className="absolute -right-14 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-20 right-32 h-44 w-44 rounded-full bg-yellow-300/20" />
          <h2 id="inscripciones-titulo" className="pop-in relative m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
            {eventos.length === 1 ? 'Inscripción abierta' : 'Inscripciones abiertas'}
          </h2>
          <ul className="relative m-0 mt-6 grid list-none gap-3 p-0 lg:grid-cols-2">
            {eventos.map((evento, index) => (
              <li key={evento.id} className="pop-in" style={{ ['--d' as string]: `${120 + index * 90}ms` }}>
                <Link
                  href={`/inscripciones/${encodeURIComponent(evento.id)}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl bg-white p-5 text-brand-ink no-underline transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-xl font-extrabold leading-snug text-brand-ink">{evento.nombre}</span>
                    <span className="mt-1 block text-sm text-brand-ink/70">
                      {evento.fechaFin && evento.fechaFin !== evento.fecha ? `Del ${fechaLarga(evento.fecha)} al ${fechaLarga(evento.fechaFin)}` : `El ${fechaLarga(evento.fecha)}`}
                      {evento.cierraAt && ` · Te podés anotar hasta el ${fechaLarga(evento.cierraAt)}`}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-yellow-400 px-4 py-2.5 text-sm font-extrabold text-brand-deep">
                    <ClipboardPen size={16} aria-hidden />
                    Inscribirme
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </FadeInSection>
    </section>
  );
}

export function MerchBanner({ cantidad, categorias }: { cantidad: number; categorias: string[] }) {
  return (
    <section aria-labelledby="merch-titulo" className="mb-14 sm:mb-20">
      <FadeInSection>
        <Link
          href="/comunicacion/merch"
          className="group relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-yellow-400 px-6 py-8 text-brand-deep no-underline shadow-[0_26px_50px_-30px_rgba(58,21,8,0.8)] transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown motion-reduce:transform-none sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10"
        >
          <span aria-hidden className="absolute -right-10 -top-14 h-52 w-52 rounded-full bg-white/30" />
          <span className="relative min-w-0">
            <span id="merch-titulo" role="heading" aria-level={2} className="pop-in block font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              Merch de la IAM
            </span>
            <span className="pop-in mt-3 block max-w-xl text-base leading-relaxed text-brand-deep/85 sm:text-lg" style={{ ['--d' as string]: '100ms' }}>
              {cantidad} productos para llevarte de cada evento: {categorias.slice(0, 4).join(', ').toLowerCase()} y más.
            </span>
          </span>
          <span className="pop-in relative inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-brand-deep px-6 py-3 text-base font-extrabold text-white sm:self-center" style={{ ['--d' as string]: '200ms' }}>
            <ShoppingBag size={18} aria-hidden />
            Ver el merch
            <ArrowRight size={18} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
          </span>
        </Link>
      </FadeInSection>
    </section>
  );
}

export interface AlbumDeFotos {
  id: number;
  titulo: string;
  descripcion: string | null;
  url: string;
}

const FONDOS_ALBUM = ['bg-emerald-600', 'bg-red-600', 'bg-blue-700', 'bg-amber-500', 'bg-violet-600'];

export function FotosDeEventos({ albumes }: { albumes: AlbumDeFotos[] }) {
  return (
    <section aria-labelledby="fotos-titulo" className="mb-14 sm:mb-20">
      <FadeInSection>
        <h2 id="fotos-titulo" className={`pop-in ${H2}`}>Fotos de los eventos</h2>
        <p className="pop-in m-0 mt-3 max-w-xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg" style={{ ['--d' as string]: '80ms' }}>
          Los álbumes de cada encuentro, para ver, descargar y compartir.
        </p>
        {albumes.length === 0 ? (
          <p className="pop-in m-0 mt-6 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-9 text-center text-base text-brand-ink/65" style={{ ['--d' as string]: '160ms' }}>
            Pronto vamos a subir acá los álbumes de cada evento.
          </p>
        ) : (
          <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {albumes.map((album, index) => (
              <li key={album.id} className="pop-in" style={{ ['--d' as string]: `${160 + Math.min(index, 6) * 80}ms` }}>
                <a
                  href={album.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-center gap-4 rounded-2xl bg-white p-4 no-underline shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] ring-1 ring-brand-brown/10 transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown motion-reduce:transform-none"
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-300 ease-out group-hover:-rotate-6 motion-reduce:transform-none ${FONDOS_ALBUM[index % FONDOS_ALBUM.length]}`}>
                    <Images size={26} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-extrabold leading-snug text-brand-ink">{album.titulo}</span>
                    {album.descripcion && <span className="mt-0.5 line-clamp-2 block text-sm text-brand-ink/70">{album.descripcion}</span>}
                    <span className="mt-1 block text-sm font-bold text-blue-700">Ver el álbum</span>
                  </span>
                  <ArrowUpRight size={20} aria-hidden className="shrink-0 text-brand-ink/50 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </FadeInSection>
    </section>
  );
}

const REDES = [
  { nombre: 'Instagram', usuario: '@iamarqparana', href: 'https://www.instagram.com/iamarqparana/', icono: '/assets/socialmedia/instagram.webp', fondo: 'bg-gradient-to-br from-fuchsia-600 to-orange-500' },
  { nombre: 'Facebook', usuario: 'IAM Paraná', href: 'https://www.facebook.com/IamParana/', icono: '/assets/socialmedia/facebook.webp', fondo: 'bg-blue-700' },
  { nombre: 'YouTube', usuario: 'IAM Arq. Paraná', href: 'https://www.youtube.com/channel/UCShR66tuvm-N-I5ZUZ6Oo6Q', icono: '/assets/socialmedia/youtube.webp', fondo: 'bg-red-600' },
] as const;

export function RedesIam() {
  return (
    <section aria-labelledby="redes-titulo" className="mt-14 sm:mt-20">
      <FadeInSection>
        <h2 id="redes-titulo" className={`pop-in ${H2}`}>Seguinos en las redes</h2>
        <p className="pop-in m-0 mt-3 max-w-xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg" style={{ ['--d' as string]: '80ms' }}>
          Fotos de los encuentros, avisos y todo lo que va pasando en la IAM de Paraná.
        </p>
        <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-3">
          {REDES.map((red, index) => (
            <li key={red.nombre} className="pop-in" style={{ ['--d' as string]: `${160 + index * 90}ms` }}>
              <a
                href={red.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-4 rounded-2xl p-5 text-white no-underline transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown motion-reduce:transform-none ${red.fondo}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Image src={red.icono} alt="" width={26} height={26} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-extrabold leading-tight">{red.nombre}</span>
                  <span className="block truncate text-sm text-white/85">{red.usuario}</span>
                </span>
                <ArrowUpRight size={20} aria-hidden className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
              </a>
            </li>
          ))}
        </ul>
      </FadeInSection>
    </section>
  );
}

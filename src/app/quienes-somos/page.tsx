import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, HandHeart, HeartHandshake, Sparkles } from 'lucide-react';
import { AREA_ICONS } from '@/app/components/common/area-icons';
import { AREA_ORDER, AREA_THEME } from '@/app/components/common/area-theme';
import { FadeInSection } from '@/app/components/common/fade-in-section';
import { Ondas } from '@/app/components/common/ondas';
import { InstitutionalDocuments } from '@/app/institucional/components/institucional-documents';
import { InstitutionalPageManager } from '@/app/institucional/components/institutional-page-manager';
import { InstitutionalResourceSections } from '@/app/institucional/components/institutional-resource-sections';
import { getAreaLandingContent } from '@/server/db/admin-repository';
import { telHref, whatsappHref } from '@/lib/iam-contacto';
import { listIam } from '@/server/db/iam-repository';
import { getResourcePageWithContent } from '@/server/db/resource-pages-repository';
import { Contador } from './contador';
import { EmpezarIam } from './empezar-iam';
import { MapaIam, type PuntoIam } from './mapa-iam';
import { ubicacionDe } from './ubicaciones';

// Quiénes somos: qué es la IAM, de dónde viene, cómo trabajamos en Paraná y dónde estamos.
// Los grupos salen de la base (los mismos de las inscripciones); el resto es la historia de la Obra.

// Siempre al día: los documentos institucionales se editan desde esta misma página.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: 'La Infancia y Adolescencia Misionera de Paraná: quiénes somos, nuestra historia, cómo trabajamos y dónde estamos.',
  alternates: { canonical: '/quienes-somos' },
};

const CONTINENTES = [
  { nombre: 'África', color: '#2e9e4f' },
  { nombre: 'América', color: '#d62828' },
  { nombre: 'Europa', color: '#ffffff' },
  { nombre: 'Oceanía', color: '#2563eb' },
  { nombre: 'Asia', color: '#f6c445' },
];

const AYUDAS = [
  { icono: Sparkles, titulo: 'Con la oración', texto: 'Rezamos por los chicos de todo el mundo. La tradición de la Obra lo dice así: un Ave María al día.', fondo: 'bg-blue-700' },
  { icono: HandHeart, titulo: 'Con el servicio', texto: 'Salimos al encuentro de los demás: de ser amigos de Jesús a hacer amigos para Jesús.', fondo: 'bg-emerald-600' },
  { icono: HeartHandshake, titulo: 'Con lo que tenemos', texto: 'Compartimos lo nuestro para ayudar a otros chicos. La tradición lo dice así: una monedita al mes.', fondo: 'bg-red-600' },
];

const HISTORIA = [
  { anio: '1843', titulo: 'Nace la Santa Infancia', texto: 'Mons. Charles de Forbin-Janson, a quien con cariño llamamos Forbincito, la funda en Francia, conmovido por la situación de los niños en tierras de misión. Su idea: «que los niños y adolescentes ayuden a los niños y adolescentes».' },
  { anio: '1849', titulo: 'Llega a la Argentina', texto: 'A pocos años de su fundación, la Obra ya está en nuestro país.' },
  { anio: '1922', titulo: 'Obra Pontificia', texto: 'El papa Pío XI la declara Obra Pontificia: pasa a ser de toda la Iglesia.' },
  { anio: '2002', titulo: 'También los adolescentes', texto: 'Suma formalmente la animación de adolescentes y toma el nombre de Infancia y Adolescencia Misionera.' },
];

const MODELOS = [
  { nombre: 'María', detalle: 'La primera misionera: nos enseña a decirle que sí a Jesús.', color: '#2563eb' },
  { nombre: 'San Francisco Javier', detalle: 'Patrono de las misiones. Su fiesta es el 3 de diciembre.', color: '#d62828' },
  { nombre: 'Santa Teresita del Niño Jesús', detalle: 'Patrona de las misiones. Su fiesta es el 1 de octubre.', color: '#2e9e4f' },
];

const INSIGNIAS = [
  { nombre: 'Carnet', imagen: '/assets/quienes/carnet.webp', ancho: 586, alto: 419, alt: 'Dibujo de un carnet amarillo de la Infancia Misionera con la foto y el nombre de un chico' },
  { nombre: 'Escudo', imagen: '/assets/quienes/escudo.webp', ancho: 759, alto: 766, alt: 'Escudo de IAM Argentina: cuatro chicos alrededor del mundo, rodeado por un rosario misionero' },
  { nombre: 'Pañoleta', imagen: '/assets/quienes/panoleta.webp', ancho: 419, alto: 399, alt: 'Dibujo de una pañoleta misionera amarilla y blanca' },
];

const H2 = 'm-0 text-balance text-left font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em]';
const BAJADA = 'm-0 mt-4 max-w-2xl text-left text-base leading-relaxed sm:text-lg';

export default async function QuienesSomosPage() {
  const [grupos, institucional] = await Promise.all([
    listIam(true).catch(() => []),
    getAreaLandingContent('institucional', ['institucional']).catch(() => null),
  ]);
  // Documentos institucionales (lo que antes era la página "Info Institucional").
  const paginas: Array<{ id: number; slug: string; title: string; description: string | null }> = institucional
    ? JSON.parse(JSON.stringify(institucional.pages)).map((item: Record<string, unknown>) => ({ id: Number(item.id), slug: String(item.slug || ''), title: String(item.title || ''), description: item.description ? String(item.description) : null })).reverse()
    : [];
  const detalles = (await Promise.all(paginas.map((pagina) => getResourcePageWithContent(pagina.slug).catch(() => null)))).filter(Boolean);
  const documentos = detalles.flatMap((detalle) => detalle ? [{ id: detalle.page.id, title: detalle.page.title, description: detalle.page.description, sections: detalle.sections.map((section) => ({ id: section.id, title: section.title, resources: [...section.documents.map((item) => ({ id: item.id, kind: 'document' as const, title: item.title, description: item.description, href: item.google_drive_url })), ...section.links.map((item) => ({ id: item.id, kind: 'link' as const, title: item.title, description: item.description, href: item.url }))] })) }] : []);
  const ciudades = new Map<string, typeof grupos>();
  for (const grupo of grupos) {
    const ciudad = grupo.ciudad?.trim() || 'Otras';
    ciudades.set(ciudad, [...(ciudades.get(ciudad) ?? []), grupo]);
  }
  const porCiudad = [...ciudades.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es'));
  // Un punto en el mapa por cada IAM que se pudo ubicar.
  const puntos: PuntoIam[] = porCiudad.flatMap(([ciudad, lista]) => {
    let sinPuntoPropio = 0;
    return lista.flatMap((grupo) => {
      // Primero el lugar que marcó el admin; si no tiene, el aproximado.
      const ubicacion = grupo.lat !== null && grupo.lng !== null
        ? { punto: [grupo.lat, grupo.lng] as [number, number], exacta: true }
        : ubicacionDe(grupo.nombre, grupo.ciudad, sinPuntoPropio);
      if (!ubicacion) return [];
      if (!ubicacion.exacta) sinPuntoPropio += 1;
      return [{ id: grupo.id, nombre: grupo.nombre, ciudad, lat: ubicacion.punto[0], lng: ubicacion.punto[1], color: grupo.color ?? '#f6c445', direccion: grupo.direccion, telefono: grupo.telefono, instagram: grupo.instagram, facebook: grupo.facebook }];
    });
  });

  return (
    <div className="min-h-screen bg-brand-paper">
      {/* ── Portada ── */}
      <section
        className="relative isolate overflow-hidden text-white"
        style={{ backgroundColor: '#3a1508', backgroundImage: "url('/assets/header/headerbg.webp')", backgroundSize: '520px', backgroundBlendMode: 'soft-light' }}
      >
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_10%,rgba(246,196,69,0.25),transparent_55%),linear-gradient(to_bottom,rgba(98,45,13,0.55),rgba(58,21,8,0.92))]" />
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-40 pt-16 sm:px-6 sm:pb-60 sm:pt-24 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div>
            <div aria-hidden className="mb-6 flex items-center gap-3">
              {CONTINENTES.map((item, index) => (
                <span key={item.nombre} className="bead block h-4 w-4 rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.35)] sm:h-5 sm:w-5" style={{ backgroundColor: item.color, ['--d' as string]: `${200 + index * 90}ms` }} />
              ))}
            </div>
            <h1 className="m-0 text-balance text-left font-display text-[clamp(2.7rem,8vw,5.75rem)] font-extrabold leading-[0.94] tracking-[-0.04em] text-white">
              <span className="hero-rise block" style={{ ['--d' as string]: '80ms' }}>Amigos de Jesús,</span>
              <span className="hero-rise block text-brand-gold" style={{ ['--d' as string]: '200ms' }}>misioneros del mundo</span>
            </h1>
            <p className="hero-rise m-0 mt-7 max-w-xl text-left text-lg leading-relaxed text-white/85 sm:text-xl" style={{ ['--d' as string]: '340ms' }}>
              Somos la Infancia y Adolescencia Misionera de la Arquidiócesis de Paraná. Jesús es el centro: lo conocemos, lo seguimos y salimos a anunciarlo.
            </p>
          </div>
          <div className="hero-rise mx-auto w-full max-w-md" style={{ ['--d' as string]: '300ms' }}>
            <div className="rotate-2 rounded-[44px] bg-white p-4 shadow-[0_30px_60px_-28px_rgba(0,0,0,0.8)] sm:p-6">
              <Image src="/assets/quienes/jesus-festejo.webp" alt="Dibujo de Jesús sonriendo con los brazos en alto, rodeado de chicos con pañoleta misionera que festejan con él" width={900} height={798} priority sizes="(max-width: 1024px) 90vw, 28rem" className="h-auto w-full -rotate-2" />
            </div>
          </div>
        </div>
        <Ondas hacia="#fbf8f3" />
      </section>

      {/* ── Qué es la IAM ── */}
      <section aria-labelledby="que-es" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeInSection>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
            <div>
              <h2 id="que-es" className={`pop-in ${H2} text-brand-ink`}>¿Qué es la IAM?</h2>
              <p className={`pop-in ${BAJADA} text-brand-ink/80`} style={{ ['--d' as string]: '100ms' }}>
                IAM quiere decir Infancia y Adolescencia Misionera. Es una Obra Pontificia por, para, con y de niños y adolescentes: los forma como protagonistas de la misión, para que conozcan a Jesús y lo lleven a los demás con la oración, el servicio y lo que cada uno puede compartir.
              </p>
              <p className="pop-in m-0 mt-6 max-w-xl rounded-3xl bg-yellow-400 p-6 text-left font-display text-2xl font-extrabold leading-snug text-brand-deep sm:text-3xl" style={{ ['--d' as string]: '220ms' }}>
                De ser amigos de Jesús a hacer amigos para Jesús.
              </p>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-3">
              {[
                { valor: grupos.length, sufijo: '', etiqueta: grupos.length === 1 ? 'IAM en la arquidiócesis' : 'IAM en la arquidiócesis', fondo: 'bg-red-600 text-white' },
                { valor: porCiudad.length, sufijo: '', etiqueta: porCiudad.length === 1 ? 'ciudad' : 'ciudades', fondo: 'bg-blue-700 text-white' },
                { valor: 5, sufijo: '', etiqueta: 'áreas de trabajo', fondo: 'bg-emerald-600 text-white' },
                { valor: new Date().getFullYear() - 1843, sufijo: ' años', etiqueta: 'de historia en el mundo', fondo: 'bg-brand-deep text-white' },
              ].filter((item) => item.valor > 0).map((item, index) => (
                <div key={item.etiqueta} className={`pop-in rounded-3xl p-5 sm:p-6 ${item.fondo}`} style={{ ['--d' as string]: `${160 + index * 90}ms` }}>
                  <dd className="m-0 font-display text-5xl font-extrabold leading-none tabular-nums sm:text-6xl"><Contador hasta={item.valor} />{item.sufijo && <span className="text-2xl sm:text-3xl">{item.sufijo}</span>}</dd>
                  <dt className="mt-2 text-sm font-bold opacity-90 sm:text-base">{item.etiqueta}</dt>
                </div>
              ))}
            </dl>
          </div>
        </FadeInSection>
      </section>

      {/* ── Jesús en el centro ── */}
      <section aria-labelledby="jesus-centro" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <FadeInSection>
          <div className="grid items-center gap-6 overflow-hidden rounded-[32px] bg-white p-6 ring-1 ring-brand-brown/10 sm:p-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
            <Image src="/assets/quienes/jesus-con-chicos.webp" alt="Dibujo de Jesús abrazando a un nene y a una nena con pañoleta misionera" width={689} height={900} sizes="(max-width: 1024px) 60vw, 20rem" className="pop-in mx-auto h-auto w-full max-w-[15rem] lg:max-w-none" />
            <div>
              <h2 id="jesus-centro" className={`pop-in ${H2} text-brand-ink`} style={{ ['--d' as string]: '100ms' }}>Jesús, el centro de todo</h2>
              <p className={`pop-in ${BAJADA} text-brand-ink/80`} style={{ ['--d' as string]: '200ms' }}>
                Jesús es el primer misionero y nuestro modelo de amor, oración y servicio. Todo lo que hacemos en la IAM empieza en la amistad con Él y termina en salir a compartirla.
              </p>
              <ul className="m-0 mt-6 grid list-none gap-3 p-0 sm:grid-cols-3">
                {MODELOS.map((modelo, index) => (
                  <li key={modelo.nombre} className="pop-in overflow-hidden rounded-2xl bg-brand-cream" style={{ ['--d' as string]: `${300 + index * 90}ms` }}>
                    <div aria-hidden className="h-2" style={{ backgroundColor: modelo.color }} />
                    <div className="p-4">
                      <h3 className="m-0 text-left font-display text-lg font-extrabold leading-tight text-brand-ink">{modelo.nombre}</h3>
                      <p className="m-0 mt-1.5 max-w-none text-left text-sm leading-relaxed text-brand-ink/75">{modelo.detalle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ── Cómo ayudamos ── */}
      <section aria-labelledby="como-ayudamos" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <FadeInSection>
          <h2 id="como-ayudamos" className={`pop-in ${H2} text-brand-ink`}>Tres maneras de ayudar</h2>
          <ul className="m-0 mt-8 grid list-none gap-4 p-0 md:grid-cols-3">
            {AYUDAS.map(({ icono: Icono, titulo, texto, fondo }, index) => (
              <li key={titulo} className={`pop-in group rounded-[26px] p-6 text-white shadow-[0_22px_40px_-26px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transform-none sm:p-7 ${fondo}`} style={{ ['--d' as string]: `${120 + index * 110}ms` }}>
                <Icono size={44} strokeWidth={1.7} aria-hidden className="transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none" />
                <h3 className="m-0 mt-5 text-left font-display text-2xl font-extrabold leading-tight">{titulo}</h3>
                <p className="m-0 mt-2 max-w-none text-left text-base leading-relaxed text-white/90">{texto}</p>
              </li>
            ))}
          </ul>
        </FadeInSection>
      </section>

      {/* ── Historia ── */}
      <section aria-labelledby="historia" className="relative isolate overflow-hidden bg-brand-deep text-white">
        <div className="mx-auto max-w-6xl px-4 pb-32 pt-14 sm:px-6 sm:pb-40 sm:pt-20">
          <FadeInSection>
            <h2 id="historia" className={`pop-in ${H2} text-white`}>Una historia de más de 180 años</h2>
            <p className={`pop-in ${BAJADA} text-white/80`} style={{ ['--d' as string]: '100ms' }}>Empezó con un obispo francés que confió en los chicos.</p>
          </FadeInSection>
          <ol className="relative m-0 mt-10 list-none p-0 before:absolute before:bottom-3 before:left-[1.05rem] before:top-3 before:w-1 before:rounded-full before:bg-white/20 sm:before:left-[1.3rem]">
            {HISTORIA.map((hito, index) => (
              <li key={hito.anio} className="relative pb-9 pl-14 last:pb-0 sm:pl-20">
                {/* El punto va fuera del bloque animado: así queda sobre la línea y no encima del año. */}
                <span aria-hidden className="absolute left-0 top-1 h-9 w-9 rounded-full ring-4 ring-brand-deep sm:h-11 sm:w-11" style={{ backgroundColor: CONTINENTES[index % CONTINENTES.length].color }} />
                <FadeInSection>
                  <p className="pop-in m-0 max-w-none text-left font-display text-5xl font-extrabold leading-none tabular-nums text-brand-gold sm:text-6xl" style={{ ['--d' as string]: '80ms' }}>{hito.anio}</p>
                  <h3 className="pop-in m-0 mt-2 text-left font-display text-2xl font-extrabold leading-tight text-white" style={{ ['--d' as string]: '160ms' }}>{hito.titulo}</h3>
                  <p className="pop-in m-0 mt-2 max-w-xl text-left text-base leading-relaxed text-white/80" style={{ ['--d' as string]: '240ms' }}>{hito.texto}</p>
                </FadeInSection>
              </li>
            ))}
          </ol>
        </div>
        <Ondas hacia="#fbf8f3" simple />
      </section>

      {/* ── Modelos, colores e insignias ── */}
      <section aria-labelledby="modelos" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeInSection>
          <h2 id="modelos" className={`pop-in ${H2} text-brand-ink`}>Nuestros signos</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="pop-in rounded-[26px] bg-stone-800 p-6 text-white sm:p-8">
              <h3 className="m-0 text-left font-display text-2xl font-extrabold leading-tight">Cinco colores, cinco continentes</h3>
              <p className="m-0 mt-2 max-w-none text-left text-base leading-relaxed text-white/80">Cada color nos recuerda a los chicos de un lugar del mundo. Por todos ellos rezamos el Rosario Misionero.</p>
              <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
                {CONTINENTES.map((item) => (
                  <li key={item.nombre} className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-2 pr-3.5 text-sm font-bold">
                    <span aria-hidden className="h-4 w-4 rounded-full ring-1 ring-black/20" style={{ backgroundColor: item.color }} />
                    {item.nombre}
                  </li>
                ))}
              </ul>
              <Link href="/espiritualidad" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-stone-900 no-underline transition-colors hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Rezar el Rosario Misionero
                <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
              </Link>
            </div>
            <div className="pop-in rounded-[26px] bg-yellow-400 p-6 text-brand-deep sm:p-8" style={{ ['--d' as string]: '120ms' }}>
              <h3 className="m-0 text-left font-display text-2xl font-extrabold leading-tight">Nuestras insignias</h3>
              <p className="m-0 mt-2 max-w-none text-left text-base leading-relaxed text-brand-deep/85">Se van recibiendo a lo largo del camino en la IAM.</p>
              <ul className="m-0 mt-5 grid list-none grid-cols-3 gap-2 p-0">
                {INSIGNIAS.map((insignia) => (
                  <li key={insignia.nombre} className="group rounded-2xl bg-white p-3 text-center sm:p-4">
                    <Image src={insignia.imagen} alt={insignia.alt} width={insignia.ancho} height={insignia.alto} sizes="(max-width: 640px) 28vw, 10rem" className="mx-auto h-20 w-auto object-contain transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none sm:h-28" />
                    <span className="mt-2 block font-display text-base font-extrabold leading-tight sm:text-lg">{insignia.nombre}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ── Cómo trabajamos ── */}
      <section aria-labelledby="como-trabajamos" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <FadeInSection>
          <h2 id="como-trabajamos" className={`pop-in ${H2} text-brand-ink`}>Cómo nos organizamos</h2>
          <p className={`pop-in ${BAJADA} text-brand-ink/80`} style={{ ['--d' as string]: '100ms' }}>
            En cada IAM, los animadores acompañan a los chicos con la Escuela con Jesús. Y en la arquidiócesis trabajamos en cinco áreas.
          </p>
          <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-5">
            {AREA_ORDER.map((key, index) => {
              const area = AREA_THEME[key];
              const Icon = AREA_ICONS[key];
              return (
                <li key={key} className="pop-in sm:last:col-span-2 lg:last:col-span-1" style={{ ['--d' as string]: `${160 + index * 80}ms` }}>
                  <Link href={area.href} className={`group flex h-full items-center gap-4 rounded-2xl p-5 no-underline transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transform-none lg:flex-col lg:items-start lg:gap-0 ${area.tile}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/10 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none">
                      <Icon size={24} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 lg:mt-4">
                      <span className="block font-display text-xl font-extrabold leading-tight">{area.label}</span>
                      <span className="mt-1 block text-sm leading-snug opacity-90">{area.summary}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </FadeInSection>
      </section>

      {/* ── Dónde estamos ── */}
      {grupos.length > 0 && (
        <section aria-labelledby="donde-estamos" className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
          <FadeInSection>
            <div className="flex items-center gap-4 sm:gap-6">
              <Image src="/assets/quienes/jesus-ubicacion.webp" alt="" width={658} height={900} sizes="8rem" className="pop-in h-28 w-auto shrink-0 rounded-3xl sm:h-36" />
              <div>
                <h2 id="donde-estamos" className={`pop-in ${H2} text-brand-ink`} style={{ ['--d' as string]: '80ms' }}>Dónde estamos</h2>
                <p className={`pop-in ${BAJADA} text-brand-ink/80`} style={{ ['--d' as string]: '160ms' }}>
                  {grupos.length} IAM en {porCiudad.length} {porCiudad.length === 1 ? 'ciudad' : 'ciudades'} de la Arquidiócesis de Paraná.
                </p>
              </div>
            </div>
            {puntos.length > 0 && (
              <div className="pop-in mt-8" style={{ ['--d' as string]: '220ms' }}>
                <MapaIam puntos={puntos} />
                <p className="m-0 mt-2 max-w-none text-left text-sm text-brand-ink/60">Acercate con la rueda del mouse o con dos dedos, y tocá un punto para ver qué IAM es y cómo contactarla. Algunas ubicaciones son aproximadas.</p>
              </div>
            )}
            {/* La misma información en texto, para quien no usa el mapa. */}
            <details className="group mt-4 rounded-[22px] bg-white ring-1 ring-brand-brown/10 [&_summary::-webkit-details-marker]:hidden" open={puntos.length === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[22px] px-5 py-4 font-display text-lg font-extrabold text-brand-ink transition-colors hover:bg-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">
                Ver la lista de todas las IAM
                <ChevronDown size={20} aria-hidden className="shrink-0 text-brand-brown transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <ul className="m-0 grid list-none gap-3 px-4 pb-5 pt-1 sm:grid-cols-2 sm:px-5 lg:grid-cols-3">
                {porCiudad.map(([ciudad, lista]) => (
                  <li key={ciudad} className="rounded-2xl bg-brand-paper p-4 ring-1 ring-brand-brown/10">
                    <h3 className="m-0 text-left font-display text-xl font-extrabold leading-tight text-brand-ink">{ciudad}</h3>
                    <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
                      {lista.map((grupo) => {
                        const whatsapp = grupo.telefono ? whatsappHref(grupo.telefono) : null;
                        const enlaces = [
                          grupo.telefono && { texto: grupo.telefono, href: telHref(grupo.telefono), externo: false },
                          whatsapp && { texto: 'WhatsApp', href: whatsapp, externo: true },
                          grupo.instagram && { texto: 'Instagram', href: grupo.instagram, externo: true },
                          grupo.facebook && { texto: 'Facebook', href: grupo.facebook, externo: true },
                        ].filter((item): item is { texto: string; href: string; externo: boolean } => Boolean(item));
                        return (
                          <li key={grupo.id} className="flex items-start gap-2 text-left">
                            <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: grupo.color ?? '#a8a29e' }} />
                            <div className="min-w-0">
                              <span className="block text-sm font-bold leading-snug text-brand-ink">{grupo.nombre}</span>
                              {grupo.direccion && <span className="block text-sm leading-snug text-brand-ink/70">{grupo.direccion}</span>}
                              {enlaces.length > 0 && (
                                <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                                  {enlaces.map((item) => (
                                    <a key={item.texto} href={item.href} {...(item.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="font-bold text-blue-800 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
                                      {item.texto}
                                    </a>
                                  ))}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </details>
          </FadeInSection>
        </section>
      )}

      {/* ── Documentos institucionales ── */}
      <section id="documentos" aria-labelledby="documentos-titulo" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-14 sm:px-6 sm:pb-20">
        {documentos.length > 0 && (
          <>
            <h2 id="documentos-titulo" className={`${H2} text-brand-ink`}>Documentos institucionales</h2>
            <p className={`${BAJADA} mb-8 text-brand-ink/80`}>Documentos oficiales, orientaciones y protocolos de IAM Paraná.</p>
          </>
        )}
        <InstitutionalResourceSections groups={documentos} />
        <InstitutionalPageManager pages={paginas} />
        <InstitutionalDocuments pages={paginas} />
      </section>

      {/* ── Empezar una IAM ── */}
      <EmpezarIam />
    </div>
  );
}

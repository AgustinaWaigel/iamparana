import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BellRing, BookOpen, CalendarDays, ClipboardPen, FileClock, FolderOpen, Newspaper, PieChart, ShoppingBag, Users, UsersRound, type LucideIcon } from 'lucide-react';

// Panel de administración: todas las herramientas en un solo lugar, con una línea que explica
// para qué sirve cada una. El acceso lo controla el layout de /admin (solo administradores).

export const metadata: Metadata = { title: 'Administración', robots: { index: false, follow: false } };

interface Herramienta {
  titulo: string;
  detalle: string;
  href: string;
  icono: LucideIcon;
  fondo: string;
  externa?: boolean;
}

const GRUPOS: Array<{ titulo: string; bajada: string; herramientas: Herramienta[] }> = [
  {
    titulo: 'Eventos e inscripciones',
    bajada: 'Todo lo que tiene que ver con anotarse a un evento.',
    herramientas: [
      { titulo: 'Inscripciones', detalle: 'Inscriptos de cada evento, logística, pagos, y los grupos de IAM con sus animadores.', href: '/admin/inscripciones', icono: ClipboardPen, fondo: 'bg-blue-700' },
      { titulo: 'Calendario', detalle: 'Crear y editar eventos, abrirles la inscripción y activar sus notificaciones.', href: '/calendario', icono: CalendarDays, fondo: 'bg-red-600' },
      { titulo: 'Cuentas familiares', detalle: 'Ayudar a una familia que perdió el acceso a su mail o cambió de adulto responsable.', href: '/admin/inscripciones/cuentas', icono: UsersRound, fondo: 'bg-emerald-600' },
    ],
  },
  {
    titulo: 'Comunicación con la gente',
    bajada: 'Lo que le llega a quien sigue a la IAM.',
    herramientas: [
      { titulo: 'Avisos al celular', detalle: 'Mandar un aviso a todos los que activaron las notificaciones y ver los últimos enviados.', href: '/admin/notificaciones', icono: BellRing, fondo: 'bg-amber-500' },
      { titulo: 'Noticias', detalle: 'Publicar, editar o borrar noticias. Los botones aparecen sobre cada noticia.', href: '/noticias', icono: Newspaper, fondo: 'bg-violet-600' },
      { titulo: 'Merch de la IAM', detalle: 'Los productos y los precios se cargan en el sistema de ventas; el sitio los muestra solos.', href: 'https://ventas-comu.vercel.app/editar-productos', icono: ShoppingBag, fondo: 'bg-yellow-500', externa: true },
    ],
  },
  {
    titulo: 'Contenido de las áreas',
    bajada: 'Se edita desde la página de cada área, con los botones que ven los administradores y el equipo del área.',
    herramientas: [
      { titulo: 'Temario de Formación', detalle: 'Cargar el temario del año, mes por mes. Botones «Editar» y «Otro año» sobre el temario.', href: '/formacion', icono: BookOpen, fondo: 'bg-yellow-500' },
      { titulo: 'Cuentas claras', detalle: 'Cargar lo que entró y lo que salió en cada evento. Botón «Cargar un evento» en Logística.', href: '/logistica', icono: PieChart, fondo: 'bg-red-600' },
      { titulo: 'Recursos y documentos', detalle: 'Subir documentos, enlaces y álbumes de fotos en cada área, y los documentos institucionales en Quiénes somos.', href: '/quienes-somos#documentos', icono: FolderOpen, fondo: 'bg-stone-700' },
    ],
  },
  {
    titulo: 'Personas y control',
    bajada: 'Quién puede hacer qué, y qué se hizo.',
    herramientas: [
      { titulo: 'Usuarios', detalle: 'Cuentas del sitio, roles y a qué área pertenece cada uno.', href: '/admin/usuarios', icono: Users, fondo: 'bg-brand-brown' },
      { titulo: 'Auditoría', detalle: 'El registro de los cambios hechos en el sitio: quién, qué y cuándo.', href: '/admin/auditoria', icono: FileClock, fondo: 'bg-stone-700' },
    ],
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
        <h1 className="m-0 text-left font-display text-[clamp(2.2rem,6vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink">Administración</h1>
        <p className="m-0 mt-3 max-w-2xl text-left text-lg leading-relaxed text-brand-ink/75">Todas las herramientas del sitio en un solo lugar.</p>

        {GRUPOS.map((grupo) => (
          <section key={grupo.titulo} aria-labelledby={`grupo-${grupo.titulo}`} className="mt-10">
            <h2 id={`grupo-${grupo.titulo}`} className="m-0 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">{grupo.titulo}</h2>
            <p className="m-0 mt-1 max-w-none text-left text-base text-brand-ink/65">{grupo.bajada}</p>
            <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.herramientas.map(({ titulo, detalle, href, icono: Icono, fondo, externa }) => {
                const contenido = (
                  <>
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none ${fondo}`}>
                      <Icono size={24} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 font-display text-xl font-extrabold leading-tight text-brand-ink">
                        {titulo}
                        <ArrowRight size={17} aria-hidden className="shrink-0 text-brand-brown transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-brand-ink/70">{detalle}{externa && ' Se abre en otra pestaña.'}</span>
                    </span>
                  </>
                );
                const clase = 'group flex h-full items-start gap-4 rounded-[22px] bg-white p-5 no-underline ring-1 ring-brand-brown/10 transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown motion-reduce:transform-none';
                return (
                  <li key={titulo}>
                    {externa ? <a href={href} target="_blank" rel="noopener noreferrer" className={clase}>{contenido}</a> : <Link href={href} className={clase}>{contenido}</Link>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

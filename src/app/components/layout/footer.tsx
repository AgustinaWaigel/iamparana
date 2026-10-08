import Image from 'next/image';
import Link from 'next/link';
import { AREA_ORDER, AREA_THEME } from '@/app/components/common/area-theme';

const SOCIALS = [
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCShR66tuvm-N-I5ZUZ6Oo6Q', icon: '/assets/socialmedia/youtube.webp' },
  { label: 'Instagram', href: 'https://www.instagram.com/iamarqparana/', icon: '/assets/socialmedia/instagram.webp' },
  { label: 'Facebook', href: 'https://www.facebook.com/IamParana/', icon: '/assets/socialmedia/facebook.webp' },
];

const SITE_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Calendario', href: '/calendario' },
  { label: 'Inscripciones', href: '/inscripciones' },
  { label: 'Info Institucional', href: '/institucional' },
];

const LINK_CLASS =
  'inline-block rounded py-1 text-[15px] text-white/80 no-underline transition-colors hover:text-brand-gold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold';
const HEADING_CLASS = 'm-0 mb-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-brand-gold';

const Footer: React.FC = () => {
  return (
    // Las variantes [&_…] neutralizan las reglas globales heredadas de `footer` en globals.css.
    <footer
      className="relative mt-auto px-4 pb-8 pt-12 text-left text-white sm:px-6 sm:pt-14 [&_a:hover]:scale-100 [&_a]:mx-0 [&_div]:mb-0"
      style={{
        backgroundColor: '#3a1508',
        backgroundImage: "url('/assets/header/headerbg.webp')",
        backgroundSize: '520px',
        backgroundBlendMode: 'soft-light',
      }}
    >
      <div className="absolute inset-0 bg-brand-deep/80" />
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-gold via-brand-goldsoft to-brand-gold" />

      <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
        <div>
          <Link
            href="/"
            aria-label="IAM Paraná, ir al inicio"
            className="inline-flex items-center gap-3 rounded-xl no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            <Image
              src="/assets/header/logoiam2.png"
              alt=""
              width={60}
              height={60}
              className="h-14 w-14 object-contain brightness-100 invert-0"
            />
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              IAM <span className="text-brand-gold">Paraná</span>
            </span>
          </Link>
          <p className="m-0 mt-4 max-w-sm text-left text-[15px] leading-relaxed text-white/75">
            Secretariado de la Infancia y Adolescencia Misionera Arquidiócesis de
            Paraná - Equipo de Comunicación
          </p>
          <ul className="m-0 mt-5 flex list-none gap-3 p-0">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.label} (se abre en una pestaña nueva)`}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
                >
                  <Image src={social.icon} alt="" width={32} height={32} className="h-6 w-6 brightness-0 invert" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={HEADING_CLASS}>Recursos</h2>
          <ul className="m-0 list-none p-0">
            {AREA_ORDER.map((key) => (
              <li key={key}>
                <Link href={AREA_THEME[key].href} className={LINK_CLASS}>{AREA_THEME[key].label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={HEADING_CLASS}>El sitio</h2>
          <ul className="m-0 list-none p-0">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

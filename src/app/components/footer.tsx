import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto bg-brand-brown px-5 py-5 text-center text-white">
      <div className="mb-3">
        <a
          href="https://www.youtube.com/channel/UCShR66tuvm-N-I5ZUZ6Oo6Q"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-2 inline-block transition hover:scale-110"
        >
          <Image
            src="/assets/socialmedia/youtube.webp"
            alt="YouTube"
            width={32}
            height={32}
            className="h-8 w-8 brightness-0 invert"
          />
        </a>
        <a
          href="https://www.instagram.com/iamarqparana/"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-2 inline-block transition hover:scale-110"
        >
          <Image
            src="/assets/socialmedia/instagram.webp"
            alt="Instagram"
            width={32}
            height={32}
            className="h-8 w-8 brightness-0 invert"
          />
        </a>
        <a
          href="https://www.facebook.com/IamParana/"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-2 inline-block transition hover:scale-110"
        >
          <Image
            src="/assets/socialmedia/facebook.webp"
            alt="Facebook"
            width={32}
            height={32}
            className="h-8 w-8 brightness-0 invert"
          />
        </a>
      </div>
      <p className="mx-auto mb-3 max-w-3xl text-base leading-relaxed">
        Secretariado de la Infancia y Adolescencia Misionera Arquidiócesis de
        Paraná - Equipo de Comunicación
      </p>
      <Link
        href="/institucional"
        className="inline-block font-bold underline-offset-2 hover:underline"
      >
        Info Institucional
      </Link>
    </footer>
  );
};

export default Footer;

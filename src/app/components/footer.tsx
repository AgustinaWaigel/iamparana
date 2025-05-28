import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <a
          href="https://www.youtube.com/channel/UCShR66tuvm-N-I5ZUZ6Oo6Q"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/assets/socialmedia/youtube.webp"
            alt="YouTube"
            width={32}
            height={32}
          />
        </a>
        <a
          href="https://www.instagram.com/iamarqparana/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/assets/socialmedia/instagram.webp"
            alt="Instagram"
            width={32}
            height={32}
          />
        </a>
        <a
          href="https://www.facebook.com/IamParana/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/assets/socialmedia/facebook.webp"
            alt="Facebook"
            width={32}
            height={32}
          />
        </a>
      </div>
      <p className="Secre">
        Secretariado de la Infancia y Adolescencia Misionera Arquidiócesis de
        Paraná - Equipo de Comunicación
      </p>
      <Link
        href="/institucional"
        className="footer-institucional-link"
      >
        Info Institucional
      </Link>
    </footer>
  );
};

export default Footer;

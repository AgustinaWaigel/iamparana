const Footer: React.FC = () => {
  return (
    <footer>
      <div>
        <a
          href="https://www.youtube.com/channel/UCShR66tuvm-N-I5ZUZ6Oo6Q"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/socialmedia/youtube.webp"
            alt="YouTube"
          />
        </a>
        <a
          href="https://www.instagram.com/iamarqparana/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/socialmedia/instagram.webp"
            alt="Instagram"
          />
        </a>
        <a
          href="https://www.facebook.com/IamParana/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/socialmedia/facebook.webp"
            alt="Facebook"
          />
        </a>
      </div>
      <p className="Secre">
        Secretariado de la Infancia y Adolescencia Misionera Arquidiócesis de
        Paraná - Equipo de Comunicación
      </p>
              <a
          href="/institucional"
          className="footer-institucional-link"
        >
          Info Institucional
        </a>
    </footer>
  );
};

export default Footer;

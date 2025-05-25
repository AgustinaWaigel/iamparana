import { useEffect, useState } from 'react';

export default function Home() {
  const [carouselItems, setCarouselItems] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para cargar el carrusel desde el archivo JSON
  const loadCarousel = async () => {
    try {
      const response = await fetch('/json/carousel.json');
      const data = await response.json();
      setCarouselItems(data.items);
    } catch (error) {
      console.error('Error cargando el carrusel:', error);
    }
  };

  // Función para cargar la agenda desde el archivo JSON
  const loadAgenda = async () => {
    try {
      const response = await fetch('/json/agenda.json');
      const data = await response.json();
      setAgendaItems(data.events);
    } catch (error) {
      console.error('Error cargando la agenda:', error);
    }
  };

  // Función para cargar las novedades desde el archivo JSON
  const loadNovedades = async () => {
    try {
      const response = await fetch('/json/novedades.json');
      const data = await response.json();
      setNovedades(data.items);
    } catch (error) {
      console.error('Error cargando las novedades:', error);
    }
  };

  // Función para mostrar/ocultar el menú
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Efecto para cargar los datos cuando se monta el componente
  useEffect(() => {
    loadCarousel();
    loadAgenda();
    loadNovedades();
  }, []);

  // Función para cambiar de imagen en el carrusel
  const moveSlide = (direction) => {
    const slides = document.querySelectorAll('.carousel-slide > img');
    const currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = slides.length - 1;
    if (newIndex >= slides.length) newIndex = 0;
    slides[currentIndex].classList.remove('active');
    slides[newIndex].classList.add('active');
  };

  // Función para manejar la carga de eventos de agenda (mostrar más/menos)
  const handleShowMoreAgenda = () => {
    const list = document.getElementById('agenda-list');
    const button = document.getElementById('mostrar-mas');
    if (list && button) {
      const items = list.children;
      for (let i = 0; i < items.length; i++) {
        items[i].style.display = 'block'; // Mostrar todos
      }
      button.style.display = 'none';
      document.getElementById('mostrar-menos').style.display = 'inline-block';
    }
  };

  const handleShowLessAgenda = () => {
    const list = document.getElementById('agenda-list');
    const button = document.getElementById('mostrar-menos');
    if (list && button) {
      const items = list.children;
      for (let i = 2; i < items.length; i++) {
        items[i].style.display = 'none'; // Ocultar algunos
      }
      button.style.display = 'none';
      document.getElementById('mostrar-mas').style.display = 'inline-block';
    }
  };

  return (
    <>
      {/* Carrusel */}
      <div className="carousel">
        <div id="carousel-slide" className="carousel-slide">
          {carouselItems.map((item, index) => (
            <img
              key={index}
              src={item.image}
              alt={item.alt}
              className={index === 0 ? 'active' : ''}
            />
          ))}
        </div>
        <button onClick={() => moveSlide(-1)} className="carousel-prev">❮</button>
        <button onClick={() => moveSlide(1)} className="carousel-next">❯</button>
      </div>

      {/* Menú */}
      <div id="menu" className={`menu ${isMenuOpen ? 'open' : ''}`}>
        <button onClick={toggleMenu} className="menu-toggle">☰</button>
        <ul>
          <li><a href="/novedades">Novedades</a></li>
          <li><a href="/agenda">Agenda</a></li>
          {/* Agrega más enlaces aquí según sea necesario */}
        </ul>
      </div>

      {/* Agenda */}
      <div id="agenda">
        <h2>Agenda</h2>
        <ul id="agenda-list">
          {agendaItems.slice(0, 2).map((event, index) => (
            <li key={index}>{event.title}</li>
          ))}
        </ul>
        <button
          id="mostrar-mas"
          style={{ display: agendaItems.length <= 2 ? 'none' : 'inline-block' }}
          onClick={handleShowMoreAgenda}
        >
          Mostrar más
        </button>
        <button
          id="mostrar-menos"
          style={{ display: 'none' }}
          onClick={handleShowLessAgenda}
        >
          Mostrar menos
        </button>
      </div>

      {/* Novedades */}
      <div id="novedades">
        <h2>Novedades</h2>
        <ul id="novedades-list">
          {novedades.map((novedad, index) => (
            <li key={index}>{novedad.title}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

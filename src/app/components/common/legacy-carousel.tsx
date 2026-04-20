"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CarouselItem = {
  image: string;
  [key: string]: unknown;
};

type AgendaEvent = {
  [key: string]: unknown;
};

type Novedad = {
  [key: string]: unknown;
};

export default function CarouselClient() {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaEvent[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadCarousel = async () => {
    try {
      const response = await fetch("/json/carousel.json");
      const data = await response.json();
      setCarouselItems(data.items || []);
    } catch (error) {
      console.error("Error cargando el carrusel:", error);
    }
  };

  const loadAgenda = async () => {
    try {
      const response = await fetch("/json/agenda.json");
      const data = await response.json();
      setAgendaItems(data.events || []);
    } catch (error) {
      console.error("Error cargando la agenda:", error);
    }
  };

  const loadNovedades = async () => {
    try {
      const response = await fetch("/json/novedades.json");
      const data = await response.json();
      setNovedades(data.items || []);
    } catch (error) {
      console.error("Error cargando las novedades:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    loadCarousel();
    loadAgenda();
    loadNovedades();
  }, []);

  const moveSlide = (direction: number) => {
    const slides = document.querySelectorAll(".carousel-slide > img");
    const currentIndex = Array.from(slides).findIndex((slide) =>
      slide.classList.contains("active")
    );
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = slides.length - 1;
    if (newIndex >= slides.length) newIndex = 0;
    slides[currentIndex].classList.remove("active");
    slides[newIndex].classList.add("active");
  };

  const handleShowMoreAgenda = () => {
    const list = document.getElementById("agenda-list");
    const button = document.getElementById("mostrar-mas");
    if (list && button) {
      const items = list.children;
      for (let i = 0; i < items.length; i++) {
        (items[i] as HTMLElement).style.display = "block";
      }
      button.style.display = "none";
      const mostrarMenos = document.getElementById("mostrar-menos");
      if (mostrarMenos) mostrarMenos.style.display = "inline-block";
    }
  };

  const handleShowLessAgenda = () => {
    const list = document.getElementById("agenda-list");
    const button = document.getElementById("mostrar-menos");
    if (list && button) {
      const items = list.children;
      for (let i = 2; i < items.length; i++) {
        (items[i] as HTMLElement).style.display = "none";
      }
      button.style.display = "none";
      const mostrarMas = document.getElementById("mostrar-mas");
      if (mostrarMas) mostrarMas.style.display = "inline-block";
    }
  };

  return (
    <>
      {/* Carrusel */}
      <div className="carousel">
        <div id="carousel-slide" className="carousel-slide">
          {carouselItems.map((item, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={item.image as string}
              alt={`Slide ${index}`}
              className={index === 0 ? "active" : ""}
            />
          ))}
        </div>
        <button onClick={() => moveSlide(-1)}>Anterior</button>
        <button onClick={() => moveSlide(1)}>Siguiente</button>
      </div>

      {/* Agenda */}
      <div className="agenda">
        <h2>Agenda</h2>
        <ul id="agenda-list">
          {agendaItems.map((event, index) => (
            <li key={index}>{JSON.stringify(event)}</li>
          ))}
        </ul>
        <button
          id="mostrar-mas"
          onClick={handleShowMoreAgenda}
          style={{ display: agendaItems.length > 2 ? "inline-block" : "none" }}
        >
          Mostrar más
        </button>
        <button
          id="mostrar-menos"
          onClick={handleShowLessAgenda}
          style={{ display: "none" }}
        >
          Mostrar menos
        </button>
      </div>

      {/* Novedades */}
      <div className="novedades">
        <h2>Novedades</h2>
        <ul>
          {novedades.map((novedad, index) => (
            <li key={index}>{JSON.stringify(novedad)}</li>
          ))}
        </ul>
      </div>

      {/* Menu */}
      <nav className={`menu ${isMenuOpen ? "open" : ""}`}>
        <button onClick={toggleMenu}>Menú</button>
        <ul className={`menu-list ${isMenuOpen ? "show" : ""}`}>
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li>
            <Link href="/agenda">Agenda</Link>
          </li>
          <li>
            <Link href="/noticias">Noticias</Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

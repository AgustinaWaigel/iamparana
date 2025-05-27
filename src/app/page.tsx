'use client';

import './globals.css';
import Carousel from "./components/carousel";
import Agenda from "./components/agenda";
import Novedades from "./components/novedades";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
  }, []);

  return (
    <>
      <header className="site-header" />
      <main>
        <section className="bienvenida">
          <section className="carousel">
            <Carousel />
          </section>
<p></p>
<p></p>
          <div className="bienvenida-flex">
            <div className="botones-wrapper">
              <div className="botones-area">
                <a href="/animacion">Animación</a>
                <a href="/formacion">Formación</a>
                <a href="/espiritualidad">Espiritualidad</a>
                <a href="/logistica">Logística</a>
                <a href="/comunicacion">Comunicación</a>
              </div>
            </div>
          </div>
        </section>

        <div className="agenda-novedades-wrapper">
          <section className="novedades">
            <h2 className="titulo-novedades">Noticias</h2>
            <Novedades />
          </section>

          <section className="agenda">
            <h2 className="titulo-novedades">Agenda</h2>
            <Agenda />
          </section>
        </div>
      </main>
      <footer className="site-footer" />
    </>
  );
}



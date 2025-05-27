'use client';

import './globals.css';
import Carousel from "./components/carousel";
import Agenda from "./components/agenda";
import Novedades from "./components/novedades";
import { useEffect } from "react";
import Link from 'next/link';

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
                <Link href="/animacion">Animación</Link>
                <Link href="/formacion">Formación</Link>
                <Link href="/espiritualidad">Espiritualidad</Link>
                <Link href="/logistica">Logística</Link>
                <Link href="/comunicacion">Comunicación</Link>
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



"use client";

import { useEffect, useState } from "react";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
}

export default function Novedades() {
  const [novedades, setNovedades] = useState<Noticia[]>([]);

  useEffect(() => {
    fetch("/api/noticias")
      .then((res) => res.json())
      .then((data: Noticia[]) => setNovedades(data.slice(0, 4)))
      .catch(console.error);
  }, []);

  return (
    <ul id="novedades-list">
      {novedades.map((item, i) => (
        <li key={i}>
          <div className="novedad-item">
            <img src={item.image} alt={item.title} className="novedad-img" />
            <div className="novedad-texto">
              <h2 className="novedad-titulo">{item.title}</h2>
              <p className="novedad-descripcion">{item.description} <a href={`/noticias/${item.slug}`} className="novedad-link">
                Ver más
              </a></p>

            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

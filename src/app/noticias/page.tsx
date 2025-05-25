"use client";

import { useEffect, useState } from "react";

interface Noticia {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

export default function Noticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    fetch("/api/noticias")
      .then((res) => res.json())
      .then(setNoticias)
      .catch(console.error);
  }, []);

  return (
    <>
      
      <main>

              <div>
        <p></p>
            <h2 className="barra-contextual color-comunicacion-boton">Noticias de la IAM</h2>
      </div>
<div className="grid-noticias">
  {noticias.map((item) => (
    <article key={item.slug} className="noticia-card">
      <a href={`/noticias/${item.slug}`} className="noticia-link">
        <img src={item.image} alt={item.title} />
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </a>
    </article>
  ))}
</div>

      </main>
      
    </>
  );
}

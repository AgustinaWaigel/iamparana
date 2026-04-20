"use client";

import { useEffect } from "react";

interface Cancion {
  titulo: string;
  archivo: string;
  [key: string]: unknown;
}

export function useCancionero(): void {
  useEffect(() => {
    const lista = document.getElementById("lista-canciones");
    const buscador = document.getElementById("buscador") as HTMLInputElement;

    if (!lista || !buscador) return;

    fetch("../json/canciones.json")
      .then((response) => response.json())
      .then((canciones: Cancion[]) => {
        canciones.sort((a, b) =>
          a.titulo.localeCompare(b.titulo)
        );
        mostrarCanciones(canciones);

        buscador.addEventListener("input", () => {
          const filtro = buscador.value.toLowerCase();
          const filtradas = canciones.filter((cancion) =>
            cancion.titulo.toLowerCase().includes(filtro)
          );
          mostrarCanciones(filtradas);
        });
      })
      .catch((err) => console.error("Error cargando canciones:", err));

    function mostrarCanciones(canciones: Cancion[]): void {
      if (!lista) return;
      lista.innerHTML = "";
      canciones.forEach((cancion) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `animacion/canciones/${cancion.archivo}`;
        a.rel = "noopener noreferrer";
        a.textContent = cancion.titulo;
        li.appendChild(a);
        lista.appendChild(li);
      });
    }
  }, []);
}

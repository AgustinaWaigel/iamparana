"use client";

import { useEffect, useState } from "react";
import styles from "./ChordTransposer.module.css";


const tonosLatinos = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const tonosAmericanos = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function normalizarAcorde(acorde: string) {
  acorde = acorde.toLowerCase();
  for (let i = 0; i < tonosLatinos.length; i++) {
    if (acorde.startsWith(tonosLatinos[i].toLowerCase())) {
      return { base: tonosLatinos[i], resto: acorde.slice(tonosLatinos[i].length) };
    }
  }
  for (let i = 0; i < tonosAmericanos.length; i++) {
    if (acorde.startsWith(tonosAmericanos[i].toLowerCase())) {
      return { base: tonosAmericanos[i], resto: acorde.slice(tonosAmericanos[i].length) };
    }
  }
  return { base: acorde, resto: "" };
}

function transponer(acordeOriginal: string, transposicion: number, usoAmericano: boolean): string {
  const { base, resto } = normalizarAcorde(acordeOriginal);
  const indexLatino = tonosLatinos.map(t => t.toLowerCase()).indexOf(base.toLowerCase());
  const indexAmericano = tonosAmericanos.map(t => t.toLowerCase()).indexOf(base.toLowerCase());
  const index = indexLatino !== -1 ? indexLatino : indexAmericano;
  if (index === -1) return acordeOriginal;

  const nuevoIndex = (index + transposicion + 12) % 12;
  const nuevoBase = usoAmericano ? tonosAmericanos[nuevoIndex] : tonosLatinos[nuevoIndex];
  return nuevoBase + resto;
}

export default function ChordTransposer() {
  const [transposicion, setTransposicion] = useState(0);
  const [usoAmericano, setUsoAmericano] = useState(false);

  useEffect(() => {
    const acordes = document.querySelectorAll(".Chord");
    acordes.forEach((span) => {
      const original = span.getAttribute("data-original") || span.textContent || "";
      span.setAttribute("data-original", original);
      const transpuesto = transponer(original, transposicion, usoAmericano);
      span.textContent = transpuesto;
    });
  }, [transposicion, usoAmericano]);

  return (
    <div className="controles-acordes">
      <button onClick={() => setTransposicion((prev) => (prev + 11) % 12)}>-Tono</button>
      <button onClick={() => setTransposicion((prev) => (prev + 1) % 12)}>+Tono</button>
      <button onClick={() => setUsoAmericano(!usoAmericano)}>
        {usoAmericano ? "C » Do" : "Do » C"}
      </button>
    </div>
  );
}

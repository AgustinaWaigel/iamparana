"use client";

import { useEffect, useState } from "react";


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
    <div className="flex gap-2 justify-center p-4 bg-gray-100 rounded-lg flex-wrap">
      <button 
        onClick={() => setTransposicion((prev) => (prev + 11) % 12)}
        className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 transition-colors"
      >
        ♪ -Tono
      </button>
      <button 
        onClick={() => setTransposicion((prev) => (prev + 1) % 12)}
        className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 transition-colors"
      >
        ♪ +Tono
      </button>
      <button 
        onClick={() => setUsoAmericano(!usoAmericano)}
        className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition-colors"
      >
        {usoAmericano ? "♭ C » Do" : "♭ Do » C"}
      </button>
    </div>
  );
}

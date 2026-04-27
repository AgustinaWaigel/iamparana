"use client";

import { useEffect, useState } from "react";
import { Music, RotateCcw, ChevronUp, ChevronDown, Languages } from "lucide-react";

const tonosLatinos = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const tonosAmericanos = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function normalizarAcorde(acorde: string) {
  acorde = acorde.trim();
  // Buscamos primero sostenidos para evitar que "Do#" se detecte como "Do"
  const todosLosTonos = [...tonosLatinos, ...tonosAmericanos].sort((a, b) => b.length - a.length);
  
  for (const t of todosLosTonos) {
    if (acorde.toLowerCase().startsWith(t.toLowerCase())) {
      return { base: t, resto: acorde.slice(t.length) };
    }
  }
  return { base: acorde, resto: "" };
}

function transponer(acordeOriginal: string, transposicion: number, usoAmericano: boolean): string {
  const { base, resto } = normalizarAcorde(acordeOriginal);
  const indexLatino = tonosLatinos.findIndex(t => t.toLowerCase() === base.toLowerCase());
  const indexAmericano = tonosAmericanos.findIndex(t => t.toLowerCase() === base.toLowerCase());
  
  const index = indexLatino !== -1 ? indexLatino : indexAmericano;
  if (index === -1) return acordeOriginal;

  const nuevoIndex = (index + transposicion + 12) % 12;
  const nuevoBase = usoAmericano ? tonosAmericanos[nuevoIndex] : tonosLatinos[nuevoIndex];
  
  // Mantenemos la capitalización del resto (ej: m, 7, sus4)
  return nuevoBase + resto;
}

export default function ChordTransposer() {
  const [transposicion, setTransposicion] = useState(0);
  const [usoAmericano, setUsoAmericano] = useState(false);

  useEffect(() => {
    const acordes = document.querySelectorAll(".Chord");
    acordes.forEach((span) => {
      const original = span.getAttribute("data-original") || span.textContent || "";
      if (!span.getAttribute("data-original")) {
        span.setAttribute("data-original", original);
      }
      const transpuesto = transponer(original, transposicion, usoAmericano);
      span.textContent = transpuesto;
    });
  }, [transposicion, usoAmericano]);

  const reset = () => {
    setTransposicion(0);
  };

  const btnClass = "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border";

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      
      {/* INDICADOR DE TONALIDAD ACTUAL */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-yellow-400 text-brand-brown rounded-xl shadow-sm">
          <Music size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Transporte</p>
          <p className="text-sm font-black text-brand-brown">
            {transposicion === 0 ? "Tono Original" : `${transposicion > 0 ? "+" : ""}${transposicion} Semitonos`}
          </p>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        
        {/* SUBIR / BAJAR */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
          <button 
            onClick={() => setTransposicion(prev => prev - 1)}
            className="p-2 hover:bg-white hover:text-red-600 rounded-xl transition-all text-stone-500"
            title="Bajar medio tono"
          >
            <ChevronDown size={20} />
          </button>
          
          <button 
            onClick={reset}
            className="px-3 py-2 hover:bg-white text-stone-500 hover:text-brand-brown rounded-xl transition-all text-[10px] font-black uppercase"
          >
            {transposicion !== 0 ? <RotateCcw size={16} /> : "0"}
          </button>

          <button 
            onClick={() => setTransposicion(prev => prev + 1)}
            className="p-2 hover:bg-white hover:text-green-600 rounded-xl transition-all text-stone-500"
            title="Subir medio tono"
          >
            <ChevronUp size={20} />
          </button>
        </div>

        {/* CAMBIAR NOMENCLATURA */}
        <button 
          onClick={() => setUsoAmericano(!usoAmericano)}
          className={`${btnClass} ${usoAmericano ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
        >
          <Languages size={14} />
          {usoAmericano ? "Nomenclatura: C D E" : "Nomenclatura: Do Re Mi"}
        </button>
      </div>
    </div>
  );
}
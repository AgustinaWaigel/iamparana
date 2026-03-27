"use client";

import { useState } from "react";

interface Evento {
  fecha: string;
  fecha_fin?: string;
  evento: string;
}

interface AgendaClientProps {
  eventosVisibles: Evento[];
  eventosFuturos: Evento[];
}

const formatFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

const renderEvento = (item: Evento, i: number) => {
  const inicio = formatFecha(item.fecha);
  const fin =
    item.fecha_fin && item.fecha_fin !== item.fecha
      ? ` - ${formatFecha(item.fecha_fin)}`
      : "";
  return (
    <li key={i} className="py-3 px-4 border-l-4 border-brand-gold bg-gray-50 hover:bg-gray-100 transition-colors">
      <strong className="text-brand-brown">{inicio + fin}</strong> — <span className="text-gray-700">{item.evento}</span>
    </li>
  );
};

export default function AgendaClient({ eventosVisibles, eventosFuturos }: AgendaClientProps) {
  const [mostrarFuturos, setMostrarFuturos] = useState(false);

  return (
    <>
      <ul id="agenda-list" className="space-y-2">
        {(mostrarFuturos ? [...eventosVisibles, ...eventosFuturos] : eventosVisibles).map(
          renderEvento
        )}
      </ul>
      {eventosFuturos.length > 0 && (
        <div className="flex justify-center mt-6">
          {!mostrarFuturos ? (
            <button 
              onClick={() => setMostrarFuturos(true)} 
              id="mostrar-mas"
              className="px-6 py-2 bg-brand-brown text-white rounded-lg font-bold hover:brightness-110 transition-all"
            >
              + Ver más eventos
            </button>
          ) : (
            <button 
              onClick={() => setMostrarFuturos(false)} 
              id="mostrar-menos"
              className="px-6 py-2 bg-brand-brown text-white rounded-lg font-bold hover:brightness-110 transition-all"
            >
              - Ver menos eventos
            </button>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";

interface Evento {
  id?: number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
}

interface AgendaClientProps {
  eventosVisibles: Evento[];
  eventosFuturos: Evento[];
}

const formatFecha = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

const formatFechaCorta = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

const getDiaNumero = (f: string) =>
  new Date(f).getDate();

const getMesNombre = (f: string) =>
  new Date(f).toLocaleDateString("es-AR", { month: "short" });

const renderEvento = (item: Evento, i: number, esFuturo: boolean = false) => {
  const fecha = new Date(item.fecha);
  const dia = getDiaNumero(item.fecha);
  const mes = getMesNombre(item.fecha);
  const inicio = formatFechaCorta(item.fecha);
  const fin =
    item.fecha_fin && item.fecha_fin !== item.fecha
      ? formatFechaCorta(item.fecha_fin)
      : null;

  const esMultipleDias = fin !== null;

  return (
    <li 
      key={i} 
      className={`
        group relative overflow-hidden rounded-lg transition-all duration-300
        ${esFuturo 
          ? "bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 hover:shadow-md hover:scale-105" 
          : "bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-brand-gold hover:shadow-lg hover:scale-105"
        }
        py-4 px-4 sm:px-5 cursor-pointer
      `}
    >
      <div className="flex gap-4 items-start">
        {/* Calendario visual */}
        <div className={`
          flex flex-col items-center justify-center rounded-lg p-2 text-white font-bold min-w-max
          ${esFuturo ? "bg-blue-400" : "bg-brand-gold"}
        `}>
          <span className="text-lg">{dia}</span>
          <span className="text-xs uppercase">{mes}</span>
        </div>

        {/* Contenido del evento */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <strong className={`${esFuturo ? "text-blue-700" : "text-brand-brown"} text-sm sm:text-base`}>
              {inicio}{fin && ` - ${fin}`}
            </strong>
            {esMultipleDias && (
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${esFuturo ? "bg-blue-200 text-blue-700" : "bg-yellow-200 text-amber-800"}`}>
                {Math.ceil((new Date(item.fecha_fin!).getTime() - new Date(item.fecha).getTime()) / (1000 * 60 * 60 * 24))} días
              </span>
            )}
          </div>
          <p className={`${esFuturo ? "text-blue-900" : "text-amber-950"} font-medium text-sm sm:text-base break-words`}>
            {item.evento}
          </p>
        </div>
      </div>

      {/* Efecto de hover sutil */}
      <div className={`
        absolute top-0 right-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity
        ${esFuturo ? "bg-blue-500" : "bg-brand-gold"}
      `} />
    </li>
  );
};

export default function AgendaClient({ eventosVisibles: initialVisibles, eventosFuturos: initialFuturos }: AgendaClientProps) {
  const [mostrarFuturos, setMostrarFuturos] = useState(false);
  const [eventosVisibles, setEventosVisibles] = useState(initialVisibles);
  const [eventosFuturos, setEventosFuturos] = useState(initialFuturos);

  useEffect(() => {
    const handleAgendaUpdated = async () => {
      try {
        const response = await fetch("/api/agenda");
        if (response.ok) {
          const eventos = await response.json();
          
          const hoy = new Date();
          const limite = new Date();
          limite.setMonth(hoy.getMonth() + 2);

          const visible = eventos.filter((e: Evento) => new Date(e.fecha) <= limite);
          const futuros = eventos.filter((e: Evento) => new Date(e.fecha) > limite);

          setEventosVisibles(visible);
          setEventosFuturos(futuros);
        }
      } catch (error) {
        console.error("Error refreshing agenda:", error);
      }
    };

    window.addEventListener("agendaUpdated", handleAgendaUpdated);
    return () => window.removeEventListener("agendaUpdated", handleAgendaUpdated);
  }, []);

  const todosLosEventos = mostrarFuturos 
    ? [
        ...eventosVisibles.map((e, i) => ({ ...e, isFuture: false, index: i })),
        ...eventosFuturos.map((e, i) => ({ ...e, isFuture: true, index: i }))
      ]
    : eventosVisibles.map((e, i) => ({ ...e, isFuture: false, index: i }));

  return (
    <div className="w-full">
      <ul id="agenda-list" className="space-y-3 sm:space-y-4">
        {todosLosEventos.map((item, idx) => 
          renderEvento(item, idx, item.isFuture)
        )}
      </ul>

      {eventosFuturos.length > 0 && (
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => setMostrarFuturos(!mostrarFuturos)} 
            id={mostrarFuturos ? "mostrar-menos" : "mostrar-mas"}
            className={`
              px-6 py-3 rounded-lg font-bold text-white transition-all duration-300
              flex items-center gap-2 hover:shadow-lg hover:scale-105
              ${mostrarFuturos 
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" 
                : "bg-gradient-to-r from-brand-brown to-amber-700 hover:from-amber-800 hover:to-amber-900"
              }
            `}
          >
            <span className="text-xl">
              {mostrarFuturos ? "−" : "+"}
            </span>
            <span>
              {mostrarFuturos 
                ? `Ver menos eventos (${eventosFuturos.length} ocultos)` 
                : `Ver más eventos (${eventosFuturos.length} próximos)`
              }
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

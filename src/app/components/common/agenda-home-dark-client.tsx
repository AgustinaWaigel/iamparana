"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Clock } from "lucide-react";

export interface EventoCard {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  todo_el_dia?: boolean;
}

const MES_CORTO = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const COLOR_TAG: Record<string, string> = {
  "11": "Misión",
  "6":  "Encuentro",
  "5":  "Formación",
  "2":  "Campamento",
  "7":  "Celebración",
  "8":  "Retiro",
};

function parseLocalDate(dateStr: string) {
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatFecha(dateStr: string) {
  const d = parseLocalDate(dateStr);
  return `${d.getDate()} de ${MES_LARGO[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function AgendaHomeDarkClient({ eventos }: { eventos: EventoCard[] }) {
  const [selected, setSelected] = useState<EventoCard | null>(null);

  if (eventos.length === 0) {
    return (
      <p className="text-white/50 text-sm py-6 text-center">
        No hay actividades programadas por el momento.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {eventos.map((e, k) => {
          const fecha = parseLocalDate(e.fecha);
          const dia = fecha.getDate();
          const mes = MES_CORTO[fecha.getMonth()];
          const tag = COLOR_TAG[e.color ?? ""] ?? "Actividad";

          return (
            <button
              key={e.id ?? k}
              type="button"
              onClick={() => setSelected(e)}
              className="flex flex-col rounded-[20px] bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur transition-all hover:bg-white/[0.12] hover:-translate-y-0.5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-gold text-brand-deep">
                  <span className="font-display text-[22px] font-extrabold leading-none">{dia}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{mes}</span>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white/70">
                  {tag}
                </span>
              </div>
              <h3 className="mt-4 font-display text-[18px] font-bold leading-tight text-white text-left">
                {e.evento}
              </h3>
              {e.descripcion?.trim() && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55 line-clamp-2 text-left">
                  {e.descripcion}
                </p>
              )}
              <span className="mt-3 text-[11px] font-bold text-brand-gold/70 uppercase tracking-wider">
                Ver detalles →
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal de detalles */}
      {selected && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Franja de color superior */}
            <div className="h-2 w-full bg-gradient-to-r from-brand-gold via-brand-goldsoft to-brand-gold" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-gold text-brand-deep">
                    <span className="font-display text-[22px] font-extrabold leading-none">
                      {parseLocalDate(selected.fecha).getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {MES_CORTO[parseLocalDate(selected.fecha).getMonth()]}
                    </span>
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-brand-brown/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-brown mb-1">
                      {COLOR_TAG[selected.color ?? ""] ?? "Actividad"}
                    </span>
                    <p className="text-sm text-stone-500 font-medium">
                      {formatFecha(selected.fecha)}
                      {selected.fecha_fin && selected.fecha_fin !== selected.fecha && (
                        <> — {formatFecha(selected.fecha_fin)}</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors shrink-0"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Título */}
              <h2 className="font-display text-[22px] font-extrabold leading-tight text-brand-ink mb-4">
                {selected.evento}
              </h2>

              {/* Horario */}
              {selected.todo_el_dia === false && (selected.hora_inicio || selected.hora_fin) && (
                <div className="flex items-center gap-2 text-sm text-stone-600 mb-3">
                  <Clock size={15} className="text-brand-gold shrink-0" />
                  <span>
                    {selected.hora_inicio && selected.hora_fin
                      ? `${selected.hora_inicio} – ${selected.hora_fin}`
                      : selected.hora_inicio
                        ? `Desde ${selected.hora_inicio}`
                        : `Hasta ${selected.hora_fin}`}
                  </span>
                </div>
              )}

              {/* Descripción */}
              {selected.descripcion?.trim() ? (
                <p className="text-[15px] leading-relaxed text-stone-600 bg-stone-50 rounded-2xl p-4">
                  {selected.descripcion}
                </p>
              ) : (
                <p className="text-sm text-stone-400 italic">Sin descripción.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

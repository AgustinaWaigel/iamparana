"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/app/hooks/use-session";
import { createPortal } from "react-dom";

interface Evento {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
}

interface AgendaClientProps {
  eventosVisibles: Evento[];
  eventosFuturos: Evento[];
}

const COLOR_OPTIONS = [
  { value: "11", label: "Rojo" },
  { value: "6", label: "Naranja" },
  { value: "5", label: "Amarillo" },
  { value: "2", label: "Verde" },
  { value: "7", label: "Azul" },
  { value: "8", label: "Gris" },
];

// Helpers de fecha
const parseLocalDate = (dateStr: string) => {
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatFechaCorta = (date: Date) =>
  date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

const getMesNombre = (date: Date) =>
  date.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");

const formatDiasRestantes = (dateStr: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = parseLocalDate(dateStr);
  const diff = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff <= 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return `En ${diff} días`;
};

const EVENT_COLOR_THEME: Record<string, { chip: string; badge: string; bar: string; title: string }> = {
  "11": {
    chip: "bg-red-100 text-red-800",
    badge: "bg-red-500",
    bar: "bg-red-400",
    title: "text-red-900",
  },
  "6": {
    chip: "bg-orange-100 text-orange-800",
    badge: "bg-orange-500",
    bar: "bg-orange-400",
    title: "text-orange-900",
  },
  "5": {
    chip: "bg-amber-100 text-amber-800",
    badge: "bg-amber-500",
    bar: "bg-amber-400",
    title: "text-amber-900",
  },
  "2": {
    chip: "bg-emerald-100 text-emerald-800",
    badge: "bg-emerald-500",
    bar: "bg-emerald-400",
    title: "text-emerald-900",
  },
  "7": {
    chip: "bg-blue-100 text-blue-800",
    badge: "bg-blue-500",
    bar: "bg-blue-400",
    title: "text-blue-900",
  },
  "8": {
    chip: "bg-slate-200 text-slate-700",
    badge: "bg-slate-500",
    bar: "bg-slate-400",
    title: "text-slate-900",
  },
};

const getThemeByColor = (color?: string) =>
  EVENT_COLOR_THEME[color || ""] || {
    chip: "bg-brand-gold/20 text-brand-brown",
    badge: "bg-brand-gold",
    bar: "bg-brand-gold",
    title: "text-amber-950",
  };

export default function AgendaClient({ 
  eventosVisibles: initialVisibles, 
  eventosFuturos: initialFuturos 
}: AgendaClientProps) {
  const { isAdmin } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [eventosVisibles, setEventosVisibles] = useState(initialVisibles);
  const [eventosFuturos, setEventosFuturos] = useState(initialFuturos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<Evento>({
    fecha: "",
    fecha_fin: "",
    evento: "",
    descripcion: "",
    color: "11",
  });

  const refreshAgenda = async () => {
    try {
      const response = await fetch("/api/agenda");
      if (response.ok) {
        const eventos: Evento[] = await response.json();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const limite = new Date();
        limite.setMonth(hoy.getMonth() + 2);

        const filtrados = eventos.filter((e) => parseLocalDate(e.fecha) >= hoy);
        setEventosVisibles(filtrados.filter((e) => parseLocalDate(e.fecha) <= limite));
        setEventosFuturos(filtrados.filter((e) => parseLocalDate(e.fecha) > limite));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sincronización cuando ocurre un cambio en la base de datos
  useEffect(() => {
    setIsMounted(true);

    const handleAgendaUpdated = async () => refreshAgenda();

    window.addEventListener("agendaUpdated", handleAgendaUpdated);
    return () => window.removeEventListener("agendaUpdated", handleAgendaUpdated);
  }, []);

  const openModal = (evento: Evento) => {
    setSelectedEvento(evento);
    setEditForm({
      id: evento.id,
      fecha: evento.fecha,
      fecha_fin: evento.fecha_fin || "",
      evento: evento.evento,
      descripcion: evento.descripcion || "",
      color: evento.color || "11",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvento(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvento?.id) return;
    if (!editForm.evento?.trim() || !editForm.fecha?.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/agenda", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvento.id,
          evento: editForm.evento.trim(),
          fecha: editForm.fecha,
          fecha_fin: editForm.fecha_fin || undefined,
          color: editForm.color || undefined,
          descripcion: editForm.descripcion?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo editar el evento");
      }

      await refreshAgenda();
      window.dispatchEvent(new Event("agendaUpdated"));
      closeModal();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el cambio del evento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!selectedEvento?.id) return;
    if (!confirm("¿Seguro que querés eliminar este evento?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedEvento.id }),
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el evento");
      }

      await refreshAgenda();
      window.dispatchEvent(new Event("agendaUpdated"));
      closeModal();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el evento.");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderEvento = (item: Evento, i: number, esFuturo: boolean) => {
    const fechaInicio = parseLocalDate(item.fecha);
    const dia = fechaInicio.getDate();
    const mes = getMesNombre(fechaInicio);
    const etiquetaRestante = formatDiasRestantes(item.fecha);
    const colorTheme = getThemeByColor(item.color);
    
    let finStr = null;
    if (item.fecha_fin && item.fecha_fin !== item.fecha) {
      finStr = formatFechaCorta(parseLocalDate(item.fecha_fin));
    }

    return (
      <li 
        key={item.id || i} 
        onClick={() => openModal(item)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openModal(item);
          }
        }}
        role="button"
        tabIndex={0}
        className={`group relative overflow-hidden rounded-2xl transition-all duration-300 border
          ${esFuturo 
            ? "bg-white border-blue-100 opacity-80 hover:opacity-100" 
            : "bg-gradient-to-r from-amber-50 to-white border-brand-gold/20 shadow-sm hover:shadow-md"
          } py-5 px-5 sm:px-8 cursor-pointer`}
      >
        <div className="flex gap-6 items-center">
          <div className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-white font-black min-w-[55px] shadow-inner ${colorTheme.badge}`}>
            <span className="text-2xl leading-none">{dia}</span>
            <span className="text-[10px] uppercase tracking-widest">{mes}</span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`font-bold text-sm tracking-tight ${colorTheme.title}`}>
                {formatFechaCorta(fechaInicio)}{finStr && ` — ${finStr}`}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${colorTheme.chip}`}>
                {etiquetaRestante}
              </span>
            </div>
            <p className={`font-semibold text-base sm:text-lg leading-tight ${colorTheme.title}`}>
              {item.evento}
            </p>
          </div>
        </div>
        <div className={`absolute left-0 top-0 h-full w-2 ${colorTheme.bar}`} />
      </li>
    );
  };

  return (
    <div className="w-full rounded-2xl border border-brand-gold/20 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="mb-4 border-b border-brand-gold/20 pb-3">
        <h3 className="text-lg font-extrabold text-brand-brown sm:text-xl">Próximas actividades</h3>
        
      </div>

      <ul className="space-y-4">
        {eventosVisibles.map((item, idx) => renderEvento(item, idx, false))}
      </ul>

      {eventosFuturos.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Eventos de más adelante
          </div>
          <div className="flex justify-center">
            <Link
              href="/calendario"
              className="rounded-full bg-brand-brown px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-md shadow-brand-brown/20 transition-all hover:bg-amber-900"
            >
              + Ver {eventosFuturos.length} más
            </Link>
          </div>
        </div>
      )}

      {isMounted && isModalOpen && selectedEvento && createPortal(
        <div className="fixed inset-0 z-[999] flex min-h-screen items-center justify-center bg-black/45 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-brand-gold/30 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xl font-extrabold text-brand-brown">{selectedEvento.evento}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {formatFechaCorta(parseLocalDate(selectedEvento.fecha))}
                  {selectedEvento.fecha_fin && selectedEvento.fecha_fin !== selectedEvento.fecha
                    ? ` — ${formatFechaCorta(parseLocalDate(selectedEvento.fecha_fin))}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-slate-100 px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-200"
                aria-label="Cerrar detalle"
              >
                ✕
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-3">
                <p className="rounded-xl bg-amber-50/60 p-3 text-sm leading-relaxed text-slate-700">
                  {selectedEvento.descripcion?.trim() || "Sin descripción."}
                </p>

                {isAdmin && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteFromModal}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.evento || ""}
                  onChange={(event) => setEditForm({ ...editForm, evento: event.target.value })}
                  className="w-full rounded-md border border-amber-200 p-2.5 font-semibold text-brand-brown outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <textarea
                  value={editForm.descripcion || ""}
                  onChange={(event) => setEditForm({ ...editForm, descripcion: event.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-md border border-amber-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                  placeholder="Descripción"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editForm.fecha || ""}
                    onChange={(event) => setEditForm({ ...editForm, fecha: event.target.value })}
                    className="rounded-md border border-amber-200 p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <input
                    type="date"
                    value={editForm.fecha_fin || ""}
                    onChange={(event) => setEditForm({ ...editForm, fecha_fin: event.target.value })}
                    className="rounded-md border border-amber-200 p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <select
                  value={editForm.color || "11"}
                  onChange={(event) => setEditForm({ ...editForm, color: event.target.value })}
                  className="w-full rounded-md border border-amber-200 bg-white p-2.5 font-semibold text-brand-brown outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  {COLOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveEdit}
                    className="rounded-lg bg-brand-brown px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-900 disabled:opacity-50"
                  >
                    {isSaving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
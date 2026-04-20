"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/app/hooks/use-session";

interface Evento {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
}

const COLOR_MAP: Record<string, string> = {
  "11": "bg-red-500",
  "6": "bg-orange-500",
  "5": "bg-amber-500",
  "2": "bg-emerald-500",
  "7": "bg-blue-500",
  "8": "bg-slate-500",
};

const COLOR_OPTIONS = [
  { value: "11", label: "Rojo" },
  { value: "6", label: "Naranja" },
  { value: "5", label: "Amarillo" },
  { value: "2", label: "Verde" },
  { value: "7", label: "Azul" },
  { value: "8", label: "Gris" },
];

const parseLocalDate = (dateStr: string) => {
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const monthLabel = (date: Date) =>
  date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

const dayLabel = (date: Date) =>
  date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

const formatFechaCorta = (date: Date) =>
  date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

export default function CalendarioEventosView() {
  const { isAdmin } = useSession();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
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
      const res = await fetch("/api/agenda", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("No se pudo cargar la agenda");
      }
      const data = (await res.json()) as Evento[];
      setEventos(Array.isArray(data) ? data : []);
    } catch {
      setEventos([]);
    }
  };

  useEffect(() => {
    let mounted = true;

    setIsMounted(true);

    const loadEventos = async () => {
      try {
        const res = await fetch("/api/agenda", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("No se pudo cargar la agenda");
        }
        const data = (await res.json()) as Evento[];
        if (mounted) {
          setEventos(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setEventos([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const handleAgendaUpdated = async () => {
      if (mounted) {
        await refreshAgenda();
      }
    };

    loadEventos();
    window.addEventListener("agendaUpdated", handleAgendaUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("agendaUpdated", handleAgendaUpdated);
    };
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Evento[]>();

    for (const evento of eventos) {
      const start = parseLocalDate(evento.fecha);
      const end = evento.fecha_fin ? parseLocalDate(evento.fecha_fin) : start;
      const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      for (let offset = 0; offset <= days; offset += 1) {
        const day = addDays(start, offset);
        const key = toDateKey(day);
        const list = map.get(key) || [];
        list.push(evento);
        map.set(key, list);
      }
    }

    return map;
  }, [eventos]);

  const calendarDays = useMemo(() => {
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstWeekday = (first.getDay() + 6) % 7;
    const start = addDays(first, -firstWeekday);

    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [currentMonth]);

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = eventsByDay.get(selectedKey) || [];

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

  if (loading) {
    return (
      <section className="mx-auto mt-8 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
        <p className="text-sm font-semibold text-slate-500">Cargando eventos del calendario...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-900/5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold capitalize text-brand-brown sm:text-2xl">{monthLabel(currentMonth)}</h2>
          <p className="text-sm text-slate-500">Vista mensual con los mismos eventos de la agenda</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={() =>
              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
            }
          >
            Mes anterior
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={() =>
              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
            }
          >
            Mes siguiente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 rounded-xl bg-slate-50 p-2 text-center text-xs font-black uppercase tracking-wide text-slate-500">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const key = toDateKey(day);
          const list = eventsByDay.get(key) || [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = key === toDateKey(new Date());
          const isSelected = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(day)}
              className={`min-h-[92px] rounded-xl border p-2 text-left transition ${
                isSelected
                  ? "border-brand-gold bg-amber-50"
                  : "border-slate-200 bg-white hover:border-brand-gold/50"
              } ${isCurrentMonth ? "opacity-100" : "opacity-45"}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isToday ? "rounded-full bg-brand-brown px-2 py-0.5 text-white" : "text-slate-600"
                  }`}
                >
                  {day.getDate()}
                </span>
                {list.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">{list.length}</span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {list.slice(0, 2).map((evento, idx) => (
                  <div
                    key={`${evento.id || idx}-${idx}`}
                    className="flex items-center gap-1.5 rounded bg-slate-50 px-1.5 py-1"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${COLOR_MAP[evento.color || ""] || "bg-brand-gold"}`} />
                    <span className="line-clamp-1 text-[10px] font-semibold text-slate-700">{evento.evento}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <h3 className="text-sm font-black uppercase tracking-wide text-brand-brown">{dayLabel(selectedDate)}</h3>
        {selectedEvents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No hay eventos para este día.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedEvents.map((evento, idx) => (
              <li
                key={`${evento.id || idx}-detail-${idx}`}
                onClick={() => openModal(evento)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openModal(evento);
                  }
                }}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-gold/50"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${COLOR_MAP[evento.color || ""] || "bg-brand-gold"}`} />
                  <p className="font-bold text-brand-brown">{evento.evento}</p>
                </div>
                {evento.descripcion && (
                  <p className="mt-1 text-sm text-slate-600">{evento.descripcion}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isMounted && isModalOpen && selectedEvento && createPortal(
        <div className="fixed inset-0 z-[999] flex min-h-screen items-center justify-center bg-black/45 p-4" onClick={closeModal}>
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-brand-gold/30 bg-white p-5 shadow-2xl"
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
    </section>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "@/app/hooks/use-session";

// Vista completa del calendario: muestra el mes, distribuye eventos por día y abre un modal de detalle.
interface Evento {
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

const formatHorarioResumen = (evento: Evento) => {
  if (evento.todo_el_dia !== false) return "Todo el día";
  const inicio = evento.hora_inicio?.trim();
  const fin = evento.hora_fin?.trim();
  if (inicio && fin) return `${inicio} - ${fin}`;
  if (inicio) return `Desde ${inicio}`;
  if (fin) return `Hasta ${fin}`;
  return "Horario a confirmar";
};

const sortEventos = (list: Evento[]) =>
  [...list].sort((a, b) => {
    const aAllDay = a.todo_el_dia !== false;
    const bAllDay = b.todo_el_dia !== false;
    if (aAllDay !== bAllDay) return aAllDay ? -1 : 1;

    const aTime = (a.hora_inicio || "99:99").trim();
    const bTime = (b.hora_inicio || "99:99").trim();
    if (aTime !== bTime) return aTime.localeCompare(bTime);

    return (a.evento || "").localeCompare(b.evento || "", "es", { sensitivity: "base" });
  });

export default function CalendarioEventosView() {
  const { isAdmin } = useSession();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [isCreatingFromDay, setIsCreatingFromDay] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<Evento>({
    fecha: "",
    fecha_fin: "",
    evento: "",
    descripcion: "",
    color: "11",
    hora_inicio: "",
    hora_fin: "",
    todo_el_dia: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<Evento>({
    fecha: "",
    fecha_fin: "",
    evento: "",
    descripcion: "",
    color: "11",
    hora_inicio: "",
    hora_fin: "",
    todo_el_dia: true,
  });

  const refreshAgenda = async () => {
    try {
      // Releemos la agenda completa para que el calendario mensual quede sincronizado.
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
        // Carga inicial del calendario desde la API centralizada.
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
    // Agrupamos los eventos por día para poder pintarlos dentro de cada casillero del mes.
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
  const selectedEventsRaw = eventsByDay.get(selectedKey) || [];
  const dayModalEventsRaw = dayModalDate ? eventsByDay.get(toDateKey(dayModalDate)) || [] : [];

  const filterByColor = (list: Evento[]) => {
    if (colorFilter === "all") return list;
    return list.filter((evento) => String(evento.color || "") === colorFilter);
  };

  const selectedEvents = sortEventos(filterByColor(selectedEventsRaw));
  const dayModalEvents = sortEventos(filterByColor(dayModalEventsRaw));

  const openDayModal = (day: Date) => {
    const dayKey = toDateKey(day);
    setSelectedDate(day);
    setDayModalDate(day);
    setCreateForm((prev) => ({
      ...prev,
      fecha: dayKey,
      fecha_fin: dayKey,
      evento: "",
      descripcion: "",
      hora_inicio: "",
      hora_fin: "",
      todo_el_dia: true,
    }));
    setIsCreatingFromDay(false);
    setIsDayModalOpen(true);
  };

  const closeDayModal = () => {
    setIsDayModalOpen(false);
    setDayModalDate(null);
    setIsCreatingFromDay(false);
  };

  const handleCreateEventFromDay = async () => {
    if (!createForm.evento?.trim() || !createForm.fecha?.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: createForm.evento.trim(),
          fecha: createForm.fecha,
          fecha_fin: createForm.fecha_fin || undefined,
          color: createForm.color || undefined,
          descripcion: (createForm.descripcion || "").trim(),
          hora_inicio: createForm.todo_el_dia === false ? createForm.hora_inicio || undefined : undefined,
          hora_fin: createForm.todo_el_dia === false ? createForm.hora_fin || undefined : undefined,
          todo_el_dia: createForm.todo_el_dia !== false,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo crear el evento");
      }

      await refreshAgenda();
      window.dispatchEvent(new Event("agendaUpdated"));
      setIsCreatingFromDay(false);
      setCreateForm((prev) => ({
        ...prev,
        evento: "",
        descripcion: "",
        hora_inicio: "",
        hora_fin: "",
        todo_el_dia: true,
      }));
    } catch (error) {
      console.error(error);
      alert("No se pudo crear el evento.");
    } finally {
      setIsCreating(false);
    }
  };

  const openModal = (evento: Evento) => {
    // El modal permite ver el detalle y, si hay permisos, editar o borrar el evento.
    setSelectedEvento(evento);
    setEditForm({
      id: evento.id,
      fecha: evento.fecha,
      fecha_fin: evento.fecha_fin || "",
      evento: evento.evento,
      descripcion: evento.descripcion || "",
      color: evento.color || "11",
      hora_inicio: evento.hora_inicio || "",
      hora_fin: evento.hora_fin || "",
      todo_el_dia: evento.todo_el_dia !== false,
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
          descripcion: (editForm.descripcion ?? "").trim(),
          hora_inicio: editForm.todo_el_dia === false ? editForm.hora_inicio || undefined : undefined,
          hora_fin: editForm.todo_el_dia === false ? editForm.hora_fin || undefined : undefined,
          todo_el_dia: editForm.todo_el_dia !== false,
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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={colorFilter}
            onChange={(event) => setColorFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <option value="all">Todos los colores</option>
            {COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
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
          const list = sortEventos(filterByColor(eventsByDay.get(key) || []));
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = key === toDateKey(new Date());
          const isSelected = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => openDayModal(day)}
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
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {formatHorarioResumen(selectedEvento)}
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
                <label className="flex items-center gap-2 rounded-md border border-amber-200 bg-white p-2.5">
                  <input
                    type="checkbox"
                    checked={editForm.todo_el_dia !== false}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        todo_el_dia: event.target.checked,
                        hora_inicio: event.target.checked ? "" : editForm.hora_inicio,
                        hora_fin: event.target.checked ? "" : editForm.hora_fin,
                      })
                    }
                  />
                  <span className="text-sm font-semibold text-brand-brown">Todo el día</span>
                </label>
                {editForm.todo_el_dia === false && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={editForm.hora_inicio || ""}
                      onChange={(event) => setEditForm({ ...editForm, hora_inicio: event.target.value })}
                      className="rounded-md border border-amber-200 p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                    <input
                      type="time"
                      value={editForm.hora_fin || ""}
                      onChange={(event) => setEditForm({ ...editForm, hora_fin: event.target.value })}
                      className="rounded-md border border-amber-200 p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                )}
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

      {isMounted && isDayModalOpen && dayModalDate && createPortal(
        <div className="fixed inset-0 z-[995] flex min-h-screen items-center justify-center bg-black/45 p-4" onClick={closeDayModal}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-brand-gold/30 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xl font-extrabold text-brand-brown">Eventos del día</h4>
                <p className="mt-1 text-sm font-semibold text-slate-600">{dayLabel(dayModalDate)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingFromDay((prev) => !prev)}
                    className="rounded-lg border border-brand-gold/40 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-brand-brown transition hover:bg-amber-100"
                  >
                    {isCreatingFromDay ? "Cancelar alta" : "Nuevo evento"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDayModal}
                  className="rounded-full bg-slate-100 px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Cerrar eventos del día"
                >
                  ✕
                </button>
              </div>
            </div>

            {isAdmin && isCreatingFromDay && (
              <div className="mb-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <input
                  type="text"
                  value={createForm.evento || ""}
                  onChange={(event) => setCreateForm({ ...createForm, evento: event.target.value })}
                  placeholder="Nombre del evento"
                  className="w-full rounded-md border border-amber-200 bg-white p-2.5 font-semibold text-brand-brown outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <textarea
                  value={createForm.descripcion || ""}
                  onChange={(event) => setCreateForm({ ...createForm, descripcion: event.target.value })}
                  rows={3}
                  placeholder="Descripción"
                  className="w-full resize-none rounded-md border border-amber-200 bg-white p-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={createForm.fecha || ""}
                    onChange={(event) => setCreateForm({ ...createForm, fecha: event.target.value })}
                    className="rounded-md border border-amber-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <input
                    type="date"
                    value={createForm.fecha_fin || ""}
                    onChange={(event) => setCreateForm({ ...createForm, fecha_fin: event.target.value })}
                    className="rounded-md border border-amber-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-md border border-amber-200 bg-white p-2.5">
                  <input
                    type="checkbox"
                    checked={createForm.todo_el_dia !== false}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        todo_el_dia: event.target.checked,
                        hora_inicio: event.target.checked ? "" : createForm.hora_inicio,
                        hora_fin: event.target.checked ? "" : createForm.hora_fin,
                      })
                    }
                  />
                  <span className="text-sm font-semibold text-brand-brown">Todo el día</span>
                </label>
                {createForm.todo_el_dia === false && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={createForm.hora_inicio || ""}
                      onChange={(event) => setCreateForm({ ...createForm, hora_inicio: event.target.value })}
                      className="rounded-md border border-amber-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                    <input
                      type="time"
                      value={createForm.hora_fin || ""}
                      onChange={(event) => setCreateForm({ ...createForm, hora_fin: event.target.value })}
                      className="rounded-md border border-amber-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                  </div>
                )}
                <select
                  value={createForm.color || "11"}
                  onChange={(event) => setCreateForm({ ...createForm, color: event.target.value })}
                  className="w-full rounded-md border border-amber-200 bg-white p-2.5 font-semibold text-brand-brown outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  {COLOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={handleCreateEventFromDay}
                    className="rounded-lg bg-brand-brown px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-900 disabled:opacity-50"
                  >
                    {isCreating ? "Guardando..." : "Crear evento"}
                  </button>
                </div>
              </div>
            )}

            {dayModalEvents.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No hay eventos para este día.</p>
            ) : (
              <ul className="space-y-3">
                {dayModalEvents.map((evento, idx) => (
                  <li
                    key={`${evento.id || idx}-day-modal-${idx}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${COLOR_MAP[evento.color || ""] || "bg-brand-gold"}`} />
                          <p className="font-bold text-brand-brown">{evento.evento}</p>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatFechaCorta(parseLocalDate(evento.fecha))}
                          {evento.fecha_fin && evento.fecha_fin !== evento.fecha
                            ? ` — ${formatFechaCorta(parseLocalDate(evento.fecha_fin))}`
                            : ""}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatHorarioResumen(evento)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          closeDayModal();
                          openModal(evento);
                        }}
                        className="rounded-lg border border-brand-gold/40 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-brand-brown transition hover:bg-amber-100"
                      >
                        Ver detalle
                      </button>
                    </div>

                    <p className="mt-3 rounded-lg bg-amber-50/50 p-3 text-sm leading-relaxed text-slate-700">
                      {evento.descripcion?.trim() || "Sin descripción."}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useSession } from "@/app/hooks/use-session";
import { DeleteConfirmModal } from "@/app/components/common/delete-confirm-modal";
import { InscripcionConfigPanel } from "@/app/components/common/inscripcion-config-panel";

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
  /** Si está tildado, el evento avisa al celular antes de la fecha. */
  notificar?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  "11": "bg-red-500",
  "6": "bg-orange-500",
  "5": "bg-amber-500",
  "2": "bg-emerald-500",
  "7": "bg-blue-500",
  "8": "bg-slate-500",
};

// Cómo se pinta el nombre de un evento dentro del casillero del día, según su color.
const PILL_MAP: Record<string, string> = {
  "11": "bg-red-100 text-red-950",
  "6": "bg-orange-100 text-orange-950",
  "5": "bg-amber-100 text-amber-950",
  "2": "bg-emerald-100 text-emerald-950",
  "7": "bg-blue-100 text-blue-950",
  "8": "bg-slate-200 text-slate-900",
};
const PILL_DEFAULT = "bg-yellow-100 text-brand-deep";

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

// Lo que dura casi todo un mes ("Mes de las Misiones", "Mes de María") no es de un día en particular:
// se muestra una sola vez, arriba del mes, en lugar de repetirse en cada casillero.
const DIAS_PARA_SER_DEL_MES = 20;
const esDelMes = (evento: Evento) => {
  if (!evento.fecha_fin) return false;
  const dias = Math.round((parseLocalDate(evento.fecha_fin).getTime() - parseLocalDate(evento.fecha).getTime()) / 86_400_000) + 1;
  return dias >= DIAS_PARA_SER_DEL_MES;
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
      if (esDelMes(evento)) continue;
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
  const dayModalEventsRaw = dayModalDate ? eventsByDay.get(toDateKey(dayModalDate)) || [] : [];

  const filterByColor = (list: Evento[]) => {
    if (colorFilter === "all") return list;
    return list.filter((evento) => String(evento.color || "") === colorFilter);
  };

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
          notificar: createForm.notificar === true,
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
        notificar: false,
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
      notificar: evento.notificar === true,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvento(null);
    setIsEditing(false);
    setDeleteConfirmOpen(false);
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
          notificar: editForm.notificar === true,
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
      setDeleteConfirmOpen(false);
      closeModal();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el evento.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Lo que pasa en el mes que se está mirando.
  const primerDia = toDateKey(currentMonth);
  const ultimoDia = toDateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const enEsteMes = eventos.filter((evento) => evento.fecha.slice(0, 10) <= ultimoDia && (evento.fecha_fin || evento.fecha).slice(0, 10) >= primerDia);
  const delMes = filterByColor(enEsteMes.filter(esDelMes));
  const eventosDelMes = filterByColor(enEsteMes.filter((evento) => !esDelMes(evento))).sort((x, y) => x.fecha.localeCompare(y.fecha) || (x.hora_inicio || "").localeCompare(y.hora_inicio || ""));
  // Solo se ofrecen para filtrar los colores que aparecen en este mes.
  const coloresDelMes = COLOR_OPTIONS.filter((option) => enEsteMes.some((evento) => String(evento.color || "") === option.value));
  const hoyKey = toDateKey(new Date());
  const esMesActual = hoyKey.slice(0, 7) === primerDia.slice(0, 7);
  const cambiarMes = (pasos: number) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + pasos, 1));

  const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown";
  const FLECHA = `flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-deep shadow-[0_8px_16px_-12px_rgba(58,21,8,0.8)] transition-colors hover:bg-brand-deep hover:text-white ${FOCO}`;

  if (loading) {
    return (
      <section aria-busy="true" className="mx-auto mt-8 w-full max-w-6xl">
        <div className="h-10 w-56 rounded-xl bg-brand-brown/10 motion-safe:animate-pulse" />
        <div className="mt-5 h-[28rem] rounded-[26px] bg-brand-brown/10 motion-safe:animate-pulse" />
        <p className="sr-only">Cargando el calendario…</p>
      </section>
    );
  }

  return (
    <section aria-label="Calendario del mes" className="mx-auto mt-8 w-full max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 aria-live="polite" className="m-0 text-left font-display text-[clamp(2rem,6vw,3.25rem)] font-extrabold leading-none tracking-[-0.03em] text-brand-ink first-letter:uppercase">
          {monthLabel(currentMonth)}
        </h2>
        <div className="flex items-center gap-2">
          {!esMesActual && (
            <button type="button" onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className={`rounded-full border border-brand-brown/25 px-4 py-2.5 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white ${FOCO}`}>
              Volver a hoy
            </button>
          )}
          <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className={FLECHA}><ChevronLeft size={22} aria-hidden /></button>
          <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className={FLECHA}><ChevronRight size={22} aria-hidden /></button>
        </div>
      </div>

      {/* Lo que dura todo el mes va una sola vez, acá arriba. */}
      {delMes.length > 0 && (
        <ul className="m-0 mt-5 flex list-none flex-col gap-2 p-0">
          {delMes.map((evento, idx) => (
            <li key={`${evento.id || idx}-mes`}>
              <button type="button" onClick={() => openModal(evento)} className={`group flex w-full items-center gap-4 rounded-[22px] bg-yellow-400 px-5 py-4 text-left text-brand-deep transition-transform duration-300 ease-out hover:-translate-y-0.5 motion-reduce:transform-none ${FOCO}`}>
                <span aria-hidden className="flex h-11 w-11 shrink-0 -rotate-6 items-center justify-center rounded-xl bg-brand-deep text-yellow-400 transition-transform duration-300 ease-out group-hover:rotate-0 motion-reduce:transform-none">
                  <Sparkles size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-brand-deep/80">Durante todo el mes</span>
                  <span className="block font-display text-xl font-extrabold leading-tight sm:text-2xl">{evento.evento}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {coloresDelMes.length > 1 && (
        <div role="group" aria-label="Filtrar por color" className="mt-5 flex flex-wrap gap-2">
          {[{ value: "all", label: "Todos" }, ...coloresDelMes].map((option) => {
            const activo = colorFilter === option.value;
            return (
              <button key={option.value} type="button" aria-pressed={activo} onClick={() => setColorFilter(option.value)} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${FOCO} ${activo ? "bg-brand-deep text-white" : "bg-white text-brand-ink hover:bg-brand-cream"}`}>
                {option.value !== "all" && <span aria-hidden className={`h-3 w-3 rounded-full ${COLOR_MAP[option.value]}`} />}
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-[26px] bg-white p-2 shadow-[0_22px_40px_-28px_rgba(58,21,8,0.7)] sm:p-4">
        <div aria-hidden className="grid grid-cols-7 pb-2 text-center text-xs font-extrabold text-brand-ink/65 sm:text-sm">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia) => <span key={dia}>{dia}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((day) => {
            const key = toDateKey(day);
            const list = sortEventos(filterByColor(eventsByDay.get(key) || []));
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = key === hoyKey;
            const isSelected = key === selectedKey;
            const finDeSemana = day.getDay() === 0 || day.getDay() === 6;

            return (
              <button
                key={key}
                type="button"
                onClick={() => openDayModal(day)}
                aria-label={`${dayLabel(day)}: ${list.length === 0 ? "sin eventos" : list.map((evento) => evento.evento).join(", ")}`}
                className={`flex min-h-[64px] flex-col rounded-xl p-1.5 text-left transition-colors sm:min-h-[104px] sm:p-2 ${FOCO} ${
                  isSelected ? "bg-yellow-100 ring-2 ring-brand-gold" : finDeSemana ? "bg-brand-cream hover:bg-yellow-100" : "bg-brand-paper hover:bg-yellow-100"
                } ${isCurrentMonth ? "" : "opacity-40"}`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold tabular-nums ${isToday ? "bg-brand-deep text-white" : "text-brand-ink"}`}>
                  {day.getDate()}
                </span>
                {/* En el celular no entra el nombre: se ve un punto por evento y el detalle está en la lista de abajo. */}
                <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                  {list.slice(0, 4).map((evento, idx) => (
                    <span key={`${evento.id || idx}-punto`} className={`h-2 w-2 rounded-full ${COLOR_MAP[evento.color || ""] || "bg-brand-gold"}`} />
                  ))}
                </span>
                <span className="mt-1.5 hidden w-full flex-col gap-1 sm:flex">
                  {list.slice(0, 2).map((evento, idx) => (
                    <span key={`${evento.id || idx}-${idx}`} className={`line-clamp-2 rounded-md px-1.5 py-1 text-xs font-bold leading-tight ${PILL_MAP[evento.color || ""] || PILL_DEFAULT}`}>
                      {evento.evento}
                    </span>
                  ))}
                  {list.length > 2 && <span className="px-1.5 text-xs font-bold text-brand-ink/65">y {list.length - 2} más</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <h3 className="m-0 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink sm:text-3xl">Lo que pasa este mes</h3>
        {eventosDelMes.length === 0 ? (
          <p className="m-0 mt-4 max-w-none rounded-2xl border border-dashed border-brand-brown/25 px-5 py-9 text-center text-base text-brand-ink/70">
            {colorFilter === "all" ? "No hay nada cargado para este mes." : "No hay eventos de ese color este mes."}
          </p>
        ) : (
          <ul className="m-0 mt-4 grid list-none gap-3 p-0 md:grid-cols-2">
            {eventosDelMes.map((evento, idx) => {
              const inicio = parseLocalDate(evento.fecha);
              const fin = evento.fecha_fin && evento.fecha_fin !== evento.fecha ? parseLocalDate(evento.fecha_fin) : null;
              const pasado = (evento.fecha_fin || evento.fecha).slice(0, 10) < hoyKey;
              return (
                <li key={`${evento.id || idx}-lista`}>
                  <button type="button" onClick={() => openModal(evento)} className={`group flex h-full w-full items-start gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_14px_28px_-22px_rgba(58,21,8,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:transform-none ${FOCO} ${pasado ? "opacity-60" : ""}`}>
                    <span className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${["11", "7", "8", "2"].includes(evento.color || "") ? "text-white" : "text-brand-deep"} ${COLOR_MAP[evento.color || ""] || "bg-brand-gold"}`}>
                      <span className="font-display text-xl font-extrabold leading-none tabular-nums">{inicio.getDate()}</span>
                      <span className="text-[11px] font-bold uppercase leading-tight">{inicio.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg font-extrabold leading-snug text-brand-ink">{evento.evento}</span>
                      <span className="mt-0.5 block text-sm font-medium text-brand-ink/70 first-letter:uppercase">
                        {fin ? `Del ${inicio.toLocaleDateString("es-AR", inicio.getMonth() === fin.getMonth() ? { day: "numeric" } : { day: "numeric", month: "long" })} al ${fin.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}` : inicio.toLocaleDateString("es-AR", { weekday: "long" })}
                        {evento.todo_el_dia === false && ` · ${formatHorarioResumen(evento)}`}
                      </span>
                      {evento.descripcion?.trim() && <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-brand-ink/75">{evento.descripcion}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isMounted && isModalOpen && selectedEvento && createPortal(
        <div className="modal-overlay-unified z-[999] min-h-screen" onClick={closeModal}>
          <div
            className="modal-panel-unified max-h-[90vh] w-full max-w-xl overflow-y-auto p-5"
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
                className="modal-close-unified"
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
                      className="modal-btn-primary-unified"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setDeleteConfirmOpen(true)}
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
                  className="modal-input-unified"
                />
                <textarea
                  value={editForm.descripcion || ""}
                  onChange={(event) => setEditForm({ ...editForm, descripcion: event.target.value })}
                  rows={4}
                  className="modal-input-unified resize-none"
                  placeholder="Descripción"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={editForm.fecha || ""}
                    onChange={(event) => setEditForm({ ...editForm, fecha: event.target.value })}
                    className="modal-input-unified"
                  />
                  <input
                    type="date"
                    value={editForm.fecha_fin || ""}
                    onChange={(event) => setEditForm({ ...editForm, fecha_fin: event.target.value })}
                    className="modal-input-unified"
                  />
                </div>
                <label className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={editForm.notificar === true}
                    onChange={(event) => setEditForm({ ...editForm, notificar: event.target.checked })}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-stone-700">Activar notificaciones</span>
                    <span className="block text-xs text-stone-500">Avisa al celular 7 días antes, el día anterior y el mismo día.</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2.5">
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
                  <span className="text-sm font-semibold text-stone-700">Todo el día</span>
                </label>
                {editForm.todo_el_dia === false && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={editForm.hora_inicio || ""}
                      onChange={(event) => setEditForm({ ...editForm, hora_inicio: event.target.value })}
                      className="modal-input-unified"
                    />
                    <input
                      type="time"
                      value={editForm.hora_fin || ""}
                      onChange={(event) => setEditForm({ ...editForm, hora_fin: event.target.value })}
                      className="modal-input-unified"
                    />
                  </div>
                )}
                <select
                  value={editForm.color || "11"}
                  onChange={(event) => setEditForm({ ...editForm, color: event.target.value })}
                  className="modal-input-unified"
                >
                  {COLOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="modal-actions-unified">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveEdit}
                    className="modal-btn-primary-unified"
                  >
                    {isSaving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="modal-btn-secondary-unified"
                  >
                    Cancelar
                  </button>
                </div>

                {selectedEvento.id !== undefined && selectedEvento.id !== null && (
                  <div className="pt-3">
                    <InscripcionConfigPanel eventoId={selectedEvento.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {isMounted && isDayModalOpen && dayModalDate && createPortal(
        <div className="modal-overlay-unified z-[995] min-h-screen" onClick={closeDayModal}>
          <div
            className="modal-panel-unified max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5"
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
                  className="modal-close-unified"
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
                  className="modal-input-unified bg-white"
                />
                <textarea
                  value={createForm.descripcion || ""}
                  onChange={(event) => setCreateForm({ ...createForm, descripcion: event.target.value })}
                  rows={3}
                  placeholder="Descripción"
                  className="modal-input-unified resize-none bg-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={createForm.fecha || ""}
                    onChange={(event) => setCreateForm({ ...createForm, fecha: event.target.value })}
                    className="modal-input-unified bg-white"
                  />
                  <input
                    type="date"
                    value={createForm.fecha_fin || ""}
                    onChange={(event) => setCreateForm({ ...createForm, fecha_fin: event.target.value })}
                    className="modal-input-unified bg-white"
                  />
                </div>
                <label className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-2.5">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={createForm.notificar === true}
                    onChange={(event) => setCreateForm({ ...createForm, notificar: event.target.checked })}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-stone-700">Activar notificaciones</span>
                    <span className="block text-xs text-stone-500">Avisa al celular 7 días antes, el día anterior y el mismo día.</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2.5">
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
                  <span className="text-sm font-semibold text-stone-700">Todo el día</span>
                </label>
                {createForm.todo_el_dia === false && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={createForm.hora_inicio || ""}
                      onChange={(event) => setCreateForm({ ...createForm, hora_inicio: event.target.value })}
                      className="modal-input-unified bg-white"
                    />
                    <input
                      type="time"
                      value={createForm.hora_fin || ""}
                      onChange={(event) => setCreateForm({ ...createForm, hora_fin: event.target.value })}
                      className="modal-input-unified bg-white"
                    />
                  </div>
                )}
                <select
                  value={createForm.color || "11"}
                  onChange={(event) => setCreateForm({ ...createForm, color: event.target.value })}
                  className="modal-input-unified bg-white"
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
                    className="modal-btn-primary-unified"
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

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        title="Eliminar evento"
        itemName={selectedEvento?.evento || 'evento seleccionado'}
        busy={isDeleting}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          handleDeleteFromModal().catch(() => undefined);
        }}
      />
    </section>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";

// Datos del evento (nombre, descripción, fechas y horario), editables desde el panel de
// inscripciones. Es el mismo evento del calendario: lo que se guarda acá se ve allá.

type Evento = {
  id: string | number;
  evento: string;
  fecha: string;
  fecha_fin?: string;
  color?: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  todo_el_dia?: boolean;
};

const inputClass = "modal-input-unified";
const labelClass = "block text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 mb-1.5";

export function EventoDetalles({ eventoId }: { eventoId: string }) {
  const router = useRouter();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/agenda", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        const found = Array.isArray(data) ? (data as Evento[]).find((item) => String(item.id) === eventoId) : null;
        if (!response.ok || !found) throw new Error("No se pudo cargar el evento.");
        setEvento({ ...found, fecha: found.fecha.slice(0, 10), fecha_fin: found.fecha_fin?.slice(0, 10) });
      })
      .catch((error) => { if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo cargar el evento." }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventoId]);

  const patch = (changes: Partial<Evento>) => { setEvento((prev) => (prev ? { ...prev, ...changes } : prev)); setMessage(null); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!evento) return;
    if (evento.fecha_fin && evento.fecha_fin < evento.fecha) {
      setMessage({ type: "error", text: "La fecha de fin no puede ser anterior a la de inicio." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/agenda", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: evento.id,
          evento: evento.evento.trim(),
          fecha: evento.fecha,
          fecha_fin: evento.fecha_fin || undefined,
          color: evento.color || undefined,
          descripcion: (evento.descripcion ?? "").trim(),
          hora_inicio: evento.todo_el_dia === false ? evento.hora_inicio || undefined : undefined,
          hora_fin: evento.todo_el_dia === false ? evento.hora_fin || undefined : undefined,
          todo_el_dia: evento.todo_el_dia !== false,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el evento.");
      setMessage({ type: "ok", text: "Evento guardado." });
      router.refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar el evento." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-brand-brown">
        <CalendarDays size={14} aria-hidden /> Datos del evento
      </h2>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-stone-500"><Loader2 size={16} className="animate-spin" /> Cargando…</p>
      ) : !evento ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message?.text ?? "No se pudo cargar el evento."}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="evento-nombre" className={labelClass}>Nombre</label>
            <input id="evento-nombre" className={inputClass} value={evento.evento} onChange={(e) => patch({ evento: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="evento-descripcion" className={labelClass}>Descripción</label>
            <textarea id="evento-descripcion" className={`${inputClass} resize-y`} rows={4} value={evento.descripcion ?? ""} onChange={(e) => patch({ descripcion: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="evento-fecha" className={labelClass}>Empieza</label>
              <input id="evento-fecha" type="date" className={inputClass} value={evento.fecha} onChange={(e) => patch({ fecha: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="evento-fecha-fin" className={labelClass}>Termina (opcional)</label>
              <input id="evento-fecha-fin" type="date" className={inputClass} value={evento.fecha_fin ?? ""} min={evento.fecha} onChange={(e) => patch({ fecha_fin: e.target.value })} />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 rounded-md border-stone-300 accent-brand-brown" checked={evento.todo_el_dia !== false} onChange={(e) => patch({ todo_el_dia: e.target.checked })} />
            <span className="text-sm font-bold text-stone-700">Todo el día</span>
          </label>
          {evento.todo_el_dia === false && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="evento-hora-inicio" className={labelClass}>Hora de inicio</label>
                <input id="evento-hora-inicio" type="time" className={inputClass} value={evento.hora_inicio ?? ""} onChange={(e) => patch({ hora_inicio: e.target.value })} />
              </div>
              <div>
                <label htmlFor="evento-hora-fin" className={labelClass}>Hora de fin</label>
                <input id="evento-hora-fin" type="time" className={inputClass} value={evento.hora_fin ?? ""} onChange={(e) => patch({ hora_fin: e.target.value })} />
              </div>
            </div>
          )}

          {message && (
            <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {message.text}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            Guardar evento
          </button>
        </form>
      )}
    </section>
  );
}

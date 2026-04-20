"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/use-session";

interface Evento {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
}

const COLOR_OPTIONS = [
  { value: "11", label: "Rojo" },
  { value: "6", label: "Naranja" },
  { value: "5", label: "Amarillo" },
  { value: "2", label: "Verde" },
  { value: "7", label: "Azul" },
  { value: "8", label: "Gris" },
];

interface AgendaAdminProps {
  eventosVisibles: Evento[];
  eventosFuturos: Evento[];
  onEventoCreated?: () => void;
}

export default function AgendaAdmin({ eventosVisibles, eventosFuturos, onEventoCreated }: AgendaAdminProps) {
  const { user, isLoading } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todosEventos, setTodosEventos] = useState<Evento[]>([]);

  const [formData, setFormData] = useState<Evento>({
    fecha: "",
    evento: "",
    fecha_fin: "",
    color: "11",
    descripcion: "",
  });

  // Sincronizar y ordenar eventos por fecha
  useEffect(() => {
    const combinados = [...eventosVisibles, ...eventosFuturos].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    setTodosEventos(combinados);
  }, [eventosVisibles, eventosFuturos]);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("agendaAdminToggle", handleToggle);
    return () => window.removeEventListener("agendaAdminToggle", handleToggle);
  }, []);

  const refreshEventos = async () => {
    try {
      const response = await fetch("/api/agenda");
      if (response.ok) {
        const eventos: Evento[] = await response.json();
        setTodosEventos(eventos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()));
      }
    } catch (error) {
      console.error("Error al refrescar:", error);
    }
  };

  if (isLoading || !user || user.role !== "admin") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fecha_fin && formData.fecha_fin < formData.fecha) {
      alert("La fecha de fin no puede ser anterior al inicio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const response = await fetch("/api/agenda", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (response.ok) {
        setFormData({ fecha: "", evento: "", fecha_fin: "", color: "11", descripcion: "" });
        setIsAdding(false);
        setEditingId(null);
        await refreshEventos();
        window.dispatchEvent(new Event("agendaUpdated"));
        onEventoCreated?.();
      }
    } catch (error) {
      alert("Error al guardar el evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return;
    try {
      const response = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setTodosEventos(prev => prev.filter(e => e.id !== id));
        window.dispatchEvent(new Event("agendaUpdated"));
      }
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="mb-6 font-sans">
      {isOpen && (
        <div className="bg-white rounded-xl border-2 border-brand-gold/30 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-brand-brown to-amber-800 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
              <span>📅</span> Gestión de Agenda
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-amber-200 transition-colors">✕</button>
          </div>

          <div className="p-5">
            {/* Formulario */}
            {(isAdding || editingId) ? (
              <form onSubmit={handleSubmit} className="mb-6 bg-amber-50 p-4 rounded-lg border border-brand-gold/20 space-y-4">
                <h4 className="text-brand-brown font-bold text-sm uppercase tracking-wider">
                  {editingId ? "Editar Evento" : "Nuevo Evento"}
                </h4>
                <input
                  type="text"
                  placeholder="Nombre del evento..."
                  className="w-full p-2.5 rounded-md border border-amber-200 focus:ring-2 focus:ring-brand-gold outline-none"
                  value={formData.evento}
                  onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Descripción (opcional)..."
                  className="w-full resize-none rounded-md border border-amber-200 p-2.5 focus:ring-2 focus:ring-brand-gold outline-none"
                  rows={3}
                  value={formData.descripcion || ""}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="p-2.5 rounded-md border border-amber-200 focus:ring-2 focus:ring-brand-gold outline-none"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    className="p-2.5 rounded-md border border-amber-200 focus:ring-2 focus:ring-brand-gold outline-none"
                    value={formData.fecha_fin || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-brown">
                    Color del evento
                  </label>
                  <select
                    className="w-full rounded-md border border-amber-200 bg-white p-2.5 font-semibold text-brand-brown focus:ring-2 focus:ring-brand-gold outline-none"
                    value={formData.color || "11"}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-gold text-white py-2 rounded-md font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Guardando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      setFormData({ fecha: "", evento: "", fecha_fin: "", color: "11", descripcion: "" });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full mb-6 py-3 border-2 border-dashed border-brand-gold/40 text-brand-brown rounded-lg font-bold hover:bg-amber-50 hover:border-brand-gold transition-all"
              >
                + Agregar Nuevo Evento
              </button>
            )}

            {/* Lista de Gestión */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {todosEventos.map((ev) => (
                <div key={ev.id} className="group flex items-center justify-between p-3 rounded-lg border border-amber-100 bg-white hover:border-brand-gold transition-all">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-brand-brown">{ev.evento}</span>
                    {ev.descripcion && (
                      <span className="text-xs text-slate-500 line-clamp-1">{ev.descripcion}</span>
                    )}
                    <span className="text-xs text-gray-500">{ev.fecha} {ev.fecha_fin ? ` al ${ev.fecha_fin}` : ""}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(ev.id!); setFormData(ev); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id!)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
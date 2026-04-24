"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/use-session";
import { X, Calendar, Plus, Trash2, Pencil, Clock, Palette, AlertCircle, Loader2 } from "lucide-react";

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

const COLOR_OPTIONS = [
  { value: "11", label: "Rojo", hex: "#ef4444" },
  { value: "6", label: "Naranja", hex: "#f97316" },
  { value: "5", label: "Amarillo", hex: "#eab308" },
  { value: "2", label: "Verde", hex: "#22c55e" },
  { value: "7", label: "Azul", hex: "#3b82f6" },
  { value: "8", label: "Gris", hex: "#64748b" },
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
    hora_inicio: "",
    hora_fin: "",
    todo_el_dia: true,
  });

  useEffect(() => {
    const combinados = [...eventosVisibles, ...eventosFuturos].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    setTodosEventos(combinados);
  }, [eventosVisibles, eventosFuturos]);

  useEffect(() => {
    const handleToggle = () => {
        setIsOpen(true);
        setIsAdding(false);
        setEditingId(null);
    };
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
      const payload = editingId 
        ? { id: editingId, ...formData, 
            hora_inicio: formData.todo_el_dia ? undefined : formData.hora_inicio,
            hora_fin: formData.todo_el_dia ? undefined : formData.hora_fin,
          }
        : formData;

      const response = await fetch("/api/agenda", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
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

  const resetForm = () => {
    setFormData({ fecha: "", evento: "", fecha_fin: "", color: "11", descripcion: "", hora_inicio: "", hora_fin: "", todo_el_dia: true });
    setIsAdding(false);
    setEditingId(null);
  }

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

  const inputClass = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 mb-1.5";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transform transition-all">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-3 text-brand-brown">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-100">
                  <Calendar size={22} />
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">Gestión de Agenda</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* Formulario Estilo Formación */}
              {(isAdding || editingId) ? (
                <form onSubmit={handleSubmit} className="mb-8 space-y-5 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-brand-brown uppercase tracking-widest flex items-center gap-2">
                      {editingId ? <Pencil size={14}/> : <Plus size={14}/>}
                      {editingId ? "Editar Evento" : "Nuevo Evento"}
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Nombre del evento *</label>
                      <input type="text" className={inputClass} value={formData.evento} onChange={(e) => setFormData({ ...formData, evento: e.target.value })} required placeholder="Ej: Campamento Regional" />
                    </div>

                    <div>
                      <label className={labelClass}>Descripción</label>
                      <textarea className={`${inputClass} resize-none`} rows={2} value={formData.descripcion || ""} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Detalles del evento..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Fecha Inicio</label>
                        <input type="date" className={inputClass} value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
                      </div>
                      <div>
                        <label className={labelClass}>Fecha Fin (Opcional)</label>
                        <input type="date" className={inputClass} value={formData.fecha_fin || ""} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-5 h-5 rounded-md border-stone-300 text-yellow-500 focus:ring-yellow-400" checked={formData.todo_el_dia !== false} onChange={(e) => setFormData({ ...formData, todo_el_dia: e.target.checked, hora_inicio: "", hora_fin: "" })} />
                        <span className="text-sm font-bold text-stone-700">Todo el día</span>
                      </label>

                      {!formData.todo_el_dia && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                          <input type="time" className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-yellow-400" value={formData.hora_inicio || ""} onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })} />
                          <span className="text-stone-400">-</span>
                          <input type="time" className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-yellow-400" value={formData.hora_fin || ""} onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Etiqueta de Color</label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setFormData({...formData, color: opt.value})} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${formData.color === opt.value ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.hex }} />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-stone-100">
                    <button type="button" onClick={resetForm} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] bg-brand-brown text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-amber-900 transition-all shadow-md flex items-center justify-center gap-2">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Guardar Evento'}
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setIsAdding(true)} className="w-full mb-8 py-4 border-2 border-dashed border-stone-200 text-stone-500 rounded-[1.5rem] font-bold hover:bg-stone-50 hover:border-yellow-400 hover:text-yellow-700 transition-all flex items-center justify-center gap-2 group">
                  <Plus size={20} className="group-hover:rotate-90 transition-transform"/> Agregar Nuevo Evento
                </button>
              )}

              {/* Lista de Eventos */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Eventos Actuales</h4>
                <div className="space-y-2">
                  {todosEventos.map((ev) => (
                    <div key={ev.id} className="group flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-white hover:border-yellow-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === ev.color)?.hex || '#ccc' }} />
                        <div>
                          <p className="text-sm font-black text-brand-brown leading-tight">{ev.evento}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 mt-1 uppercase">
                            <Calendar size={10}/> {ev.fecha} {ev.fecha_fin && `→ ${ev.fecha_fin}`}
                            {!ev.todo_el_dia && ev.hora_inicio && <><span className="w-1 h-1 rounded-full bg-stone-300"/> <Clock size={10}/> {ev.hora_inicio}</>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(ev.id!); setFormData({ ...ev, hora_inicio: ev.hora_inicio || "", hora_fin: ev.hora_fin || "", todo_el_dia: ev.todo_el_dia !== false }); }} className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(ev.id!)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
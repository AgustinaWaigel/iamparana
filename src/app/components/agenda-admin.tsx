"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/app/hooks/use-session";

interface Evento {
  id?: number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
}

interface AgendaAdminProps {
  eventosVisibles: Evento[];
  eventosFuturos: Evento[];
  onEventoCreated?: () => void;
}

export default function AgendaAdmin({ eventosVisibles, eventosFuturos, onEventoCreated }: AgendaAdminProps) {
  const { user, isLoading } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Evento>({
    fecha: "",
    evento: "",
    fecha_fin: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todosEventos, setTodosEventos] = useState<Evento[]>([...eventosVisibles, ...eventosFuturos]);

  useEffect(() => {
    setTodosEventos([...eventosVisibles, ...eventosFuturos]);
  }, [eventosVisibles, eventosFuturos]);

  const refreshEventos = async () => {
    try {
      const response = await fetch("/api/agenda");
      if (response.ok) {
        const eventos = await response.json();
        setTodosEventos(eventos);
      }
    } catch (error) {
      console.error("Error refreshing eventos:", error);
    }
  };

  if (isLoading) return null;
  if (!user || user.role !== "admin") return null;

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ fecha: "", evento: "", fecha_fin: "" });
  };

  const handleEditClick = (evento: Evento) => {
    setIsAdding(false);
    setEditingId(evento.id || null);
    setFormData(evento);
  };

  const handleCancelClick = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ fecha: "", evento: "", fecha_fin: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const payload = editingId 
        ? { id: editingId, ...formData }
        : formData;

      const response = await fetch("/api/agenda", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al guardar el evento");
        return;
      }

      setFormData({ fecha: "", evento: "", fecha_fin: "" });
      setIsAdding(false);
      setEditingId(null);
      // Refrescar eventos automáticamente
      await refreshEventos();
      // Notificar al cliente de agenda
      window.dispatchEvent(new Event("agendaUpdated"));
      onEventoCreated?.();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar el evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return;

    try {
      const response = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al eliminar el evento");
        return;
      }

      // Eliminar inmediatamente del estado local
      setTodosEventos(todosEventos.filter(e => e.id !== id));
      // Refrescar eventos del servidor
      await refreshEventos();
      // Notificar al cliente de agenda
      window.dispatchEvent(new Event("agendaUpdated"));
      onEventoCreated?.();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el evento");
    }
  };

  return (
    <div className="mb-6">
      {/* Botón sigiloso */}
      {!isOpen && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsOpen(true)}
            title="Panel de administración de agenda"
            className="p-2 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 hover:text-gray-900 transition-all opacity-40 hover:opacity-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.26 2.632 1.732-.25.651-.025 1.39.560 1.972a1.724 1.724 0 001.063 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.26 3.31-1.732 2.632-.651-.25-1.39.025-1.972.56a1.724 1.724 0 00-2.573 1.063c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.26-2.632-1.732.25-.651.025-1.39-.56-1.972a1.724 1.724 0 00-1.063-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.26-3.31 1.732-2.632.651.25 1.39.025 1.972-.56a1.724 1.724 0 002.573-1.063z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Panel administrativo colapsable */}
      {isOpen && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200 mb-8 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-purple-900">🔧 Administración de Agenda</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                handleCancelClick();
              }}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Cerrar panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Botón agregar */}
          {!isAdding && !editingId && (
            <button
              onClick={handleAddClick}
              className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
            >
              + Agregar Evento
            </button>
          )}

          {/* Formulario agregar/editar */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg mb-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Evento *</label>
                <input
                  type="text"
                  value={formData.evento}
                  onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                  placeholder="Descripción del evento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de inicio *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de fin (opcional)</label>
                  <input
                    type="date"
                    value={formData.fecha_fin || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value || "" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de eventos con botones de edición */}
          {todosEventos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Total: {todosEventos.length} evento{todosEventos.length !== 1 ? "s" : ""}
              </p>
              {todosEventos.map((evento) => (
                <div key={evento.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{evento.evento}</p>
                    <p className="text-xs text-gray-500">
                      {evento.fecha}
                      {evento.fecha_fin && ` - ${evento.fecha_fin}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(evento)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => evento.id && handleDelete(evento.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

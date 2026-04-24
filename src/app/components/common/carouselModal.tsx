"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, Upload, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { getGoogleDriveImageUrl } from "@/lib/drive-utils";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingItem?: unknown;
}

interface CarouselAdminItem {
  id: number;
  imageDesktop: string;
  imageMobile?: string;
  alt: string;
  link?: string | null;
  buttonText?: string | null;
  order?: number | null;
}

interface DeleteDraft {
  id: number;
  title: string;
}

const EMPTY_FORM = {
  alt: "",
  link: "",
  buttonText: "",
  order: 0,
};

export default function CarouselModal({ isOpen, onClose, onSave }: Props) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<CarouselAdminItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDraft, setDeleteDraft] = useState<DeleteDraft | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const resetForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFile(null);
  };

  const openDeleteModal = (item: CarouselAdminItem) => {
    setDeleteError(null);
    setDeleteDraft({
      id: item.id,
      title: item.alt || `Slide #${item.id}`,
    });
  };

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/admin/carousel", { credentials: "include" });
      if (!res.ok) throw new Error("No se pudo cargar el carrusel");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando slides:", error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }
    loadItems();
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const applyEditingItem = (item: CarouselAdminItem) => {
    setEditingId(item.id);
    setFormData({
      alt: item.alt || "",
      link: item.link || "",
      buttonText: item.buttonText || "",
      order: Number(item.order ?? 0),
    });
    setFile(null);
  };

  const deleteSlide = async () => {
    if (!deleteDraft) return;

    setDeleteBusy(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/carousel/${deleteDraft.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar el slide");
      }

      if (editingId === deleteDraft.id) {
        resetForm();
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteDraft.id));
      setDeleteDraft(null);
    } catch (error) {
      console.error("Error eliminando slide:", error);
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar el slide");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body = new FormData();
    if (file) body.append("file", file);
    body.append("alt", formData.alt);
    body.append("link", formData.link);
    body.append("buttonText", formData.buttonText);
    body.append("order", formData.order.toString());

    try {
      const isEditing = editingId !== null;
      const url = isEditing ? `/api/admin/carousel/${editingId}` : "/api/admin/carousel";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        body,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el slide");
      }

      await loadItems();
      onSave();
      resetForm();
    } catch (error) {
      console.error("Error al guardar:", error);
      window.alert("No se pudo guardar el slide");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 md:p-6 border-b flex justify-between items-center bg-stone-50 shrink-0">
          <h2 className="text-xl font-black text-stone-800 uppercase tracking-tight">Gestionar Carrusel</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors" type="button">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-y-auto min-h-0">
          <div className="p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-stone-700">Slides actuales</h3>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold uppercase tracking-wide text-stone-700 hover:bg-stone-50"
              >
                <Plus size={14} /> Nuevo
              </button>
            </div>

            <div className="space-y-3 pr-1">
              {loadingItems && (
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Loader2 size={16} className="animate-spin" /> Cargando slides...
                </div>
              )}

              {!loadingItems && items.length === 0 && (
                <p className="text-sm text-stone-500">No hay slides cargados todavía.</p>
              )}

              {!loadingItems &&
                items.map((item) => {
                  const isSelected = editingId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-3 ${isSelected ? "border-orange-400 bg-orange-50/70" : "border-stone-200 bg-white"}`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={getGoogleDriveImageUrl(item.imageDesktop)}
                          alt={item.alt || "Slide"}
                          className="h-16 w-24 rounded-lg object-cover bg-stone-100"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-stone-800 truncate">{item.alt || "Sin alt"}</p>
                          <p className="text-xs text-stone-500">Orden: {Number(item.order ?? 0)}</p>
                          <p className="text-xs text-stone-500 truncate">{item.link || "Sin URL"}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => applyEditingItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-700">
              {editingId ? "Editar slide" : "Nuevo slide"}
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-500 ml-1">Imagen (Drive)</label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-2 ${
                  file ? "border-orange-500 bg-orange-50" : "border-stone-200 hover:border-stone-400"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required={!editingId}
                />
                <Upload className={file ? "text-orange-600" : "text-stone-400"} />
                <p className="text-sm font-medium text-stone-600 text-center">
                  {file
                    ? file.name
                    : editingId
                      ? "Opcional: selecciona una imagen para reemplazar"
                      : "Seleccionar imagen o soltar aquí"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-500 ml-1">Descripción Alt</label>
              <input
                type="text"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.alt}
                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500 ml-1">Orden</label>
                <input
                  type="number"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value || "0", 10) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-stone-500 ml-1">Texto Botón</label>
                <input
                  type="text"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  placeholder="Opcional (ej: Ver más)"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-stone-500 ml-1">URL del botón (opcional)</label>
              <input
                type="url"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://ejemplo.com"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {editingId ? "Guardar cambios" : "Subir y Guardar"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-4 rounded-2xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition-all"
                >
                  Cancelar edición
                </button>
              ) : (
                <div />
              )}
            </div>
          </form>
        </div>
      </div>

      {deleteDraft && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-red-100 bg-red-50 px-6 py-5">
              <h3 className="text-xl font-black text-red-700">Eliminar slide</h3>
            </div>
            <div className="space-y-5 px-6 py-6">
              <p className="text-stone-600 leading-relaxed">
                ¿Estás seguro de que deseas eliminar <span className="font-bold text-stone-900">{deleteDraft.title}</span>? Esta acción no se puede deshacer.
              </p>
              {deleteError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {deleteError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => !deleteBusy && setDeleteDraft(null)}
                  disabled={deleteBusy}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => deleteSlide().catch(() => undefined)}
                  disabled={deleteBusy}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-black text-white disabled:opacity-50 hover:bg-red-700 shadow-md transition-all active:scale-95"
                >
                  {deleteBusy ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

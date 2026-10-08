"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { AnimadoresGrupo, type Animador } from "./animadores-grupo";

// Grupos IAM que las familias eligen al registrarse.

type Grupo = { id: string; nombre: string; ciudad: string | null; activo: boolean; color: string | null };

const inputClass = "modal-input-unified";
const VACIO = { nombre: "", ciudad: "", color: "" };

export function GruposManager() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<{ id?: string; nombre: string; ciudad: string; color: string }>(VACIO);
  const [animadores, setAnimadores] = useState<Animador[]>([]);

  const loadAnimadores = async () => {
    const response = await fetch("/api/admin/inscripciones/animadores", { credentials: "include" }).catch(() => null);
    if (response?.ok) setAnimadores(await response.json());
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/inscripciones/grupos", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los grupos.");
      setGrupos(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los grupos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); loadAnimadores(); }, []);

  const save = async (grupo: { id?: string; nombre: string; ciudad: string; activo: boolean; color: string }) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/inscripciones/grupos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grupo),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el grupo.");
      setDraft(VACIO);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el grupo.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const actual = grupos.find((grupo) => grupo.id === draft.id);
    save({ ...draft, activo: actual ? actual.activo : true });
  };

  return (
    <section aria-labelledby="grupos-iam" className="mt-12">
      <div>
        <h2 id="grupos-iam" className="text-xl font-black text-brand-brown">Grupos IAM</h2>
        <p className="mt-1 text-stone-500">Son los que las familias eligen al cargar a cada persona. El color identifica a cada IAM en la lista de inscriptos y en los pagos.</p>

        {animadores.some((animador) => animador.estado === "pendiente") && (
          <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Hay {animadores.filter((animador) => animador.estado === "pendiente").length} pedido(s) de animadores esperando aprobación. Están marcados en su grupo, más abajo.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-brand-brown">
            {draft.id ? "Editar grupo" : "Agregar grupo"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto_auto]">
            <input className={inputClass} placeholder="Nombre (ej.: IAM San José)" value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} maxLength={120} required aria-label="Nombre del grupo" />
            <input className={inputClass} placeholder="Ciudad (opcional)" value={draft.ciudad} onChange={(e) => setDraft({ ...draft, ciudad: e.target.value })} maxLength={80} aria-label="Ciudad" />
            <label className="flex items-center gap-2 text-sm font-bold text-stone-600">
              Color
              <input type="color" value={draft.color || "#ffffff"} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-stone-300 bg-white p-1" aria-label="Color de la IAM en las planillas" />
              {draft.color && <button type="button" onClick={() => setDraft({ ...draft, color: "" })} className="text-xs font-bold text-stone-500 underline">Quitar</button>}
            </label>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <Loader2 size={16} className="animate-spin" /> : draft.id ? <Pencil size={16} /> : <Plus size={16} />}
              {draft.id ? "Guardar" : "Agregar"}
            </button>
          </div>
          {draft.id && (
            <button type="button" onClick={() => setDraft(VACIO)} className="mt-3 text-sm font-bold text-stone-500 hover:underline">
              Cancelar edición
            </button>
          )}
        </form>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-medium text-red-700">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-10 text-center text-stone-500"><Loader2 className="mx-auto mb-2 animate-spin" />Cargando…</p>
          ) : grupos.length === 0 ? (
            <p className="p-10 text-center text-stone-500">Todavía no hay grupos. Sin grupos, las familias no pueden registrarse.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {grupos.map((grupo) => (
                <li key={grupo.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span aria-hidden className="h-9 w-3 shrink-0 rounded-full border border-stone-200" style={{ backgroundColor: grupo.color ?? "transparent" }} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold ${grupo.activo ? "text-stone-800" : "text-stone-400 line-through"}`}>{grupo.nombre}</p>
                    <p className="text-sm text-stone-500">{grupo.ciudad || "Sin ciudad"}{grupo.activo ? "" : " · Oculto para las familias"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => setDraft({ id: grupo.id, nombre: grupo.nombre, ciudad: grupo.ciudad || "", color: grupo.color || "" })} className="btn-secondary px-4 py-2">
                      Editar
                    </button>
                    <button type="button" disabled={busy} onClick={() => save({ id: grupo.id, nombre: grupo.nombre, ciudad: grupo.ciudad || "", activo: !grupo.activo, color: grupo.color || "" })} className="btn-secondary px-4 py-2">
                      {grupo.activo ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <AnimadoresGrupo key={`${grupo.id}-${animadores.filter((animador) => animador.grupoId === grupo.id && animador.estado === "pendiente").length}`} grupoId={grupo.id} grupoNombre={grupo.nombre} animadores={animadores.filter((animador) => animador.grupoId === grupo.id)} onChange={loadAnimadores} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

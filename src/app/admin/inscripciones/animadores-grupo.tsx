"use client";

import { FormEvent, useState } from "react";
import { Loader2, X } from "lucide-react";

// Usuarios del sitio que pueden ver a los inscriptos de una IAM (sus animadores).
// Se agregan por el email con el que se registraron en el sitio.

export type Animador = { grupoId: string; userId: number; email: string; nombre: string | null; estado: "pendiente" | "aprobado"; esCoordinador: boolean };

interface AnimadoresGrupoProps {
  grupoId: string;
  grupoNombre: string;
  animadores: Animador[];
  onChange: () => Promise<void> | void;
}

export function AnimadoresGrupo({ grupoId, grupoNombre, animadores, onChange }: AnimadoresGrupoProps) {
  const pendientes = animadores.filter((animador) => animador.estado === "pendiente").length;
  // Si hay pedidos esperando, el bloque arranca abierto para que no se pasen por alto.
  const [open, setOpen] = useState(pendientes > 0);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const call = async (method: "POST" | "DELETE", body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/inscripciones/animadores", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupoId, ...body }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar.");
      await onChange();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (await call("POST", { email })) setEmail("");
  };

  return (
    <div className="basis-full">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-sm font-bold text-brand-brown hover:underline">
        Animadores con acceso ({animadores.length - pendientes})
      </button>
      {pendientes > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">{pendientes} {pendientes === 1 ? "pedido" : "pedidos"} por aprobar</span>}

      {open && (
        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm text-stone-600">
            Pueden ver quiénes están inscriptos de {grupoNombre}, ordenados por grado. No ven fichas de salud, contactos ni pagos. Antes de aprobar un pedido, confirmá que esa persona es de verdad animadora de este grupo. Quien sea coordinador/a puede, además, aprobar y dar de baja a los animadores de su IAM.
          </p>

          {animadores.length > 0 && (
            <ul className="m-0 mt-3 list-none divide-y divide-stone-200 p-0">
              {animadores.map((animador) => (
                <li key={animador.userId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                  <span className="min-w-0 break-all text-sm text-stone-800">
                    {animador.nombre ? `${animador.nombre} · ` : ""}{animador.email}
                    {animador.estado === "pendiente" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Pidió el acceso desde su perfil</span>}
                    {animador.esCoordinador && <span className="ml-2 rounded-full bg-brand-brown px-2 py-0.5 text-[11px] font-bold text-white">Coordinador/a</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {animador.estado === "aprobado" && (
                      <button type="button" disabled={busy} onClick={() => call("POST", { accion: "coordinador", userId: animador.userId, coordinador: !animador.esCoordinador })} className="text-xs font-bold text-brand-brown underline disabled:opacity-50">
                        {animador.esCoordinador ? "Quitar como coordinador/a" : "Hacer coordinador/a"}
                      </button>
                    )}
                    {animador.estado === "pendiente" && (
                      <button type="button" disabled={busy} onClick={() => call("POST", { accion: "aprobar", userId: animador.userId })} className="rounded-full bg-brand-brown px-3 py-1 text-xs font-bold text-white hover:bg-brand-wood disabled:opacity-50">Aprobar</button>
                    )}
                    <button type="button" disabled={busy} onClick={() => call("DELETE", { userId: animador.userId })} aria-label={animador.estado === "pendiente" ? `Rechazar el pedido de ${animador.email}` : `Quitar el acceso de ${animador.email}`} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                      <X size={16} aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
            <input type="email" className="modal-input-unified min-w-0 flex-1" placeholder="Email con el que se registró en el sitio" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} aria-label="Email del animador" required />
            <button type="submit" disabled={busy} className="btn-secondary px-4 py-2">
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Dar acceso
            </button>
          </form>
          {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}

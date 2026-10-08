"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Search, UsersRound } from "lucide-react";

// Recuperación de cuentas familiares: para cuando una familia perdió el acceso a su
// email, cambió el adulto responsable o hay que quitarle el acceso a alguien.

type Resumen = { id: string; email: string; ultimoIngreso: string | null; responsable: string | null; personas: number };
type Detalle = {
  id: string;
  email: string;
  ultimoIngreso: string | null;
  personas: Array<{ id: string; nombre: string; apellido: string; esTitular: boolean; vinculo: string | null; otrasCuentas: number }>;
  adultos: Array<{ cuentaId: string; email: string; compartidas: number }>;
  invitaciones: string[];
};

const inputClass = "modal-input-unified";
const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";
const H2 = "text-sm font-black uppercase tracking-widest text-brand-brown";
const QUITAR = "text-sm font-bold text-red-700 hover:underline disabled:opacity-50";

function fecha(utc: string | null) {
  if (!utc) return "nunca";
  const date = new Date(`${utc.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? utc : date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "medium" });
}

export default function AdminCuentasPage() {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resumen[] | null>(null);
  const [cuenta, setCuenta] = useState<Detalle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [otroEmail, setOtroEmail] = useState("");

  const pedir = async (url: string, init?: RequestInit) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, { credentials: "include", ...init });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo completar.");
      return data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const buscar = async (event: FormEvent) => {
    event.preventDefault();
    setAviso("");
    setCuenta(null);
    const data = await pedir(`/api/admin/inscripciones/cuentas?q=${encodeURIComponent(texto)}`);
    if (data) setResultados(data.cuentas);
  };

  const abrir = async (id: string) => {
    const data = await pedir(`/api/admin/inscripciones/cuentas?id=${encodeURIComponent(id)}`);
    if (data) { setCuenta(data.cuenta); setNuevoEmail(""); setOtroEmail(""); }
  };

  /** Ejecuta un cambio sobre la cuenta abierta y la vuelve a leer. */
  const accion = async (body: Record<string, unknown>, listo: string, confirmar?: string) => {
    if (!cuenta || (confirmar && !window.confirm(confirmar))) return;
    setAviso("");
    const data = await pedir("/api/admin/inscripciones/cuentas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuentaId: cuenta.id, ...body }),
    });
    if (!data) return;
    setAviso(listo);
    await abrir(cuenta.id);
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-16 pt-20">
      <div className="mx-auto max-w-3xl px-6">
        <div role="navigation" aria-label="Ruta de navegación">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm font-bold text-brand-brown">
            <li><Link href="/admin/inscripciones" className="text-brand-brown hover:underline">Inscripciones</Link></li>
            <li aria-hidden><ChevronRight size={14} className="opacity-60" /></li>
          </ol>
        </div>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-black text-brand-brown">
          <UsersRound className="text-amber-600" aria-hidden /> Cuentas familiares
        </h1>
        <p className="mt-2 text-stone-500">
          Para ayudar a una familia que perdió el acceso a su email, cambió el adulto responsable o necesita quitarle el acceso a alguien. Cada cambio queda registrado.
        </p>

        <form onSubmit={buscar} className="mt-6 flex flex-wrap gap-2">
          <input className={`${inputClass} min-w-0 flex-1`} placeholder="Email, nombre o apellido" value={texto} onChange={(e) => setTexto(e.target.value)} minLength={3} maxLength={80} aria-label="Buscar cuenta" required />
          <button type="submit" disabled={busy} className="btn-primary">
            {busy && !cuenta ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Buscar
          </button>
        </form>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        {aviso && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{aviso}</p>}

        {resultados && !cuenta && (
          resultados.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">No encontramos ninguna cuenta con eso.</p>
          ) : (
            <ul className="mt-6 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              {resultados.map((item) => (
                <li key={item.id}>
                  <button type="button" disabled={busy} onClick={() => abrir(item.id)} className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 p-4 text-left hover:bg-stone-50">
                    <span className="min-w-0">
                      <span className="block break-all font-bold text-stone-800">{item.email}</span>
                      <span className="block text-sm text-stone-500">{item.responsable ?? "Sin adulto cargado"} · {item.personas} {item.personas === 1 ? "persona" : "personas"}</span>
                    </span>
                    <span className="text-sm text-stone-500">Último ingreso: {fecha(item.ultimoIngreso)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {cuenta && (
          <div className="mt-6 space-y-5">
            <button type="button" onClick={() => { setCuenta(null); setAviso(""); }} className="text-sm font-bold text-brand-brown hover:underline">← Volver a los resultados</button>

            <section className={CARD}>
              <h2 className={H2}>Cuenta</h2>
              <p className="mt-3 break-all text-xl font-black text-stone-900">{cuenta.email}</p>
              <p className="mt-1 text-sm text-stone-500">Último ingreso: {fecha(cuenta.ultimoIngreso)}</p>

              <form onSubmit={(event) => { event.preventDefault(); accion({ accion: "email", email: nuevoEmail }, "Email cambiado. La familia ya puede entrar con el nuevo.", `¿Cambiar el email de esta cuenta a ${nuevoEmail}? Quien tenga el email anterior deja de poder entrar.`); }} className="mt-5 border-t border-stone-100 pt-4">
                <label htmlFor="cuenta-email" className="block text-sm font-bold text-stone-700">Cambiar el email de acceso</label>
                <p className="mt-0.5 text-sm text-stone-500">Para cuando la familia perdió ese email o cambió el adulto. Confirmá por otro medio que es quien dice ser.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input id="cuenta-email" type="email" className={`${inputClass} min-w-0 flex-1`} placeholder="Email nuevo" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} maxLength={254} required />
                  <button type="submit" disabled={busy} className="btn-secondary px-4 py-2">Cambiar email</button>
                </div>
              </form>
            </section>

            <section className={CARD}>
              <h2 className={H2}>Personas de la cuenta</h2>
              {cuenta.personas.length === 0 ? <p className="mt-3 text-sm text-stone-500">Todavía no cargó a nadie.</p> : (
                <ul className="m-0 mt-3 list-none divide-y divide-stone-100 p-0">
                  {cuenta.personas.map((persona) => (
                    <li key={persona.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                      <span className="text-base text-stone-900">
                        <strong className="font-bold">{persona.nombre} {persona.apellido}</strong>
                        <span className="text-sm text-stone-500"> · {persona.esTitular ? "Adulto responsable" : persona.vinculo ?? "A cargo"}</span>
                      </span>
                      {!persona.esTitular && persona.otrasCuentas > 0 && (
                        <button type="button" disabled={busy} onClick={() => accion({ accion: "desvincular", personaId: persona.id }, `${persona.nombre} ya no está en esta cuenta.`, `¿Sacar a ${persona.nombre} de esta cuenta? Sigue estando en la cuenta del otro adulto.`)} className={QUITAR}>
                          Sacar de esta cuenta
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={CARD}>
              <h2 className={H2}>Otros adultos con acceso</h2>
              {cuenta.adultos.length === 0 && cuenta.invitaciones.length === 0 ? <p className="mt-3 text-sm text-stone-500">Nadie más tiene acceso a las personas de esta cuenta.</p> : (
                <ul className="m-0 mt-3 list-none divide-y divide-stone-100 p-0">
                  {cuenta.adultos.map((adulto) => (
                    <li key={adulto.cuentaId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                      <span className="min-w-0 text-base text-stone-900">
                        <strong className="break-all font-bold">{adulto.email}</strong>
                        <span className="text-sm text-stone-500"> · comparte {adulto.compartidas} {adulto.compartidas === 1 ? "persona" : "personas"}</span>
                      </span>
                      <span className="flex flex-wrap gap-4">
                        <button type="button" disabled={busy} onClick={() => abrir(adulto.cuentaId)} className="text-sm font-bold text-brand-brown hover:underline">Ver su cuenta</button>
                        <button type="button" disabled={busy} onClick={() => accion({ accion: "quitar_acceso", otraCuentaId: adulto.cuentaId }, `${adulto.email} ya no ve a las personas de esta cuenta.`, `¿Quitarle a ${adulto.email} el acceso a las personas de esta cuenta?`)} className={QUITAR}>Quitar acceso</button>
                      </span>
                    </li>
                  ))}
                  {cuenta.invitaciones.map((email) => (
                    <li key={email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                      <span className="min-w-0 text-base text-stone-900">
                        <strong className="break-all font-bold">{email}</strong>
                        <span className="text-sm text-stone-500"> · invitado, todavía no entró</span>
                      </span>
                      <button type="button" disabled={busy} onClick={() => accion({ accion: "cancelar_invitacion", email }, "Invitación cancelada.")} className={QUITAR}>Cancelar invitación</button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={(event) => { event.preventDefault(); accion({ accion: "dar_acceso", email: otroEmail }, `Listo. Cuando ${otroEmail} entre con su email, va a ver a las personas a cargo de esta cuenta.`); }} className="mt-4 border-t border-stone-100 pt-4">
                <label htmlFor="cuenta-otro" className="block text-sm font-bold text-stone-700">Dar acceso a otro adulto</label>
                <p className="mt-0.5 text-sm text-stone-500">Para sumar al otro papá o mamá, o para pasar los chicos a un adulto nuevo (después podés sacarlos de esta cuenta).</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input id="cuenta-otro" type="email" className={`${inputClass} min-w-0 flex-1`} placeholder="Email del otro adulto" value={otroEmail} onChange={(e) => setOtroEmail(e.target.value)} maxLength={254} required />
                  <button type="submit" disabled={busy} className="btn-secondary px-4 py-2">Dar acceso</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

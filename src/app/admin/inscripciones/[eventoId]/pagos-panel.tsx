"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { AREA_COLOR, COLOR_HEX, estiloIam } from "@/app/inscripciones/colores";
import { formatMonto } from "@/app/inscripciones/montos";
import { AREA_LABEL, ROL_LABEL } from "@/app/inscripciones/ui";
import type { PagoAdmin, PagoEstado, PagoMedio } from "@/server/db/inscripciones-admin-repository";

// Pagos de un evento, como las planillas de siempre.
// - Por IAM: una fila por IAM con su color, la cantidad de inscriptos y el monto total;
//   cada fila se abre para marcar el pago persona por persona.
// - Áreas: una fila por persona, con el color de su área, si pagó y con qué medio.

const ESTADO_LABEL: Record<PagoEstado, string> = { pendiente: "No", pagado: "Sí", exento: "No paga" };
const MEDIO_LABEL: Record<PagoMedio, string> = { transferencia: "Transferencia", efectivo: "Efectivo" };
const SIN_AREA = "Sin área indicada";
const TH = "px-3 py-2.5 text-left text-xs font-black uppercase tracking-wide text-stone-500";
const NUM = "px-3 py-3 text-right tabular-nums";
const CONTROL = "rounded-full border border-black/20 px-3 py-1.5 text-sm font-bold";

interface PagosPanelProps {
  eventoId: string;
  pagos: PagoAdmin[];
}

type Cambio = { estado?: PagoEstado; medio?: PagoMedio | null };

/** true si a esta persona hay algo que cobrarle (jardín y quienes "no pagan" quedan afuera). */
const cobrable = (fila: PagoAdmin) => fila.pagoEstado !== "exento" && (fila.monto ?? 0) > 0;

function totales(filas: PagoAdmin[]) {
  const cobrables = filas.filter(cobrable);
  const total = cobrables.reduce((suma, fila) => suma + (fila.monto ?? 0), 0);
  const pagado = cobrables.filter((fila) => fila.pagoEstado === "pagado").reduce((suma, fila) => suma + (fila.monto ?? 0), 0);
  return { total, pagado, falta: total - pagado, inscriptos: filas.filter((fila) => !fila.esBaja).length };
}

/** Color del desplegable "pagó": amarillo para sí, rojo para no, como en la planilla. */
const estadoClass = (estado: PagoEstado) =>
  estado === "pagado" ? "bg-yellow-300 text-stone-900" : estado === "exento" ? "bg-stone-200 text-stone-700" : "bg-red-700 text-white";
const medioClass = (medio: PagoMedio | null) =>
  medio === "transferencia" ? "bg-blue-300 text-stone-900" : medio === "efectivo" ? "bg-emerald-700 text-white" : "bg-white text-stone-600";

export function PagosPanel({ eventoId, pagos }: PagosPanelProps) {
  const router = useRouter();
  const [vista, setVista] = useState<"iam" | "areas">("iam");
  const [abierto, setAbierto] = useState<string | null>(null);
  // Cambios ya enviados que todavía no volvieron del servidor: se muestran de inmediato.
  const [local, setLocal] = useState<Record<string, { pagoEstado: PagoEstado; pagoMedio: PagoMedio | null }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filas = pagos.map((fila) => ({ ...fila, ...local[fila.inscripcionId] }));
  const deIam = filas.filter((fila) => fila.rol !== "area");
  const deAreas = filas
    .filter((fila) => fila.rol === "area")
    .sort((a, b) => (a.area ?? "zz").localeCompare(b.area ?? "zz", "es") || a.apellido.localeCompare(b.apellido, "es") || a.nombre.localeCompare(b.nombre, "es"));
  const visibles = vista === "iam" ? deIam : deAreas;

  const marcar = async (ids: string[], cambio: Cambio, clave: string) => {
    if (ids.length === 0) return;
    setBusy(clave);
    setError("");
    const anterior = local;
    // Misma regla que el servidor: elegir un medio marca el pago; volver a "No" borra el medio.
    setLocal((prev) => ({
      ...prev,
      ...Object.fromEntries(ids.map((id) => {
        const actual = filas.find((fila) => fila.inscripcionId === id)!;
        const pagoEstado = cambio.estado ?? (cambio.medio ? "pagado" : actual.pagoEstado);
        const pagoMedio = pagoEstado !== "pagado" ? null : cambio.medio !== undefined ? cambio.medio : actual.pagoMedio;
        return [id, { pagoEstado, pagoMedio }];
      })),
    }));
    try {
      const response = await fetch("/api/admin/inscripciones/pagos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId, inscripcionIds: ids, ...cambio }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el pago.");
      router.refresh();
    } catch (cause) {
      setLocal(anterior);
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el pago.");
    } finally {
      setBusy(null);
    }
  };

  /** Desplegables de "pagó" y "medio de pago" de una persona. */
  const controles = (fila: PagoAdmin) => (fila.monto ?? 0) > 0 ? (
    <span className="flex flex-wrap items-center justify-end gap-2">
      <label className="sr-only" htmlFor={`pago-${fila.inscripcionId}`}>¿Pagó {fila.nombre} {fila.apellido}?</label>
      <select id={`pago-${fila.inscripcionId}`} value={fila.pagoEstado} disabled={busy !== null} onChange={(e) => marcar([fila.inscripcionId], { estado: e.target.value as PagoEstado }, fila.inscripcionId)} className={`${CONTROL} ${estadoClass(fila.pagoEstado)}`}>
        {(Object.keys(ESTADO_LABEL) as PagoEstado[]).map((estado) => <option key={estado} value={estado}>{ESTADO_LABEL[estado]}</option>)}
      </select>
      <label className="sr-only" htmlFor={`medio-${fila.inscripcionId}`}>Medio de pago de {fila.nombre} {fila.apellido}</label>
      <select id={`medio-${fila.inscripcionId}`} value={fila.pagoMedio ?? ""} disabled={busy !== null || fila.pagoEstado === "exento"} onChange={(e) => marcar([fila.inscripcionId], { medio: (e.target.value || null) as PagoMedio | null }, fila.inscripcionId)} className={`${CONTROL} ${medioClass(fila.pagoMedio)}`}>
        <option value="">Medio…</option>
        {(Object.keys(MEDIO_LABEL) as PagoMedio[]).map((medio) => <option key={medio} value={medio}>{MEDIO_LABEL[medio]}</option>)}
      </select>
    </span>
  ) : <span className="text-sm font-bold">{fila.monto === 0 ? "No paga" : "Sin monto"}</span>;

  const general = totales(visibles);

  const tab = (id: "iam" | "areas", label: string, cantidad: number) => (
    <button type="button" onClick={() => { setVista(id); setAbierto(null); }} aria-pressed={vista === id} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${vista === id ? "border-stone-800 bg-stone-800 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"}`}>
      {label} ({cantidad})
    </button>
  );

  // ── Por IAM ──
  const grupos = new Map<string, { titulo: string; color: string | null; filas: PagoAdmin[] }>();
  for (const fila of deIam) {
    const titulo = fila.grupoNombre ?? "Sin IAM";
    const grupo = grupos.get(titulo) ?? { titulo, color: fila.grupoColor, filas: [] };
    grupo.filas.push(fila);
    grupos.set(titulo, grupo);
  }
  const ordenados = [...grupos.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {tab("iam", "Por IAM", deIam.filter((fila) => !fila.esBaja).length)}
        {tab("areas", "Áreas", deAreas.filter((fila) => !fila.esBaja).length)}
      </div>

      <div className="rounded-2xl border-2 border-brand-brown bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-brand-brown">Monto total {vista === "iam" ? "de las IAM" : "de las áreas"}</p>
        <p className="mt-2 text-4xl font-black leading-none tabular-nums text-stone-900 sm:text-5xl">{formatMonto(general.total)}</p>
        <p className="mt-3 text-base font-semibold text-stone-700">
          {general.inscriptos} {general.inscriptos === 1 ? "inscripto" : "inscriptos"} · Cobrado <span className="font-black tabular-nums text-emerald-800">{formatMonto(general.pagado)}</span> · Falta <span className={`font-black tabular-nums ${general.falta > 0 ? "text-amber-700" : "text-stone-900"}`}>{formatMonto(general.falta)}</span>
        </p>
        {vista === "iam" && <p className="mt-2 text-sm text-stone-500">La cantidad incluye animadores, acompañantes y a los de jardín. En el monto no se cuenta a los de jardín, porque no pagan.</p>}
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">{vista === "iam" ? "No hay inscriptos de las IAM." : "No hay inscriptos de las áreas."}</p>
      ) : vista === "areas" ? (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th scope="col" className={TH}>Nombre</th>
                <th scope="col" className={TH}>Apellido</th>
                <th scope="col" className={TH}>Ciudad</th>
                <th scope="col" className={TH}>Área</th>
                <th scope="col" className={`${TH} text-right`}>Monto</th>
                <th scope="col" className={`${TH} text-right`}>Pagó · Medio</th>
              </tr>
            </thead>
            <tbody>
              {deAreas.map((fila) => (
                // Toda la fila lleva el color del área, como en la planilla.
                <tr key={fila.inscripcionId} className="border-b border-black/10 font-bold" style={estiloIam(fila.area ? AREA_COLOR[fila.area] : null)}>
                  <th scope="row" className="px-3 py-2.5 text-left text-sm font-bold">
                    {fila.nombre}
                    {fila.esBaja && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Baja después del cierre</span>}
                  </th>
                  <td className="px-3 py-2.5 text-sm">{fila.apellido}</td>
                  <td className="px-3 py-2.5 text-sm">{fila.ciudad ?? "—"}</td>
                  <td className="px-3 py-2.5 text-sm">{fila.area ? AREA_LABEL[fila.area] ?? fila.area : SIN_AREA}</td>
                  <td className="px-3 py-2.5 text-right text-sm tabular-nums">{fila.monto === null ? "—" : fila.monto.toLocaleString("es-AR")}</td>
                  <td className="px-3 py-2">{controles(fila)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-stone-800 bg-yellow-200">
              <tr>
                <th scope="row" colSpan={4} className="px-3 py-3 text-left text-base font-black text-stone-900">TOTAL · {general.inscriptos} {general.inscriptos === 1 ? "inscripto" : "inscriptos"}</th>
                <td className={`${NUM} text-xl font-black text-stone-900`}>{formatMonto(general.total)}</td>
                <td className={`${NUM} text-sm font-black text-stone-900`}>Cobrado {formatMonto(general.pagado)} · Falta {formatMonto(general.falta)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th scope="col" className={TH}>IAM</th>
                <th scope="col" className={`${TH} text-right`}>Inscriptos</th>
                <th scope="col" className={`${TH} text-right`}>Monto total</th>
                <th scope="col" className={`${TH} text-right`}>Cobrado</th>
                <th scope="col" className={`${TH} text-right`}>Falta</th>
                <th scope="col" className={TH}><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((grupo) => {
                const t = totales(grupo.filas);
                const expandido = abierto === grupo.titulo;
                const pendientes = grupo.filas.filter((fila) => cobrable(fila) && fila.pagoEstado === "pendiente").map((fila) => fila.inscripcionId);
                const pagadas = grupo.filas.filter((fila) => cobrable(fila) && fila.pagoEstado === "pagado").map((fila) => fila.inscripcionId);
                const conColor = Boolean(grupo.color && COLOR_HEX.test(grupo.color));
                return (
                  <Fragment key={grupo.titulo}>
                    {/* Toda la fila lleva el color de la IAM, como en la planilla. */}
                    <tr className={`border-b border-black/10 ${conColor ? "" : "text-stone-900"}`} style={estiloIam(grupo.color)}>
                      <th scope="row" className="px-3 py-3 text-left text-base font-black">{grupo.titulo}</th>
                      <td className={`${NUM} text-base font-bold`}>{t.inscriptos}</td>
                      <td className={`${NUM} text-lg font-black`}>{formatMonto(t.total)}</td>
                      <td className={`${NUM} font-bold`}>{formatMonto(t.pagado)}</td>
                      <td className={`${NUM} font-black`}>{formatMonto(t.falta)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {t.total === 0 ? null : pendientes.length > 0 ? (
                            <button type="button" disabled={busy !== null} onClick={() => marcar(pendientes, { estado: "pagado" }, grupo.titulo)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-black text-stone-900 ring-1 ring-black/20 hover:bg-stone-100 disabled:opacity-60">
                              {busy === grupo.titulo && <Loader2 size={13} className="animate-spin" aria-hidden />}
                              Marcar pagada
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-800 ring-1 ring-black/20">
                              <Check size={14} aria-hidden /> Pagada
                              <button type="button" disabled={busy !== null} onClick={() => marcar(pagadas, { estado: "pendiente" }, grupo.titulo)} className="ml-1 font-bold text-stone-500 underline hover:text-stone-800 disabled:opacity-60">Deshacer</button>
                            </span>
                          )}
                          <button type="button" onClick={() => setAbierto(expandido ? null : grupo.titulo)} aria-expanded={expandido} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-stone-900 ring-1 ring-black/20 hover:bg-stone-100">
                            Detalle <ChevronDown size={14} aria-hidden className={`transition-transform motion-reduce:transition-none ${expandido ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandido && (
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <td colSpan={6} className="border-l-8 px-3 py-3" style={{ borderLeftColor: conColor ? grupo.color! : "#e7e5e4" }}>
                          <ul className="m-0 list-none divide-y divide-stone-200 p-0">
                            {grupo.filas.map((fila) => (
                              <li key={fila.inscripcionId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 text-stone-900">
                                <p className="min-w-0 text-sm">
                                  <strong className="font-bold">{fila.apellido}, {fila.nombre}</strong>
                                  <span className="text-stone-500"> · {ROL_LABEL[fila.rol] ?? fila.rol}{fila.grado ? ` · ${fila.grado}` : ""}</span>
                                  {fila.esBaja && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Baja después del cierre</span>}
                                </p>
                                <div className="flex items-center gap-3">
                                  {(fila.monto ?? 0) > 0 && <span className="text-sm font-bold tabular-nums">{formatMonto(fila.monto ?? 0)}</span>}
                                  {controles(fila)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-stone-800 bg-yellow-200">
              <tr>
                <th scope="row" className="px-3 py-3 text-left text-base font-black text-stone-900">TOTAL</th>
                <td className={`${NUM} text-base font-black text-stone-900`}>{general.inscriptos}</td>
                <td className={`${NUM} text-xl font-black text-stone-900`}>{formatMonto(general.total)}</td>
                <td className={`${NUM} font-black text-stone-900`}>{formatMonto(general.pagado)}</td>
                <td className={`${NUM} font-black text-stone-900`}>{formatMonto(general.falta)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

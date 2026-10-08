"use client";

import { useEffect, useState } from "react";
import { ClipboardPen, Loader2, Plus, Trash2 } from "lucide-react";

// Configuración de inscripción de un evento, dentro del editor de agenda.
// Se guarda aparte del evento: tiene su propio botón.

type Rol = "participante" | "area" | "animador" | "acompanante";
type Pregunta = { id: string; texto: string; tipo: "texto" | "si_no" | "opciones"; opciones: string[]; obligatoria: boolean; roles?: Rol[] };

interface Config {
  habilitada: boolean;
  abreAt: string;
  cierraAt: string;
  edadMin: string;
  edadMax: string;
  roles: Rol[];
  pideSalud: boolean;
  preguntas: Pregunta[];
  autorizacionTexto: string;
  /** Monto por ciudad, como texto mientras se edita. La clave "" es "otras ciudades". */
  montos: Record<string, string>;
}

const OTRAS = "";

const EMPTY: Config = {
  habilitada: false,
  abreAt: "",
  cierraAt: "",
  edadMin: "",
  edadMax: "",
  roles: ["participante"],
  pideSalud: true,
  preguntas: [],
  autorizacionTexto: "",
  montos: {},
};

const ROLES: Array<{ value: Rol; label: string }> = [
  { value: "participante", label: "Niños y adolescentes" },
  { value: "area", label: "Integrantes de áreas" },
  { value: "animador", label: "Animadores" },
  { value: "acompanante", label: "Acompañantes" },
];

const inputClass = "modal-input-unified";
const labelClass = "block text-xs font-bold text-stone-500 uppercase tracking-wide ml-1 mb-1.5";

const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));

const fechaCorta = (ymd: string) => ymd.split("-").reverse().join("/");

/** Cómo quedaría la inscripción hoy con esas fechas (sin contar si el evento ya pasó). */
function estadoHoy(abreAt: string, cierraAt: string): string {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (abreAt && today < abreAt) return `Hoy todavía está cerrada: abre el ${fechaCorta(abreAt)}.`;
  if (cierraAt && today > cierraAt) return `Hoy ya está cerrada: cerró el ${fechaCorta(cierraAt)}.`;
  return cierraAt ? `Hoy está abierta, hasta el ${fechaCorta(cierraAt)}.` : "Hoy está abierta.";
}

export function InscripcionConfigPanel({ eventoId }: { eventoId: string | number }) {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  // Ciudades de los grupos IAM: son las que las familias eligen al cargar a cada persona.
  const [ciudades, setCiudades] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/inscripciones/grupos", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : []))
      .then((grupos: Array<{ ciudad: string | null }>) => {
        if (cancelled) return;
        setCiudades([...new Set(grupos.map((grupo) => grupo.ciudad).filter((ciudad): ciudad is string => Boolean(ciudad)))].sort((a, b) => a.localeCompare(b, "es")));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessage(null);
    fetch(`/api/admin/inscripciones/eventos?eventoId=${encodeURIComponent(String(eventoId))}`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "No se pudo cargar la configuración.");
        const saved = data.config;
        setConfig(saved ? {
          habilitada: Boolean(saved.habilitada),
          abreAt: saved.abreAt || "",
          cierraAt: saved.cierraAt || "",
          edadMin: saved.edadMin === null ? "" : String(saved.edadMin),
          edadMax: saved.edadMax === null ? "" : String(saved.edadMax),
          roles: saved.roles,
          pideSalud: Boolean(saved.pideSalud),
          preguntas: saved.preguntas || [],
          autorizacionTexto: saved.autorizacionTexto || "",
          montos: {
            ...Object.fromEntries(Object.entries((saved.montos?.porCiudad ?? {}) as Record<string, number>).map(([ciudad, monto]) => [ciudad, String(monto)])),
            ...(saved.montos?.otras === null || saved.montos?.otras === undefined ? {} : { [OTRAS]: String(saved.montos.otras) }),
          },
        } : EMPTY);
      })
      .catch((error) => { if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "Error al cargar" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventoId]);

  const patch = (changes: Partial<Config>) => { setConfig((prev) => ({ ...prev, ...changes })); setMessage(null); };

  const toggleRol = (rol: Rol) =>
    patch({ roles: config.roles.includes(rol) ? config.roles.filter((item) => item !== rol) : [...config.roles, rol] });

  const patchPregunta = (index: number, changes: Partial<Pregunta>) =>
    patch({ preguntas: config.preguntas.map((pregunta, i) => (i === index ? { ...pregunta, ...changes } : pregunta)) });

  const addPregunta = () =>
    patch({ preguntas: [...config.preguntas, { id: `p${Date.now().toString(36)}`, texto: "", tipo: "texto", opciones: [], obligatoria: false, roles: [] }] });

  /** Completa la configuración típica de un tipo de evento. No guarda: queda para revisar. */
  const aplicarTipo = (tipo: "general" | "formacion" | "adolescentes") => {
    if (tipo === "general") {
      patch({ roles: ["participante", "area", "animador", "acompanante"] });
    } else if (tipo === "adolescentes") {
      patch({ roles: ["participante", "animador", "acompanante"] });
    } else {
      const nivel: Pregunta = { id: "nivel", texto: "¿En qué nivel de formación estás?", tipo: "opciones", opciones: ["Iniciación", "Profundización"], obligatoria: true, roles: ["animador"] };
      patch({ roles: ["animador", "area"], edadMin: "", edadMax: "", preguntas: config.preguntas.some((pregunta) => pregunta.id === "nivel") ? config.preguntas : [...config.preguntas, nivel] });
    }
    setMessage({
      type: "ok",
      text: tipo === "general" ? "Listo: se pueden inscribir chicos, áreas, animadores y acompañantes. Revisá y guardá."
        : tipo === "adolescentes" ? "Listo: adolescentes, animadores y acompañantes. Completá la edad mínima y máxima de los adolescentes, y guardá."
        : "Listo: solo animadores y áreas, con la pregunta de nivel (iniciación o profundización) para los animadores. Revisá y guardá.",
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/inscripciones/eventos", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId: String(eventoId),
          habilitada: config.habilitada,
          abreAt: config.abreAt,
          cierraAt: config.cierraAt,
          edadMin: toNumber(config.edadMin),
          edadMax: toNumber(config.edadMax),
          roles: config.roles,
          pideSalud: config.pideSalud,
          preguntas: config.preguntas.map((pregunta) => ({ ...pregunta, opciones: pregunta.tipo === "opciones" ? pregunta.opciones.filter(Boolean) : [], roles: (pregunta.roles ?? []).filter((rol) => config.roles.includes(rol)) })),
          autorizacionTexto: config.autorizacionTexto,
          montos: {
            porCiudad: Object.fromEntries(Object.entries(config.montos).filter(([ciudad, monto]) => ciudad !== OTRAS && monto.trim() !== "").map(([ciudad, monto]) => [ciudad, Number(monto)])),
            otras: (config.montos[OTRAS] ?? "").trim() === "" ? null : Number(config.montos[OTRAS]),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar.");
      setMessage({ type: "ok", text: config.habilitada ? "Inscripción guardada. El evento ya aparece en /inscripciones si está dentro de las fechas." : "Guardado. La inscripción está apagada." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-brand-brown">
        <ClipboardPen size={14} /> Inscripción
      </h4>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-stone-500"><Loader2 size={16} className="animate-spin" /> Cargando…</p>
      ) : (
        <div className="space-y-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 rounded-md border-stone-300 accent-brand-brown" checked={config.habilitada} onChange={(e) => patch({ habilitada: e.target.checked })} />
            <span className="text-sm font-bold text-stone-700">Este evento tiene inscripción</span>
          </label>

          {config.habilitada && (
            <>
              <div>
                <span className={labelClass}>Tipo de evento</span>
                <p className="mb-2 ml-1 text-xs leading-relaxed text-stone-500">Completa lo de abajo con lo habitual de cada tipo; después lo podés ajustar.</p>
                <div className="flex flex-wrap gap-2">
                  {([["general", "Campamento de todas las edades"], ["adolescentes", "Campamento de adolescentes"], ["formacion", "Formación de animadores"]] as const).map(([tipo, label]) => (
                    <button key={tipo} type="button" onClick={() => aplicarTipo(tipo)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 transition-all hover:border-stone-500">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>La inscripción abre el</label>
                  <input type="date" className={inputClass} value={config.abreAt} max={config.cierraAt || undefined} onChange={(e) => patch({ abreAt: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Cierra el (ese día inclusive)</label>
                  <input type="date" className={inputClass} value={config.cierraAt} min={config.abreAt || undefined} onChange={(e) => patch({ cierraAt: e.target.value })} />
                </div>
                <p className="col-span-2 -mt-1 text-xs leading-relaxed text-stone-500">
                  {estadoHoy(config.abreAt, config.cierraAt)} Si dejás una fecha vacía, no hay límite de ese lado: sin apertura abre ya, y sin cierre sigue abierta hasta que termina el evento.
                </p>
                <div>
                  <label className={labelClass}>Edad mínima (niños y adolescentes)</label>
                  <input type="number" min={0} className={inputClass} value={config.edadMin} onChange={(e) => patch({ edadMin: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Edad máxima (niños y adolescentes)</label>
                  <input type="number" min={0} className={inputClass} value={config.edadMax} onChange={(e) => patch({ edadMax: e.target.value })} />
                </div>
              </div>

              <div>
                <span className={labelClass}>Quiénes se pueden inscribir</span>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((rol) => (
                    <button key={rol.value} type="button" aria-pressed={config.roles.includes(rol.value)} onClick={() => toggleRol(rol.value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${config.roles.includes(rol.value) ? "border-stone-800 bg-stone-800 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"}`}>
                      {rol.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-5 w-5 rounded-md border-stone-300 accent-brand-brown" checked={config.pideSalud} onChange={(e) => patch({ pideSalud: e.target.checked })} />
                <span className="text-sm font-bold text-stone-700">Exigir ficha de salud</span>
              </label>

              <div>
                <span className={labelClass}>Preguntas propias del evento</span>
                <div className="space-y-3">
                  {config.preguntas.map((pregunta, index) => (
                    <div key={pregunta.id} className="rounded-xl border border-stone-200 bg-white p-3">
                      <div className="flex gap-2">
                        <input className={inputClass} placeholder="Ej.: ¿Qué talle de remera usa?" value={pregunta.texto} onChange={(e) => patchPregunta(index, { texto: e.target.value })} />
                        <button type="button" aria-label="Quitar pregunta" onClick={() => patch({ preguntas: config.preguntas.filter((_, i) => i !== index) })} className="shrink-0 rounded-xl p-2 text-stone-400 transition-all hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <select className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm" value={pregunta.tipo} onChange={(e) => patchPregunta(index, { tipo: e.target.value as Pregunta["tipo"] })}>
                          <option value="texto">Respuesta libre</option>
                          <option value="si_no">Sí / No</option>
                          <option value="opciones">Opciones</option>
                        </select>
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-600">
                          <input type="checkbox" className="h-4 w-4 accent-brand-brown" checked={pregunta.obligatoria} onChange={(e) => patchPregunta(index, { obligatoria: e.target.checked })} />
                          Obligatoria
                        </label>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-xs font-bold text-stone-500">Se le pregunta a:</span>
                        <button type="button" aria-pressed={!pregunta.roles?.length} onClick={() => patchPregunta(index, { roles: [] })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${!pregunta.roles?.length ? "border-stone-800 bg-stone-800 text-white" : "border-stone-200 bg-white text-stone-600"}`}>
                          Todos
                        </button>
                        {ROLES.filter((rol) => config.roles.includes(rol.value)).map((rol) => {
                          const activo = Boolean(pregunta.roles?.includes(rol.value));
                          return (
                            <button key={rol.value} type="button" aria-pressed={activo} onClick={() => patchPregunta(index, { roles: activo ? (pregunta.roles ?? []).filter((item) => item !== rol.value) : [...(pregunta.roles ?? []), rol.value] })} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${activo ? "border-stone-800 bg-stone-800 text-white" : "border-stone-200 bg-white text-stone-600"}`}>
                              {rol.label}
                            </button>
                          );
                        })}
                      </div>
                      {pregunta.tipo === "opciones" && (
                        <input className={`${inputClass} mt-2`} placeholder="Opciones separadas por coma: S, M, L, XL" value={pregunta.opciones.join(", ")} onChange={(e) => patchPregunta(index, { opciones: e.target.value.split(",").map((item) => item.trim()) })} />
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addPregunta} className="flex items-center gap-2 text-sm font-bold text-brand-brown hover:underline">
                    <Plus size={15} /> Agregar pregunta
                  </button>
                </div>
              </div>

              <div>
                <span className={labelClass}>Monto de la inscripción, por ciudad</span>
                <p className="mb-3 ml-1 text-xs leading-relaxed text-stone-500">
                  En pesos, según la ciudad donde vive cada persona. Se le avisa a la familia al inscribirse. Dejá vacío lo que no corresponda.
                </p>
                <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  {[...new Set([...ciudades, ...Object.keys(config.montos).filter((ciudad) => ciudad !== OTRAS)])].map((ciudad) => (
                    <label key={ciudad} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                      <span className="min-w-0 truncate text-sm font-bold text-stone-700">{ciudad}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-sm text-stone-500">
                        $
                        <input type="number" min={0} step={1} inputMode="numeric" className="w-28 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-right text-sm text-stone-800" value={config.montos[ciudad] ?? ""} onChange={(e) => patch({ montos: { ...config.montos, [ciudad]: e.target.value } })} />
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-stone-300 bg-white px-3 py-2">
                    <span className="min-w-0 text-sm font-bold text-stone-700">Otras ciudades</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm text-stone-500">
                      $
                      <input type="number" min={0} step={1} inputMode="numeric" className="w-28 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-right text-sm text-stone-800" value={config.montos[OTRAS] ?? ""} onChange={(e) => patch({ montos: { ...config.montos, [OTRAS]: e.target.value } })} />
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Texto de la autorización del evento</label>
                <textarea className={`${inputClass} resize-y`} rows={4} value={config.autorizacionTexto} onChange={(e) => patch({ autorizacionTexto: e.target.value })} placeholder="Es el texto que va a firmar el adulto responsable. Conviene que lo revise la diócesis o un abogado." />
              </div>
            </>
          )}

          {message && (
            <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${message.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {message.text}
            </p>
          )}

          <button type="button" onClick={save} disabled={saving || (config.habilitada && config.roles.length === 0)} className="btn-primary">
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            Guardar inscripción
          </button>
        </div>
      )}
    </section>
  );
}

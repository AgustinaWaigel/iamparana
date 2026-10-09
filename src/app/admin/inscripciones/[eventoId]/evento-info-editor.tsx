"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { EventoInfo } from "@/server/db/evento-info-repository";

// Información práctica del evento: dónde es, horarios, qué llevar y cómo pagar.
// Lo que se cargue acá se muestra en la página pública del evento.

const VACIA: EventoInfo = { lugar: "", direccion: "", mapaUrl: "", llegada: "", salida: "", queLlevar: [], pago: { alias: "", cbu: "", titular: "", comprobante: "", nota: "" } };
const LISTA_CAMPAMENTO = ["Bolsa de dormir o frazada", "Aislante o colchoneta", "Plato, vaso y cubiertos", "Abrigo", "Ropa cómoda para cambiarse", "Calzado cómodo", "Elementos de higiene y toalla", "Linterna", "Repelente y protector solar", "Gorra", "Botella de agua", "Medicación que tome, con indicaciones", "Pañoleta"];

const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6";
const LABEL = "mb-1 block text-sm font-bold text-brand-ink";
const H3 = "m-0 mb-3 text-left font-display text-lg font-extrabold text-brand-ink";

export function EventoInfoEditor({ eventoId }: { eventoId: string }) {
  const [info, setInfo] = useState<EventoInfo | null>(null);
  const [nuevo, setNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch(`/api/admin/inscripciones/evento-info?eventoId=${encodeURIComponent(eventoId)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => { if (vigente) setInfo({ ...VACIA, ...data.info, pago: { ...VACIA.pago, ...data.info?.pago } }); })
      .catch(() => { if (vigente) { setInfo(VACIA); setMensaje({ ok: false, texto: "No se pudo cargar lo que ya estaba guardado." }); } });
    return () => { vigente = false; };
  }, [eventoId]);

  if (!info) return <section className={CARD}><p className="m-0 max-w-none text-left text-sm text-brand-ink/60">Cargando la información del evento…</p></section>;

  const cambiar = (campo: keyof Omit<EventoInfo, "queLlevar" | "pago">, valor: string) => { setInfo({ ...info, [campo]: valor }); setMensaje(null); };
  const cambiarPago = (campo: keyof EventoInfo["pago"], valor: string) => { setInfo({ ...info, pago: { ...info.pago, [campo]: valor } }); setMensaje(null); };
  const agregar = () => {
    const item = nuevo.trim();
    if (!item || info.queLlevar.includes(item)) return;
    setInfo({ ...info, queLlevar: [...info.queLlevar, item] });
    setNuevo("");
    setMensaje(null);
  };

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const response = await fetch("/api/admin/inscripciones/evento-info", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventoId, ...info }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo guardar.");
      setMensaje({ ok: true, texto: "Guardado. Ya se ve en la página del evento." });
    } catch (error) {
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  };

  const campo = (id: string, etiqueta: string, valor: string, onChange: (valor: string) => void, max: number, placeholder?: string) => (
    <div>
      <label htmlFor={`info-${id}`} className={LABEL}>{etiqueta}</label>
      <input id={`info-${id}`} maxLength={max} value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="modal-input-unified" />
    </div>
  );

  return (
    <form onSubmit={guardar} className={CARD}>
      <h2 className="m-0 text-left font-display text-xl font-extrabold text-brand-ink">Información para las familias</h2>
      <p className="m-0 mt-1 max-w-none text-left text-sm text-brand-ink/65">Se muestra en la página del evento. Lo que dejes vacío no aparece. El monto se toma de la inscripción.</p>

      <div className="mt-6 space-y-7">
        <div>
          <h3 className={H3}>Cómo llegar</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("lugar", "Lugar", info.lugar, (v) => cambiar("lugar", v), 120, "Por ejemplo: Casa de retiros")}
            {campo("direccion", "Dirección", info.direccion, (v) => cambiar("direccion", v), 200, "Calle, número y ciudad")}
            {campo("llegada", "Llegada", info.llegada, (v) => cambiar("llegada", v), 120, "Por ejemplo: sábado a las 9")}
            {campo("salida", "Salida", info.salida, (v) => cambiar("salida", v), 120, "Por ejemplo: domingo a las 17")}
            <div className="sm:col-span-2">
              {campo("mapa", "Enlace de Google Maps (opcional)", info.mapaUrl, (v) => cambiar("mapaUrl", v), 500, "https://maps.app.goo.gl/...")}
              <p className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">Si lo dejás vacío, el mapa se busca con la dirección.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className={H3}>Qué llevar</h3>
          {info.queLlevar.length === 0 && (
            <button type="button" onClick={() => { setInfo({ ...info, queLlevar: LISTA_CAMPAMENTO }); setMensaje(null); }} className="mb-3 rounded-full border border-brand-brown/25 px-4 py-2 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10">
              Empezar con la lista de campamento
            </button>
          )}
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {info.queLlevar.map((item) => (
              <li key={item} className="inline-flex items-center gap-1 rounded-full bg-brand-cream py-1 pl-3.5 pr-1 text-sm font-semibold text-brand-ink">
                {item}
                <button type="button" aria-label={`Quitar ${item}`} onClick={() => { setInfo({ ...info, queLlevar: info.queLlevar.filter((otro) => otro !== item) }); setMensaje(null); }} className="flex h-7 w-7 items-center justify-center rounded-full text-brand-brown transition-colors hover:bg-brand-brown hover:text-white">
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <label htmlFor="info-nuevo" className="sr-only">Agregar algo a la lista</label>
            <input id="info-nuevo" maxLength={120} value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregar(); } }} placeholder="Agregar algo a la lista" className="modal-input-unified" />
            <button type="button" onClick={agregar} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-brown/10 px-4 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown hover:text-white">
              <Plus size={16} aria-hidden /> Agregar
            </button>
          </div>
        </div>

        <div>
          <h3 className={H3}>Cómo pagar</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("alias", "Alias", info.pago.alias, (v) => cambiarPago("alias", v), 60)}
            {campo("cbu", "CBU o CVU", info.pago.cbu, (v) => cambiarPago("cbu", v), 40)}
            {campo("titular", "A nombre de", info.pago.titular, (v) => cambiarPago("titular", v), 120)}
            {campo("comprobante", "A quién mandar el comprobante", info.pago.comprobante, (v) => cambiarPago("comprobante", v), 160, "Por ejemplo: al animador de tu IAM")}
            <div className="sm:col-span-2">
              <label htmlFor="info-nota" className={LABEL}>Otra forma de pago o aclaración (opcional)</label>
              <textarea id="info-nota" rows={2} maxLength={400} value={info.pago.nota} onChange={(e) => cambiarPago("nota", e.target.value)} className="modal-input-unified resize-none" />
              <p className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">Ojo: el alias, el CBU y el nombre quedan a la vista de cualquiera que abra la página del evento.</p>
            </div>
          </div>
        </div>
      </div>

      {mensaje && <p role="status" className={`m-0 mt-5 max-w-none rounded-xl border px-4 py-3 text-left text-sm font-medium ${mensaje.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>{mensaje.texto}</p>}
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood disabled:opacity-60">
          {guardando && <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" />}
          {guardando ? "Guardando..." : "Guardar información"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { BellRing, Loader2, Send } from "lucide-react";

// Avisos especiales al celular: el administrador escribe un aviso (por ejemplo, que abrieron
// las inscripciones) y les llega a todos los que activaron las notificaciones del sitio.

type EventoInscripcion = { id: string; nombre: string; estado: "abierta" | "proxima"; abreAt: string | null; cierraAt: string | null };
type Enviada = { id: number; tipo: string; titulo: string; mensaje: string; enviadoAt: string };
type Datos = { suscriptores: number; enviadas: Enviada[]; eventos: EventoInscripcion[] };
type Aviso = { titulo: string; mensaje: string; url: string };

const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6";
const LABEL = "mb-1 block text-sm font-bold text-brand-ink";
const VACIO: Aviso = { titulo: "", mensaje: "", url: "/" };
const MAX_TITULO = 60;
const MAX_MENSAJE = 180;

function fechaCorta(ymd: string | null) {
  if (!ymd) return "";
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

function fechaHora(utc: string) {
  const fecha = new Date(utc.includes("T") ? utc : `${utc.replace(" ", "T")}Z`);
  return Number.isNaN(fecha.getTime()) ? utc : fecha.toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const TIPO: Record<string, string> = {
  aviso_manual: "Aviso especial",
  event_7days: "Evento en 7 días",
  event_1day: "Evento mañana",
  event_today: "Evento hoy",
  insc_abre: "Abrió una inscripción",
  insc_cierra_3: "Inscripción: quedan 3 días",
  insc_cierra_hoy: "Inscripción: último día",
};

/** Avisos armados para un evento con inscripción. */
function plantillas(evento: EventoInscripcion): Array<{ nombre: string; aviso: Aviso }> {
  const url = `/inscripciones/${encodeURIComponent(evento.id)}`;
  const lista = [
    { nombre: "Abrieron las inscripciones", aviso: { titulo: "¡Ya te podés inscribir!", mensaje: `Abrieron las inscripciones para ${evento.nombre}. Anotate desde el sitio.`, url } },
    {
      nombre: "Están por cerrar",
      aviso: {
        titulo: "Últimos días para inscribirte",
        mensaje: evento.cierraAt ? `Las inscripciones para ${evento.nombre} cierran el ${fechaCorta(evento.cierraAt)}. ¡No te quedes afuera!` : `Quedan pocos días para inscribirte a ${evento.nombre}. ¡No te quedes afuera!`,
        url,
      },
    },
  ];
  if (evento.estado === "proxima" && evento.abreAt) {
    lista.unshift({ nombre: "Abren pronto", aviso: { titulo: "Se vienen las inscripciones", mensaje: `Las inscripciones para ${evento.nombre} abren el ${fechaCorta(evento.abreAt)}. Agendalo.`, url } });
  }
  return lista;
}

export default function NotificacionesAdminPage() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargaError, setCargaError] = useState("");
  const [aviso, setAviso] = useState<Aviso>(VACIO);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notificaciones", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setDatos(await response.json());
      setCargaError("");
    } catch {
      setCargaError("No se pudieron cargar los datos. Probá recargar la página.");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo: keyof Aviso, valor: string) => {
    setAviso((prev) => ({ ...prev, [campo]: valor }));
    setConfirmando(false);
    setResultado(null);
  };

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    // Primer toque: se pide confirmar, porque el aviso sale en el momento y no se puede deshacer.
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      const response = await fetch("/api/admin/notificaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(aviso) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo enviar el aviso.");
      setResultado(
        data.enviados > 0
          ? { ok: true, texto: `Aviso enviado a ${data.enviados} ${data.enviados === 1 ? "dispositivo" : "dispositivos"}.` }
          : { ok: false, texto: "El aviso no le llegó a nadie: todavía no hay dispositivos con las notificaciones activadas, o falló el envío." },
      );
      if (data.enviados > 0) setAviso(VACIO);
      cargar();
    } catch (error) {
      setResultado({ ok: false, texto: error instanceof Error ? error.message : "No se pudo enviar el aviso." });
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  };

  const listo = aviso.titulo.trim().length >= 3 && aviso.mensaje.trim().length >= 5;

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
        <h1 className="m-0 text-left font-display text-[clamp(2rem,5vw,2.75rem)] font-extrabold leading-tight tracking-tight text-brand-ink">Avisos al celular</h1>
        <p className="m-0 mt-3 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75">
          Escribí un aviso y les llega en el momento a todos los que activaron las notificaciones del sitio. Los eventos del calendario avisan solos si tienen tildado «Activar notificaciones». Las inscripciones también avisan solas: el día que abren, tres días antes de cerrar y el último día.
        </p>
        {cargaError && <p role="alert" className="m-0 mt-4 max-w-none rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800">{cargaError}</p>}
        {datos && (
          <p className="m-0 mt-4 inline-flex max-w-none items-center gap-2 rounded-full bg-brand-cream px-4 py-2 text-left text-sm font-bold text-brand-ink">
            <BellRing size={16} aria-hidden className="text-brand-brown" />
            {datos.suscriptores === 0 ? "Todavía nadie activó las notificaciones" : `${datos.suscriptores} ${datos.suscriptores === 1 ? "dispositivo las tiene activadas" : "dispositivos las tienen activadas"}`}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <form onSubmit={enviar} className={CARD}>
            <h2 className="m-0 text-left font-display text-xl font-extrabold text-brand-ink">Nuevo aviso</h2>

            {datos && datos.eventos.length > 0 && (
              <div className="mt-4 rounded-xl bg-brand-cream/70 p-4">
                <p className="m-0 max-w-none text-left text-sm font-bold text-brand-ink">Empezar con un aviso armado</p>
                <ul className="m-0 mt-3 list-none space-y-3 p-0">
                  {datos.eventos.map((evento) => (
                    <li key={evento.id}>
                      <p className="m-0 max-w-none text-left text-sm text-brand-ink/80">
                        {evento.nombre} <span className="text-brand-ink/60">· inscripción {evento.estado === "abierta" ? "abierta" : "todavía sin abrir"}</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {plantillas(evento).map((plantilla) => (
                          <button
                            key={plantilla.nombre}
                            type="button"
                            onClick={() => { setAviso(plantilla.aviso); setConfirmando(false); setResultado(null); }}
                            className="rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-brand-brown ring-1 ring-brand-brown/20 transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
                          >
                            {plantilla.nombre}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="aviso-titulo" className={LABEL}>Título</label>
                <input id="aviso-titulo" required maxLength={MAX_TITULO} value={aviso.titulo} onChange={(e) => cambiar("titulo", e.target.value)} className="modal-input-unified" />
                <p className="m-0 mt-1 max-w-none text-right text-xs tabular-nums text-brand-ink/55">{aviso.titulo.length} de {MAX_TITULO}</p>
              </div>
              <div>
                <label htmlFor="aviso-mensaje" className={LABEL}>Mensaje</label>
                <textarea id="aviso-mensaje" required rows={3} maxLength={MAX_MENSAJE} value={aviso.mensaje} onChange={(e) => cambiar("mensaje", e.target.value)} className="modal-input-unified resize-none" />
                <p className="m-0 mt-1 max-w-none text-right text-xs tabular-nums text-brand-ink/55">{aviso.mensaje.length} de {MAX_MENSAJE}</p>
              </div>
              <div>
                <label htmlFor="aviso-url" className={LABEL}>Página que se abre al tocarlo</label>
                <input id="aviso-url" required maxLength={200} value={aviso.url} onChange={(e) => cambiar("url", e.target.value)} placeholder="/inscripciones" aria-describedby="aviso-url-ayuda" className="modal-input-unified" />
                <p id="aviso-url-ayuda" className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/60">Una página de este sitio: / para el inicio, /inscripciones, /calendario, /noticias…</p>
              </div>
            </div>

            {resultado && (
              <p role="status" className={`m-0 mt-4 max-w-none rounded-xl border px-4 py-3 text-left text-sm font-medium ${resultado.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>{resultado.texto}</p>
            )}
            {confirmando && (
              <p role="alert" className="m-0 mt-4 max-w-none rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-900">
                El aviso sale ahora{datos ? ` a ${datos.suscriptores} ${datos.suscriptores === 1 ? "dispositivo" : "dispositivos"}` : ""} y no se puede deshacer. Tocá de nuevo para confirmar.
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              {confirmando && (
                <button type="button" onClick={() => setConfirmando(false)} disabled={enviando} className="rounded-full border border-brand-brown/25 px-5 py-2.5 text-sm font-bold text-brand-brown transition-colors hover:bg-brand-brown/10">Cancelar</button>
              )}
              <button type="submit" disabled={!listo || enviando} className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-50">
                {enviando ? <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Send size={16} aria-hidden />}
                {enviando ? "Enviando..." : confirmando ? "Sí, enviar ahora" : "Enviar aviso"}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <section aria-labelledby="vista-titulo" className={CARD}>
              <h2 id="vista-titulo" className="m-0 text-left font-display text-xl font-extrabold text-brand-ink">Así se va a ver</h2>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-stone-100 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-192x192.png" alt="" className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="m-0 max-w-none break-words text-left text-sm font-bold text-stone-900">{aviso.titulo || "Título del aviso"}</p>
                  <p className="m-0 mt-0.5 max-w-none break-words text-left text-sm leading-snug text-stone-700">{aviso.mensaje || "El mensaje aparece acá."}</p>
                </div>
              </div>
            </section>

            <section aria-labelledby="enviadas-titulo" className={CARD}>
              <h2 id="enviadas-titulo" className="m-0 text-left font-display text-xl font-extrabold text-brand-ink">Últimos enviados</h2>
              {!datos ? (
                <p className="m-0 mt-3 max-w-none text-left text-sm text-brand-ink/60">Cargando…</p>
              ) : datos.enviadas.length === 0 ? (
                <p className="m-0 mt-3 max-w-none text-left text-sm text-brand-ink/60">Todavía no se envió ningún aviso.</p>
              ) : (
                <ul className="m-0 mt-3 list-none divide-y divide-stone-200 p-0">
                  {datos.enviadas.map((item) => (
                    <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="m-0 max-w-none text-left text-sm font-bold text-brand-ink">{item.titulo}</p>
                      <p className="m-0 mt-0.5 max-w-none text-left text-sm leading-snug text-brand-ink/75">{item.mensaje}</p>
                      <p className="m-0 mt-1 max-w-none text-left text-xs text-brand-ink/55">{TIPO[item.tipo] ?? item.tipo} · {fechaHora(item.enviadoAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

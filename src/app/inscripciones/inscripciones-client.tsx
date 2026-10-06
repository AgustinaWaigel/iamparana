"use client";

import { CalendarDays, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Evento = {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  descripcion?: string;
};

const TALLY_FORM_URL = process.env.NEXT_PUBLIC_TALLY_FORM_URL?.trim() || "";

function parseDate(value: string) {
  const datePart = value.includes("T") ? value.split("T")[0] : value;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string) {
  return parseDate(value).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function tallyUrl(evento: Evento, embed = false) {
  if (!TALLY_FORM_URL) return "";
  const url = new URL(TALLY_FORM_URL);
  url.searchParams.set("evento", evento.evento);
  if (evento.id !== undefined) url.searchParams.set("evento_id", String(evento.id));
  if (embed) {
    url.searchParams.set("transparentBackground", "1");
    url.searchParams.set("dynamicHeight", "1");
  }
  return url.toString();
}

export default function InscripcionesClient() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selected, setSelected] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      try {
        const response = await fetch("/api/agenda", { signal: controller.signal });
        if (!response.ok) throw new Error("No pudimos cargar los eventos.");
        const data = (await response.json()) as Evento[];
        setEventos(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar los eventos.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadEvents();
    return () => controller.abort();
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventos
      .filter((evento) => parseDate(evento.fecha_fin || evento.fecha) >= today)
      .sort((a, b) => parseDate(a.fecha).getTime() - parseDate(b.fecha).getTime());
  }, [eventos]);

  if (loading) {
    return <div className="flex items-center justify-center gap-3 py-20 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Cargando próximos eventos...</div>;
  }

  if (error) {
    return <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-semibold text-red-700">{error}</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]">
      <section aria-labelledby="eventos-disponibles">
        <h2 id="eventos-disponibles" className="text-xl font-extrabold text-brand-brown">Eventos disponibles</h2>
        <p className="mt-2 text-sm text-slate-600">Elegí una actividad para completar su inscripción.</p>

        {upcomingEvents.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Por el momento no hay eventos próximos publicados.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {upcomingEvents.map((evento, index) => {
              const active = selected === evento;
              return (
                <article key={evento.id ?? `${evento.fecha}-${index}`} className={`rounded-2xl border bg-white p-5 shadow-sm transition ${active ? "border-brand-gold ring-2 ring-brand-gold/20" : "border-slate-200 hover:border-brand-gold/60"}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-brown"><CalendarDays className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-brand-brown">{evento.evento}</h3>
                      <p className="mt-1 text-xs font-bold capitalize text-slate-500">{formatDate(evento.fecha)}</p>
                    </div>
                  </div>
                  {evento.descripcion && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{evento.descripcion}</p>}
                  <button type="button" disabled={!TALLY_FORM_URL} onClick={() => setSelected(evento)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-brown px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-wood disabled:cursor-not-allowed disabled:opacity-45">
                    {active && <CheckCircle2 className="h-4 w-4" />}
                    {active ? "Evento seleccionado" : "Inscribirme"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="formulario-inscripcion" className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-3xl border border-brand-gold/30 bg-white shadow-xl">
          <div className="bg-brand-deep px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">Formulario de inscripción</p>
            <h2 id="formulario-inscripcion" className="mt-1 text-xl font-extrabold">{selected?.evento || "Seleccioná un evento"}</h2>
          </div>

          {!TALLY_FORM_URL ? (
            <div className="p-8 text-center">
              <p className="font-bold text-brand-brown">Falta conectar el formulario de Tally</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Agregá la variable <code className="rounded bg-slate-100 px-1.5 py-0.5">NEXT_PUBLIC_TALLY_FORM_URL</code> con la URL pública del formulario.</p>
            </div>
          ) : selected ? (
            <div>
              <iframe title={`Inscripción a ${selected.evento}`} src={tallyUrl(selected, true)} className="min-h-[650px] w-full border-0" loading="lazy" />
              <div className="border-t border-slate-100 p-3 text-center">
                <a href={tallyUrl(selected)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-brown hover:underline">Abrir formulario en otra pestaña <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center text-slate-500">
              <CalendarDays className="mb-4 h-12 w-12 text-brand-gold" />
              <p className="max-w-xs text-sm leading-relaxed">Cuando elijas un evento, el formulario aparecerá acá con la actividad ya identificada.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

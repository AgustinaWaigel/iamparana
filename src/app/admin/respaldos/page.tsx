"use client";

import { useCallback, useEffect, useState } from "react";
import { DatabaseBackup, Loader2, ShieldCheck } from "lucide-react";

// Copias de seguridad de la base: cuáles hay y un botón para hacer una ahora.

type Respaldo = { nombre: string; creado: string; peso: number };

const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6";

function fecha(iso: string) {
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? iso : valor.toLocaleString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function peso(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function RespaldosPage() {
  const [respaldos, setRespaldos] = useState<Respaldo[] | null>(null);
  const [haciendo, setHaciendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/respaldos", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudieron cargar las copias.");
      setRespaldos(data.respaldos);
    } catch (error) {
      setRespaldos([]);
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudieron cargar las copias." });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hacer = async () => {
    setHaciendo(true);
    setMensaje(null);
    try {
      const response = await fetch("/api/admin/respaldos", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo hacer la copia.");
      setMensaje({ ok: true, texto: `Copia hecha: ${data.tablas} tablas y ${data.filas} registros.` });
      await cargar();
    } catch (error) {
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudo hacer la copia." });
    } finally {
      setHaciendo(false);
    }
  };

  const ultima = respaldos?.[0];
  const diasDesdeUltima = ultima ? Math.floor((Date.now() - new Date(ultima.creado).getTime()) / 86_400_000) : null;

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
        <h1 className="m-0 text-left font-display text-[clamp(2rem,5vw,2.75rem)] font-extrabold leading-tight tracking-tight text-brand-ink">Copias de seguridad</h1>
        <p className="m-0 mt-3 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75">
          Una vez por semana el sitio guarda una copia de toda la base de datos en el Google Drive de la IAM. Si algún día se pierden datos, se pueden recuperar desde ahí.
        </p>

        <section className={`${CARD} mt-8`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-left font-display text-xl font-extrabold text-brand-ink">Última copia</h2>
              <p className="m-0 mt-1 max-w-none text-left text-base text-brand-ink/80">
                {respaldos === null ? "Consultando…" : ultima ? `${fecha(ultima.creado)} · ${peso(ultima.peso)}` : "Todavía no hay ninguna copia."}
              </p>
              {diasDesdeUltima !== null && diasDesdeUltima > 9 && (
                <p role="alert" className="m-0 mt-2 max-w-none rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm font-medium text-amber-900">
                  Pasaron {diasDesdeUltima} días desde la última copia. La copia semanal puede estar fallando: avisá a quien mantiene el sitio.
                </p>
              )}
            </div>
            <button type="button" onClick={hacer} disabled={haciendo} className="inline-flex items-center gap-2 rounded-full bg-brand-brown px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-brand-wood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown disabled:opacity-60">
              {haciendo ? <Loader2 size={17} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <DatabaseBackup size={17} aria-hidden />}
              {haciendo ? "Haciendo la copia..." : "Hacer una copia ahora"}
            </button>
          </div>
          {mensaje && <p role="status" className={`m-0 mt-4 max-w-none rounded-xl border px-4 py-3 text-left text-sm font-medium ${mensaje.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>{mensaje.texto}</p>}
        </section>

        <section className={`${CARD} mt-6`}>
          <h2 className="m-0 text-left font-display text-xl font-extrabold text-brand-ink">Copias guardadas</h2>
          <p className="m-0 mt-1 max-w-none text-left text-sm text-brand-ink/65">Se conservan las últimas 8. Las más viejas se borran solas.</p>
          {respaldos && respaldos.length > 0 && (
            <ul className="m-0 mt-4 list-none divide-y divide-stone-200 p-0">
              {respaldos.map((item) => (
                <li key={item.nombre} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
                  <span className="text-base text-brand-ink first-letter:uppercase">{fecha(item.creado)}</span>
                  <span className="text-sm tabular-nums text-brand-ink/60">{peso(item.peso)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-cream p-5">
          <ShieldCheck size={22} aria-hidden className="mt-0.5 shrink-0 text-brand-brown" />
          <div className="text-left text-sm leading-relaxed text-brand-ink/80">
            <p className="m-0 max-w-none text-left font-bold text-brand-ink">Cómo están protegidas</p>
            <p className="m-0 mt-1 max-w-none text-left">
              Cada copia se guarda cifrada en una carpeta privada del Drive, que no se comparte con nadie. Sin la clave del sitio no se puede leer. No la muevas, no la compartas y no la descargues: para recuperar datos hace falta quien mantiene el sitio.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

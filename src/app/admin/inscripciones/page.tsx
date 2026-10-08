import Link from "next/link";
import { ArrowRight, ClipboardPen } from "lucide-react";
import { formatFecha } from "@/app/inscripciones/ui";
import { countInscriptosPorEvento } from "@/server/db/inscripciones-admin-repository";
import { requireAdminPage } from "@/server/lib/admin-page";
import { listEventosConfigurados, type EstadoInscripcion } from "@/server/lib/inscripciones-eventos";
import { GruposManager } from "./grupos-manager";

// Administración de inscripciones: los eventos con inscripción (cada uno con su
// resumen, inscriptos y logística) y los grupos IAM.

export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoInscripcion, { label: string; className: string }> = {
  abierta: { label: "Inscripción abierta", className: "bg-emerald-100 text-emerald-900" },
  proxima: { label: "Todavía no abrió", className: "bg-amber-100 text-amber-900" },
  cerrada: { label: "Inscripción cerrada", className: "bg-stone-200 text-stone-800" },
  finalizado: { label: "Evento terminado", className: "bg-stone-200 text-stone-800" },
  apagada: { label: "Inscripción apagada", className: "bg-stone-200 text-stone-800" },
};

export default async function AdminInscripcionesPage() {
  await requireAdminPage();
  const [eventos, conteos] = await Promise.all([
    listEventosConfigurados().catch(() => null),
    countInscriptosPorEvento().catch(() => new Map<string, { total: number; pendientes: number }>()),
  ]);

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-10 pt-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="flex items-center gap-3 text-3xl font-black text-brand-brown">
          <ClipboardPen className="text-amber-600" aria-hidden /> Inscripciones
        </h1>
        <p className="mt-2 text-stone-500">
          Entrá a un evento para ver el resumen, la lista de inscriptos y la vista de logística. La inscripción de cada evento se activa desde el calendario, al editarlo.
        </p>

        <section aria-labelledby="eventos" className="mt-8">
          <h2 id="eventos" className="text-xl font-black text-brand-brown">Eventos con inscripción</h2>

          {eventos === null ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-medium text-red-700">No se pudieron cargar los eventos. Probá de nuevo en unos minutos.</p>
          ) : eventos.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
              Todavía no hay eventos con inscripción. Activala desde <Link href="/calendario" className="font-bold text-brand-brown underline">el calendario</Link>, editando un evento.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {eventos.map((evento) => {
                const conteo = conteos.get(evento.id) ?? { total: 0, pendientes: 0 };
                return (
                  <li key={evento.id} className="group relative rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-brown/40">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-stone-800">
                          <Link href={`/admin/inscripciones/${encodeURIComponent(evento.id)}`} className="text-stone-800 no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-brown">
                            {evento.evento}
                          </Link>
                        </h3>
                        <p className="mt-0.5 text-sm font-semibold text-stone-500 first-letter:uppercase">
                          {formatFecha(evento.fecha)}
                          {evento.fechaFin && evento.fechaFin !== evento.fecha ? ` al ${formatFecha(evento.fechaFin)}` : ""}
                        </p>
                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-stone-700">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${ESTADO[evento.estado].className}`}>{ESTADO[evento.estado].label}</span>
                          <span><strong className="font-black">{conteo.total}</strong> {conteo.total === 1 ? "inscripto" : "inscriptos"}</span>
                          {conteo.pendientes > 0 && <span>{conteo.pendientes} sin firmar</span>}
                        </p>
                      </div>
                      <ArrowRight size={20} aria-hidden className="mt-1 shrink-0 text-brand-brown transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="cuentas" className="mt-12">
          <h2 id="cuentas" className="text-xl font-black text-brand-brown">Cuentas familiares</h2>
          <p className="mt-1 text-stone-500">Para ayudar a una familia que perdió el acceso a su email, cambió el adulto responsable o necesita quitarle el acceso a alguien.</p>
          <Link href="/admin/inscripciones/cuentas" className="btn-secondary mt-4 inline-flex px-4 py-2 no-underline">Buscar una cuenta</Link>
        </section>

        <GruposManager />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, UsersRound } from "lucide-react";
import { listGruposDeAnimador } from "@/server/db/animadores-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { listEventosConInscripcion } from "@/server/lib/inscripciones-eventos";
import { CARD_CLASS, SECONDARY_BUTTON, formatFecha } from "./ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscripciones",
  description: "Inscribite a los próximos encuentros y actividades de IAM Paraná.",
};

export default async function InscripcionesPage() {
  const listado = await listEventosConInscripcion().catch(() => null);
  const eventos = listado?.abiertos ?? null;
  const proximos = listado?.proximos ?? [];
  // El acceso de animador lo da el admin; a quien lo tiene se le muestra el enlace a su lista.
  const usuario = await getSessionUser();
  const esAnimador = usuario ? (await listGruposDeAnimador(usuario.id).catch(() => [])).length > 0 : false;

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <h1 className="m-0 text-balance text-left font-display text-[clamp(2rem,7vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-ink">
          Inscripciones a eventos
        </h1>
        <p className="m-0 mt-4 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75 sm:text-lg">
          Encontrá la próxima actividad de IAM Paraná y completá tu inscripción de manera sencilla y segura.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/inscripciones/cuenta" className={SECONDARY_BUTTON}>
            <UsersRound size={16} aria-hidden />
            Mi cuenta familiar
          </Link>
          {esAnimador && (
            <Link href="/inscripciones/mi-iam" className={SECONDARY_BUTTON}>
              <ClipboardList size={16} aria-hidden />
              Inscriptos de mi IAM
            </Link>
          )}
        </div>

        <h2 className="m-0 mb-5 mt-12 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">
          Eventos con inscripción abierta
        </h2>

        {eventos === null ? (
          <p role="alert" className="m-0 max-w-none rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-left text-base text-red-800">
            No pudimos cargar los eventos. Probá de nuevo en unos minutos.
          </p>
        ) : eventos.length === 0 ? (
          <p className="m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-10 text-center text-base text-brand-ink/65">
            Por el momento no hay eventos con inscripción abierta.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-4 p-0">
            {eventos.map((evento) => (
              <li key={evento.id} className={`${CARD_CLASS} group relative p-5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(58,21,8,0.5)] motion-reduce:transform-none sm:p-6`}>
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-brand-brown">
                    <CalendarDays size={22} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-left font-display text-xl font-bold leading-snug text-brand-ink">
                      <Link
                        href={`/inscripciones/${encodeURIComponent(evento.id)}`}
                        className="text-brand-ink no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand-brown"
                      >
                        {evento.evento}
                      </Link>
                    </h3>
                    <p className="m-0 mt-1 max-w-none text-left text-sm font-semibold text-brand-ink/65 first-letter:uppercase">
                      {formatFecha(evento.fecha)}
                      {evento.fechaFin && evento.fechaFin !== evento.fecha ? ` al ${formatFecha(evento.fechaFin)}` : ""}
                    </p>
                    {evento.descripcion && (
                      <p className="m-0 mt-3 line-clamp-3 max-w-none text-left text-[15px] leading-relaxed text-brand-ink/75">{evento.descripcion}</p>
                    )}
                    {evento.config.cierraAt && (
                      <p className="m-0 mt-3 max-w-none text-left text-sm text-brand-ink/65">
                        La inscripción cierra el {formatFecha(evento.config.cierraAt)}.
                      </p>
                    )}
                  </div>
                  <ArrowRight size={20} aria-hidden className="mt-1 shrink-0 text-brand-brown transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {proximos.length > 0 && (
          <>
            <h2 className="m-0 mb-5 mt-12 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">
              Próximamente
            </h2>
            <ul className="m-0 list-none space-y-3 p-0">
              {proximos.map((evento) => (
                <li key={evento.id} className="rounded-2xl border border-dashed border-brand-brown/25 px-5 py-4">
                  <h3 className="m-0 text-left font-display text-lg font-bold leading-snug text-brand-ink">{evento.evento}</h3>
                  <p className="m-0 mt-1 max-w-none text-left text-sm font-semibold text-brand-ink/65 first-letter:uppercase">
                    {formatFecha(evento.fecha)}
                    {evento.fechaFin && evento.fechaFin !== evento.fecha ? ` al ${formatFecha(evento.fechaFin)}` : ""}
                  </p>
                  {evento.config.abreAt && (
                    <p className="m-0 mt-2 max-w-none text-left text-sm text-brand-ink/75">
                      La inscripción abre el {formatFecha(evento.config.abreAt)}.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

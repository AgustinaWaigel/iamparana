import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listAnimadoresDeGrupo, listGruposDeAnimador, listInscriptosDeGrupos, type InscriptoDeGrupo } from "@/server/db/animadores-repository";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { listEventosConfigurados } from "@/server/lib/inscripciones-eventos";
import { EDAD_ADULTO, ageOn } from "@/server/lib/inscripciones-validation";
import { estiloIam } from "../colores";
import { GRADOS } from "../grados";
import { CARD_CLASS, PRIMARY_BUTTON, ROL_LABEL, formatFecha } from "../ui";
import { CoordinadorAnimadores } from "./coordinador-animadores";

// Para animadores: quiénes de SU IAM están inscriptos en un evento, ordenados por grado.
// El acceso lo da el admin, IAM por IAM. Se muestra lo justo para organizarse: sin
// fichas de salud, contactos, CUIL ni pagos. Cada vez que se abre queda registrado.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscriptos de mi IAM",
  robots: { index: false, follow: false },
};

const ADULTOS = "Animadores y acompañantes";
const SIN_GRADO = "Sin grado cargado";

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <div role="navigation" aria-label="Ruta de navegación" className="mb-4">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm font-bold text-brand-brown">
            <li><Link href="/inscripciones" className="rounded text-brand-brown no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown">Inscripciones</Link></li>
            <li aria-hidden><ChevronRight size={14} className="opacity-60" /></li>
          </ol>
        </div>
        <h1 className="m-0 text-balance text-left font-display text-[clamp(2rem,7vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-brand-ink">
          Inscriptos de mi IAM
        </h1>
        {children}
      </div>
    </div>
  );
}

const AVISO = "m-0 mt-6 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-8 text-left text-base leading-relaxed text-brand-ink/75";

export default async function MiIamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Marco>
        <p className={AVISO}>Esta página es para animadores. Entrá con tu usuario del sitio para ver a los inscriptos de tu IAM.</p>
        <Link href="/auth/login" className={`${PRIMARY_BUTTON} mt-5`}>Iniciar sesión</Link>
      </Marco>
    );
  }

  const grupos = await listGruposDeAnimador(user.id);
  if (grupos.length === 0) {
    return (
      <Marco>
        <p className={AVISO}>
          Tu usuario todavía no tiene asignada una IAM. Si sos animador/a, indicá tu IAM en tu perfil; cuando el equipo de IAM Paraná lo confirme, vas a ver acá a los inscriptos de tu grupo.
        </p>
        <Link href="/auth/perfil" className={`${PRIMARY_BUTTON} mt-5`}>Ir a mi perfil</Link>
      </Marco>
    );
  }

  const query = await searchParams;
  // Eventos con inscripción que todavía no terminaron; el más próximo primero.
  const eventos = (await listEventosConfigurados()).filter((evento) => evento.config.habilitada && evento.estado !== "finalizado");
  const evento = eventos.find((item) => item.id === query.evento) ?? eventos[0];
  if (!evento) {
    return (
      <Marco>
        <p className={AVISO}>Por el momento no hay eventos con inscripción.</p>
      </Marco>
    );
  }

  // Solo se consultan las IAM a las que este usuario tiene acceso.
  const inscriptos = await listInscriptosDeGrupos(evento.id, grupos.map((grupo) => grupo.id));
  await recordAuditEvent({ actor: user, action: "ver", entityType: "inscripciones_mi_iam", entityId: evento.id, metadata: { grupos: grupos.length, inscriptos: inscriptos.length } }).catch(() => undefined);

  // Quien coordina una IAM ve, además, quiénes son sus animadores y los pedidos pendientes.
  const animadoresPorGrupo = new Map(await Promise.all(grupos.filter((grupo) => grupo.esCoordinador).map(async (grupo) => [grupo.id, await listAnimadoresDeGrupo(grupo.id)] as const)));

  /** En qué bloque va cada persona: su grado si es menor; los adultos, todos juntos al final. */
  const bloqueDe = (row: InscriptoDeGrupo) => {
    const edad = row.fechaNacimiento ? ageOn(row.fechaNacimiento, evento.fecha) : null;
    if (edad !== null && edad >= EDAD_ADULTO) return ADULTOS;
    return row.grado ?? SIN_GRADO;
  };
  const ORDEN = [...GRADOS, SIN_GRADO, ADULTOS] as string[];
  const posicion = (bloque: string) => (ORDEN.includes(bloque) ? ORDEN.indexOf(bloque) : GRADOS.length);

  return (
    <Marco>
      <p className="m-0 mt-4 max-w-none text-left text-base leading-relaxed text-brand-ink/75">
        Es la lista de tu grupo para organizarte. Los datos de salud y de contacto los tiene el equipo a cargo del evento.
      </p>

      {eventos.length > 1 && (
        <div role="navigation" aria-label="Eventos" className="mt-6 flex flex-wrap gap-2">
          {eventos.map((item) => (
            <Link
              key={item.id}
              href={`/inscripciones/mi-iam?evento=${encodeURIComponent(item.id)}`}
              aria-current={item.id === evento.id ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-bold no-underline transition-colors ${item.id === evento.id ? "border-brand-brown bg-brand-brown text-white" : "border-brand-brown/25 bg-white text-brand-brown hover:bg-brand-cream"}`}
            >
              {item.evento}
            </Link>
          ))}
        </div>
      )}

      <h2 className="m-0 mt-8 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">{evento.evento}</h2>
      <p className="m-0 mt-1 max-w-none text-left text-sm font-semibold text-brand-ink/65 first-letter:uppercase">
        {formatFecha(evento.fecha)}
        {evento.fechaFin && evento.fechaFin !== evento.fecha ? ` al ${formatFecha(evento.fechaFin)}` : ""}
      </p>

      <div className="mt-6 space-y-8">
        {grupos.map((grupo) => {
          const delGrupo = inscriptos.filter((row) => row.grupoId === grupo.id);
          const bloques = [...new Set(delGrupo.map(bloqueDe))].sort((a, b) => posicion(a) - posicion(b));
          return (
            <section key={grupo.id} aria-labelledby={`iam-${grupo.id}`}>
              <h3 id={`iam-${grupo.id}`} className="m-0 rounded-xl bg-brand-cream px-4 py-3 text-left font-display text-lg font-bold text-brand-ink" style={estiloIam(grupo.color)}>
                {grupo.nombre}{grupo.ciudad ? ` (${grupo.ciudad})` : ""} · {delGrupo.length} {delGrupo.length === 1 ? "inscripto" : "inscriptos"}
              </h3>

              {animadoresPorGrupo.has(grupo.id) && <CoordinadorAnimadores grupoId={grupo.id} animadores={animadoresPorGrupo.get(grupo.id)!} />}

              {delGrupo.length === 0 ? (
                <p className="m-0 mt-3 max-w-none text-left text-base text-brand-ink/65">Todavía no hay nadie inscripto de este grupo.</p>
              ) : (
                <div className="mt-3 space-y-4">
                  {bloques.map((bloque) => {
                    const filas = delGrupo.filter((row) => bloqueDe(row) === bloque);
                    return (
                      <div key={bloque} className={`${CARD_CLASS} overflow-hidden`}>
                        <p className="m-0 max-w-none border-b border-brand-brown/10 bg-white px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-brand-brown">
                          {bloque} · {filas.length}
                        </p>
                        <ul className="m-0 list-none divide-y divide-brand-brown/10 p-0">
                          {filas.map((row, index) => (
                            <li key={`${row.apellido}-${row.nombre}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                              <span className="min-w-0 text-base text-brand-ink">
                                <strong className="font-bold">{row.apellido}, {row.nombre}</strong>
                                {bloque === ADULTOS && <span className="text-sm text-brand-ink/65"> · {ROL_LABEL[row.rol] ?? row.rol}</span>}
                              </span>
                              <span className={`text-sm font-semibold ${row.autorizacionFirmada ? "text-brand-ink/65" : "text-amber-800"}`}>
                                {row.autorizacionFirmada ? "Autorización firmada" : "Falta la autorización"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Marco>
  );
}

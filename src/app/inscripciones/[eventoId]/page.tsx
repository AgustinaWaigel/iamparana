import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listAdultosConAcceso } from "@/server/db/cuentas-repository";
import { getImagenVigente, listGrupos, listInscripcionesConFirmas, listPersonasConFirmaEvento, listPersonasDeCuenta } from "@/server/db/inscripciones-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { getCuentaSesion } from "@/server/lib/cuenta-session";
import { estadoInscripcion, getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { textoAutorizacionEvento, textoAutorizacionImagen } from "@/server/lib/inscripciones-textos";
import { EDAD_ADULTO, ageOn, todayYmd } from "@/server/lib/inscripciones-validation";
import { AdultoFirma } from "../adulto-firma";
import { BajaBoton } from "../baja-boton";
import { Autorizaciones } from "../autorizaciones";
import { CuentaAcceso, CuentaSalir } from "../cuenta/cuenta-acceso";
import { InscripcionFlow } from "../inscripcion-flow";
import { CARD_CLASS, ESTADO_LABEL, ROL_LABEL, formatFecha } from "../ui";
import { EventoHero } from "./evento-hero";
import { EventoInfoPublica } from "./evento-info";
import { EVENTO_INFO_VACIA, getEventoInfo } from "@/server/db/evento-info-repository";

// Inscripción a un evento. Todo se decide en el servidor: si el evento está abierto,
// quién es la cuenta y qué personas puede ver. El navegador recibe solo eso.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscripción",
  robots: { index: false, follow: false },
};

export default async function InscripcionEventoPage({ params }: { params: Promise<{ eventoId: string }> }) {
  const { eventoId: rawId } = await params;
  const evento = await getEventoConInscripcion(decodeURIComponent(rawId));
  if (!evento || !evento.config.habilitada) notFound();

  const estado = estadoInscripcion(evento, evento.config);
  const abierta = estado === "abierta";
  // Información práctica (lugar, qué llevar, cómo pagar): si no se puede leer, la página sigue sin ella.
  const info = await getEventoInfo(evento.id).catch(() => EVENTO_INFO_VACIA);
  const { abreAt, cierraAt } = evento.config;
  const motivo =
    estado === "proxima" && abreAt ? `La inscripción a este evento abre el ${formatFecha(abreAt)}.`
    : estado === "cerrada" && cierraAt ? `La inscripción a este evento cerró el ${formatFecha(cierraAt)}.`
    : estado === "finalizado" ? "Este evento ya pasó."
    : "La inscripción a este evento no está abierta en este momento.";
  // La cuenta se resuelve aunque la inscripción esté cerrada: puede quedar una autorización por firmar.
  const cuenta = await getCuentaSesion();
  const usuarioSitio = await getSessionUser();
  const usuario = abierta && !cuenta ? usuarioSitio : null;
  const esAdmin = usuarioSitio?.role === "admin";

  return (
    <div className="min-h-screen bg-brand-paper">
      <EventoHero
        nombre={evento.evento}
        fecha={evento.fecha}
        fechaFin={evento.fechaFin}
        descripcion={evento.descripcion}
        estado={estado}
        abreAt={abreAt}
        cierraAt={cierraAt}
      />
      {estado !== "finalizado" && <EventoInfoPublica eventoId={evento.id} info={info} montos={evento.config.montos} cierraAt={cierraAt} />}
      <div id="inscripcion" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        {esAdmin && (
          <p className="m-0 mb-8 flex max-w-none flex-wrap gap-x-5 gap-y-2 rounded-xl border border-dashed border-brand-brown/30 px-4 py-3 text-left text-sm font-bold">
            <span className="font-normal text-brand-ink/65">Solo lo ves vos, como admin:</span>
            <Link href={`/admin/inscripciones/${encodeURIComponent(evento.id)}?vista=config`} className="text-brand-brown underline">Editar el evento y su inscripción</Link>
            <Link href={`/admin/inscripciones/${encodeURIComponent(evento.id)}`} className="text-brand-brown underline">Ver inscriptos</Link>
          </p>
        )}

        <div>
          {!abierta && (
            <p className="m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-10 text-center text-base text-brand-ink/70">
              {motivo}
            </p>
          )}
          {!abierta && !cuenta ? null : !cuenta ? (
            <>
              <p className="m-0 mb-5 max-w-none text-left text-base leading-relaxed text-brand-ink/75">
                Para inscribirte, entrá con tu email. Si es la primera vez, vas a cargar tus datos y los de los chicos a tu cargo una sola vez.
              </p>
              <section className={`${CARD_CLASS} p-6 sm:p-8`}>
                <CuentaAcceso emailUsuario={usuario?.email} />
              </section>
            </>
          ) : (
            <EventoConCuenta
              cuentaId={cuenta.cuentaId}
              email={cuenta.email}
              via={cuenta.via}
              tieneConsentimiento={Boolean(cuenta.consentimientoAt)}
              eventoId={evento.id}
              eventoFecha={evento.fecha}
              abierta={abierta}
              cerrada={estado === "cerrada"}
              textoEvento={textoAutorizacionEvento(evento, evento.config.autorizacionTexto)}
              textoImagen={textoAutorizacionImagen(todayYmd())}
              config={{
                roles: evento.config.roles,
                edadMin: evento.config.edadMin,
                edadMax: evento.config.edadMax,
                preguntas: evento.config.preguntas,
                pideSalud: evento.config.pideSalud,
                montos: evento.config.montos,
                cierraAt: evento.config.cierraAt,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

async function EventoConCuenta(props: {
  cuentaId: string;
  email: string;
  via: "codigo" | "usuario";
  tieneConsentimiento: boolean;
  eventoId: string;
  eventoFecha: string;
  abierta: boolean;
  /** true si la fecha de cierre ya pasó y el evento todavía no terminó: se puede dar de baja, pero se paga igual. */
  cerrada: boolean;
  textoEvento: string;
  textoImagen: string;
  config: React.ComponentProps<typeof InscripcionFlow>["config"];
}) {
  const [personas, grupos, inscripciones, imagen, adultosConAcceso, firmadas] = await Promise.all([
    listPersonasDeCuenta(props.cuentaId),
    listGrupos(true),
    listInscripcionesConFirmas(props.cuentaId, props.eventoId),
    getImagenVigente(props.cuentaId),
    listAdultosConAcceso(props.cuentaId),
    listPersonasConFirmaEvento(props.cuentaId, props.eventoId),
  ]);
  const pendientes = inscripciones
    .filter((item) => !item.firmaEventoId || item.imagen === null)
    .map((item) => ({
      personaId: item.personaId,
      nombre: `${item.nombre} ${item.apellido}`,
      faltaFirma: !item.firmaEventoId,
      faltaImagen: item.imagen === null,
    }));
  const titular = personas.find((persona) => persona.esTitular);
  // Quien inscribe y todavía es menor no firma: firma un adulto desde su propio email.
  const titularMenor = Boolean(titular?.fechaNacimiento) && ageOn(titular!.fechaNacimiento!, todayYmd()) < EDAD_ADULTO;
  const adultos = titularMenor ? adultosConAcceso.map((adulto) => adulto.email) : [];
  // Con la inscripción cerrada solo queda a la vista lo que falte firmar.
  if (!props.abierta && inscripciones.length === 0) return null;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 max-w-none text-left text-sm text-brand-ink/70">
          Entraste como <strong className="break-all font-bold text-brand-ink">{props.email}</strong>
        </p>
        {props.via === "codigo" && <CuentaSalir />}
      </div>
      {/* Inscripciones que quedaron sin firmar: van primero, para que no se pasen por alto. */}
      {inscripciones.length > 0 && (
        <section aria-labelledby="paso-firma" className={pendientes.length > 0 ? "mb-12 scroll-mt-24" : ""} id="paso-firma-seccion">
          {pendientes.length > 0 && (
            <>
              <h2 id="paso-firma" className="m-0 mb-1 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">Falta firmar</h2>
              <p className="m-0 mb-5 mt-1.5 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">
                Sin la firma de un adulto, la inscripción de {pendientes.map((item) => item.nombre).join(", ")} queda pendiente.
              </p>
            </>
          )}
          {titularMenor && pendientes.length > 0 ? (
            <AdultoFirma eventoId={props.eventoId} adultos={adultos} />
          ) : (
            <Autorizaciones
              eventoId={props.eventoId}
              textoEvento={props.textoEvento}
              textoImagen={props.textoImagen}
              pendientes={pendientes}
              firmanteSugerido={titular ? `${titular.nombre} ${titular.apellido}` : ""}
            />
          )}
        </section>
      )}

      {props.cerrada && inscripciones.length > 0 && (
        <section aria-labelledby="tus-inscriptos">
          <h2 id="tus-inscriptos" className="m-0 mb-1 text-left font-display text-2xl font-extrabold tracking-tight text-brand-ink">Tus inscriptos</h2>
          <p className="m-0 mb-5 mt-1.5 max-w-none text-left text-sm leading-relaxed text-brand-ink/65">
            La inscripción ya cerró, así que no se pueden modificar los datos. Si das de baja a alguien ahora, igual corresponde pagar.
          </p>
          <ul className="m-0 list-none space-y-3 p-0">
            {inscripciones.map((item) => (
              <li key={item.id} className={`${CARD_CLASS} flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-5`}>
                <div className="min-w-0">
                  <p className="m-0 max-w-none text-left font-display text-lg font-bold leading-snug text-brand-ink">{item.nombre} {item.apellido}</p>
                  <p className="m-0 mt-1 max-w-none text-left text-sm text-brand-ink/65">{ROL_LABEL[item.rol] ?? item.rol} · {ESTADO_LABEL[item.estado] ?? item.estado}</p>
                </div>
                <BajaBoton eventoId={props.eventoId} personaId={item.personaId} nombre={item.nombre} fueraDeTermino />
              </li>
            ))}
          </ul>
        </section>
      )}

      {props.abierta && (
        <InscripcionFlow
          eventoId={props.eventoId}
          eventoFecha={props.eventoFecha}
          config={props.config}
          personas={personas}
          grupos={grupos}
          inscripciones={inscripciones}
          tieneConsentimiento={props.tieneConsentimiento}
          firmadas={firmadas}
          imagenVigente={Object.fromEntries(imagen)}
          textoEvento={props.textoEvento}
          textoImagen={props.textoImagen}
          titularMenor={titularMenor}
          adultos={adultos}
        />
      )}
    </>
  );
}

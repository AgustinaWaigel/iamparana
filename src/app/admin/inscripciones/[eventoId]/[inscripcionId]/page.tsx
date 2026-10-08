import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download } from "lucide-react";
import { formatMonto } from "@/app/inscripciones/montos";
import { AREA_LABEL, ESTADO_LABEL, ROL_LABEL } from "@/app/inscripciones/ui";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { listInscriptosEvento } from "@/server/db/inscripciones-admin-repository";
import { requireAdminPage } from "@/server/lib/admin-page";
import { getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { edadEnEvento } from "@/server/lib/inscripciones-resumen";

// Ficha completa de un inscripto: salud, contactos y autorizaciones. Es lo más
// sensible del panel, así que cada vez que se abre queda registrado quién fue.

export const dynamic = "force-dynamic";

const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";
const H2 = "text-sm font-black uppercase tracking-widest text-brand-brown";
const SEXO_LABEL: Record<string, string> = { F: "Femenino", M: "Masculino", X: "X" };

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="m-0 mt-0.5 break-words text-base text-stone-900">{children || "—"}</dd>
    </div>
  );
}

export default async function AdminFichaPage({ params }: { params: Promise<{ eventoId: string; inscripcionId: string }> }) {
  const user = await requireAdminPage();
  const { eventoId: rawId, inscripcionId } = await params;
  const eventoId = decodeURIComponent(rawId);

  const [evento, inscriptos] = await Promise.all([getEventoConInscripcion(eventoId), listInscriptosEvento(eventoId)]);
  const row = inscriptos.find((item) => item.inscripcionId === inscripcionId);
  if (!evento || !row) notFound();

  await recordAuditEvent({ actor: user, action: "ver", entityType: "inscripcion_ficha", entityId: inscripcionId, metadata: { eventoId } }).catch(() => undefined);

  const base = `/admin/inscripciones/${encodeURIComponent(eventoId)}`;
  const condiciones = [
    { label: "Enfermedad o condición médica", value: row.salud?.enfermedad },
    { label: "Medicación", value: row.salud?.medicacion },
    { label: "Alergias", value: row.salud?.alergias },
    { label: "Dieta especial", value: row.salud?.dieta },
  ];
  const preguntas = evento.config.preguntas.filter((pregunta) => row.respuestas[pregunta.id]);
  const pdf = "inline-flex items-center gap-1.5 text-sm font-bold text-brand-brown underline-offset-2 hover:underline";

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-16 pt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div role="navigation" aria-label="Ruta de navegación">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm font-bold text-brand-brown">
            <li><Link href="/admin/inscripciones" className="text-brand-brown hover:underline">Inscripciones</Link></li>
            <li aria-hidden><ChevronRight size={14} className="opacity-60" /></li>
            <li><Link href={`${base}?vista=lista`} className="text-brand-brown hover:underline">{evento.evento}</Link></li>
            <li aria-hidden><ChevronRight size={14} className="opacity-60" /></li>
          </ol>
        </div>
        <h1 className="mt-2 text-3xl font-black text-brand-brown">{row.nombre} {row.apellido}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {ROL_LABEL[row.rol] ?? row.rol} · {ESTADO_LABEL[row.estado] ?? row.estado}
          {row.esPrueba ? " · Persona de prueba" : ""}
        </p>

        <div className="mt-6 space-y-5">
          <section className={CARD} aria-labelledby="f-datos">
            <h2 id="f-datos" className={H2}>Datos</h2>
            <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-3">
              <Dato label="Edad en el evento">{edadEnEvento(row, evento.fecha)}</Dato>
              <Dato label="Sexo">{row.sexo ? SEXO_LABEL[row.sexo] ?? row.sexo : null}</Dato>
              <Dato label="Grado">{row.grado}</Dato>
              <Dato label="IAM">{row.grupoNombre}</Dato>
              <Dato label="Ciudad">{row.ciudad}</Dato>
              <Dato label="Teléfono">{row.telefono}</Dato>
              {row.area && <Dato label="Área">{AREA_LABEL[row.area] ?? row.area}</Dato>}
              {row.animaA && <Dato label="Anima a">{row.animaA}</Dato>}
              <Dato label="Lo inscribió">{row.cuentaEmail}</Dato>
              <Dato label="Monto">{row.monto === null ? null : formatMonto(row.monto)}</Dato>
            </dl>
          </section>

          <section className={CARD} aria-labelledby="f-contacto">
            <h2 id="f-contacto" className={H2}>Contactos de emergencia</h2>
            {row.contactos.length === 0 ? <p className="mt-3 text-sm text-stone-500">Sin contactos cargados.</p> : (
              <ul className="m-0 mt-3 list-none divide-y divide-stone-100 p-0">
                {row.contactos.map((contacto, index) => (
                  <li key={index} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                    <span className="text-base font-bold text-stone-900">{contacto.nombre} <span className="font-normal text-stone-500">({contacto.vinculo})</span></span>
                    <a href={`tel:${contacto.telefono.replace(/[^\d+]/g, "")}`} className="text-base font-bold text-brand-brown">{contacto.telefono}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={CARD} aria-labelledby="f-salud">
            <h2 id="f-salud" className={H2}>Salud</h2>
            <p className="mt-1 text-sm text-stone-500">Es lo que declaró la familia al inscribirse a este evento.</p>
            {!row.salud ? <p className="mt-3 text-sm text-stone-500">Este evento no pidió ficha de salud.</p> : (
              <>
                <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-3">
                  <Dato label="Grupo sanguíneo">{row.salud.grupoSanguineo}</Dato>
                </dl>
                <dl className="m-0 mt-4 grid gap-4 border-t border-stone-100 pt-4 sm:grid-cols-2">
                  {condiciones.map((item) => (
                    <Dato key={item.label} label={item.label}>
                      {item.value === undefined ? "Sin responder" : item.value.tiene ? <strong className="font-bold">{item.value.detalle}</strong> : "No"}
                    </Dato>
                  ))}
                  {row.respuestas.lleva_comida && <Dato label="Lleva su comida">{row.respuestas.lleva_comida === "si" ? "Sí" : "No"}</Dato>}
                </dl>
              </>
            )}
          </section>

          {preguntas.length > 0 && (
            <section className={CARD} aria-labelledby="f-preguntas">
              <h2 id="f-preguntas" className={H2}>Preguntas del evento</h2>
              <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-2">
                {preguntas.map((pregunta) => (
                  <Dato key={pregunta.id} label={pregunta.texto}>
                    {pregunta.tipo === "si_no" ? (row.respuestas[pregunta.id] === "si" ? "Sí" : "No") : row.respuestas[pregunta.id]}
                  </Dato>
                ))}
              </dl>
            </section>
          )}

          <section className={CARD} aria-labelledby="f-autorizaciones">
            <h2 id="f-autorizaciones" className={H2}>Autorizaciones</h2>
            <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-2">
              <Dato label="Autorización del evento">
                {row.firmaEventoId ? (
                  <a href={`/api/admin/inscripciones/firmas/${row.firmaEventoId}`} className={pdf}><Download size={14} aria-hidden /> Firmada · PDF</a>
                ) : <strong className="font-bold text-amber-700">Sin firmar</strong>}
              </Dato>
              <Dato label="Uso de imagen">
                {row.imagen === null ? <strong className="font-bold text-amber-700">Falta responder</strong> : (
                  <span className="flex flex-wrap items-center gap-x-3">
                    {row.imagen ? "Autorizado" : <strong className="font-bold text-amber-700">No autorizado</strong>}
                    {row.firmaImagenId && <a href={`/api/admin/inscripciones/firmas/${row.firmaImagenId}`} className={pdf}><Download size={14} aria-hidden /> PDF</a>}
                  </span>
                )}
              </Dato>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}

import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download } from "lucide-react";
import { estiloIam } from "@/app/inscripciones/colores";
import { formatMonto } from "@/app/inscripciones/montos";
import { AREA_LABEL, ROL_LABEL, formatFecha } from "@/app/inscripciones/ui";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { InscripcionConfigPanel } from "@/app/components/common/inscripcion-config-panel";
import { listBajasEvento, listInscriptosEvento, listPagosEvento, type BajaAdmin, type InscriptoAdmin } from "@/server/db/inscripciones-admin-repository";
import { requireAdminPage } from "@/server/lib/admin-page";
import { EventoDetalles } from "./evento-detalles";
import { PagosPanel } from "./pagos-panel";
import { getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { edadEnEvento, filtrar, grupoDe, parseFiltros, respuestaDe, respuestasPorPregunta, resumir, tablaLogistica, type Conteo, type FiltroKey, type Filtros } from "@/server/lib/inscripciones-resumen";
import type { EventoConfig } from "@/server/db/inscripciones-repository";

// Panel de un evento: resumen con totales, lista de inscriptos con filtros, vista de
// logística, pagos y configuración. Todo se calcula en el servidor; al navegador le llega solo lo que se muestra.

export const dynamic = "force-dynamic";

type Vista = "resumen" | "lista" | "logistica" | "pagos" | "config";
const VISTAS: Array<{ id: Vista; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "lista", label: "Inscriptos" },
  { id: "logistica", label: "Logística" },
  { id: "pagos", label: "Pagos" },
  { id: "config", label: "Configuración" },
];

const SEXO_LABEL: Record<string, string> = { F: "Mujeres", M: "Varones", X: "X" };
const FILTRO_LABEL: Record<FiltroKey, string> = {
  rol: "Participa como", area: "Área", grupo: "IAM", ciudad: "Ciudad", sexo: "Sexo", grado: "Grado", firma: "Autorización",
  imagen: "Uso de imagen", dieta: "Con dieta especial", alergias: "Con alergias", medicacion: "Con medicación",
  enfermedad: "Con condición médica", comida: "Lleva su comida", pregunta: "Respuesta",
};

function valorLegible(key: FiltroKey, value: string): string {
  if (key === "rol") return ROL_LABEL[value] ?? value;
  if (key === "area") return AREA_LABEL[value] ?? value;
  if (key === "sexo") return SEXO_LABEL[value] ?? value;
  if (key === "firma") return value === "si" ? "firmada" : "sin firmar";
  if (key === "imagen") return value === "si" ? "autorizado" : value === "no" ? "no autorizado" : "falta responder";
  if (key === "pregunta") return value.slice(value.indexOf(":") + 1) || "sin responder";
  return value;
}

const CARD = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";
const H2 = "text-sm font-black uppercase tracking-widest text-brand-brown";
const TH = "px-3 py-2 text-left text-xs font-black uppercase tracking-wide text-stone-500";
const TD = "px-3 py-2.5 align-top text-sm text-stone-800";

export default async function AdminEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventoId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdminPage();
  const [{ eventoId: rawId }, query] = await Promise.all([params, searchParams]);
  const eventoId = decodeURIComponent(rawId);
  const evento = await getEventoConInscripcion(eventoId);
  if (!evento) notFound();

  const vista: Vista = VISTAS.some((item) => item.id === query.vista) ? (query.vista as Vista) : "resumen";
  const filtros = parseFiltros(query);
  const [inscriptos, bajas, pagos] = await Promise.all([
    listInscriptosEvento(eventoId),
    listBajasEvento(eventoId),
    vista === "pagos" ? listPagosEvento(eventoId) : Promise.resolve([]),
  ]);

  const base = `/admin/inscripciones/${encodeURIComponent(eventoId)}`;
  const href = (target: Vista, extra: Filtros = {}) => {
    const search = new URLSearchParams({ ...(target === "resumen" ? {} : { vista: target }), ...extra });
    const text = search.toString();
    return text ? `${base}?${text}` : base;
  };

  // La vista de logística muestra datos de salud con nombre: queda registrado quién la abrió.
  if (vista === "logistica") {
    await recordAuditEvent({ actor: user, action: "ver", entityType: "inscripciones_logistica", entityId: eventoId, metadata: { inscriptos: inscriptos.length } }).catch(() => undefined);
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-16 pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div role="navigation" aria-label="Ruta de navegación">
          <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm font-bold text-brand-brown">
            <li><Link href="/admin/inscripciones" className="text-brand-brown hover:underline">Inscripciones</Link></li>
            <li aria-hidden><ChevronRight size={14} className="opacity-60" /></li>
          </ol>
        </div>
        <h1 className="mt-2 text-3xl font-black text-brand-brown">{evento.evento}</h1>
        <p className="mt-1 text-sm font-semibold text-stone-500 first-letter:uppercase">
          {formatFecha(evento.fecha)}
          {evento.fechaFin && evento.fechaFin !== evento.fecha ? ` al ${formatFecha(evento.fechaFin)}` : ""}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200">
          <div role="navigation" aria-label="Vistas del evento" className="flex flex-wrap gap-1">
            {VISTAS.map((item) => (
              <Link
                key={item.id}
                href={href(item.id)}
                aria-current={vista === item.id ? "page" : undefined}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold no-underline ${vista === item.id ? "border-brand-brown text-brand-brown" : "border-transparent text-stone-500 hover:text-stone-800"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <a href={`/api/admin/inscripciones/export?eventoId=${encodeURIComponent(eventoId)}`} className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 no-underline hover:border-stone-500">
            <Download size={15} aria-hidden /> Descargar para Excel
          </a>
        </div>

        {vista === "config" ? (
          <div className="mt-6 max-w-3xl">
            <EventoDetalles eventoId={eventoId} />
            <InscripcionConfigPanel eventoId={eventoId} />
          </div>
        ) : vista === "pagos" ? (
          <PagosPanel eventoId={eventoId} pagos={pagos} />
        ) : inscriptos.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-stone-300 p-10 text-center text-stone-500">Todavía no hay inscriptos en este evento.</p>
        ) : vista === "resumen" ? (
          <Resumen inscriptos={inscriptos} bajas={bajas} eventoFecha={evento.fecha} href={href} config={evento.config} />
        ) : vista === "lista" ? (
          <Lista inscriptos={inscriptos} filtros={filtros} eventoFecha={evento.fecha} href={href} base={base} config={evento.config} agrupar={typeof query.agrupar === "string" ? query.agrupar : ""} />
        ) : (
          <Logistica inscriptos={inscriptos} eventoFecha={evento.fecha} />
        )}

        {(vista === "resumen" || vista === "lista") && <Bajas bajas={bajas} />}
      </div>
    </main>
  );
}

type Href = (vista: Vista, extra?: Filtros) => string;

/** Un total que lleva a la lista de esas personas. */
function Numero({ label, value, to, tone }: { label: string; value: number; to?: string; tone?: "alerta" }) {
  const content = (
    <>
      <span className={`block text-3xl font-black leading-none ${tone === "alerta" && value > 0 ? "text-amber-700" : "text-stone-900"}`}>{value}</span>
      <span className="mt-1.5 block text-sm font-semibold leading-snug text-stone-600">{label}</span>
    </>
  );
  const className = "block rounded-xl border border-stone-200 bg-stone-50 p-4 no-underline";
  return to && value > 0
    ? <Link href={to} className={`${className} transition-colors hover:border-brand-brown/50 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown`}>{content}</Link>
    : <div className={className}>{content}</div>;
}

/** Lista de valores con su cantidad; cada fila lleva a la lista filtrada. */
function Desglose({ items, to, label }: { items: Conteo; to: (valor: string) => string; label?: (valor: string) => string }) {
  if (items.length === 0) return <p className="mt-3 text-sm text-stone-500">Sin datos.</p>;
  const max = Math.max(...items.map((item) => item.total));
  return (
    <ul className="m-0 mt-3 list-none space-y-1 p-0">
      {items.map((item) => (
        <li key={item.valor}>
          <Link href={to(item.valor)} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-stone-800 no-underline hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-brown">
            <span className="min-w-0 flex-1 truncate font-semibold">{label ? label(item.valor) : item.valor}</span>
            <span aria-hidden className="hidden h-2 w-24 overflow-hidden rounded-full bg-stone-200 sm:block">
              <span className="block h-full rounded-full bg-brand-brown/70" style={{ width: `${Math.round((item.total / max) * 100)}%` }} />
            </span>
            <span className="w-8 text-right font-black tabular-nums">{item.total}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function fechaHoraBaja(utc: string | null): string {
  if (!utc) return "—";
  const date = new Date(`${utc.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? utc : date.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" });
}

/** Quienes se dieron de baja. Los que lo hicieron después del cierre tienen que pagar igual. */
function Bajas({ bajas }: { bajas: BajaAdmin[] }) {
  if (bajas.length === 0) return null;
  return (
    <section id="bajas" className={`${CARD} mt-5 scroll-mt-24`} aria-labelledby="bajas-titulo">
      <h2 id="bajas-titulo" className={H2}>Bajas ({bajas.length})</h2>
      <p className="mt-1 text-sm text-stone-500">No cuentan en los totales. Quien se dio de baja después del cierre de la inscripción tiene que pagar igual.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead className="border-b border-stone-200">
            <tr>
              <th scope="col" className={TH}>Nombre</th>
              <th scope="col" className={TH}>Participaba como</th>
              <th scope="col" className={TH}>IAM</th>
              <th scope="col" className={TH}>Baja</th>
              <th scope="col" className={TH}>Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {bajas.map((baja) => (
              <tr key={baja.inscripcionId}>
                <th scope="row" className={`${TD} text-left font-bold`}>{baja.apellido}, {baja.nombre}</th>
                <td className={TD}>{ROL_LABEL[baja.rol] ?? baja.rol}</td>
                <td className={TD}>{baja.grupoNombre ?? "—"}</td>
                <td className={TD}>{fechaHoraBaja(baja.bajaAt)}</td>
                <td className={TD}>{baja.fueraDeTermino ? <strong className="font-bold text-amber-700">Paga igual{baja.monto !== null ? `: ${formatMonto(baja.monto)}` : ""} (baja después del cierre)</strong> : "No corresponde"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Resumen({ inscriptos, bajas, eventoFecha, href, config }: { inscriptos: InscriptoAdmin[]; bajas: BajaAdmin[]; eventoFecha: string; href: Href; config: EventoConfig }) {
  const r = resumir(inscriptos, eventoFecha);
  const preguntas = respuestasPorPregunta(inscriptos, config.preguntas);
  // Solo se muestran los roles que este evento admite (o que tengan a alguien inscripto).
  const roles = [
    { id: "participante", label: "Niños y adolescentes" },
    { id: "area", label: "Integrantes de áreas" },
    { id: "animador", label: "Animadores" },
    { id: "acompanante", label: "Acompañantes" },
  ].filter((item) => (config.roles as string[]).includes(item.id) || r.porRol.some((fila) => fila.valor === item.id));
  const bajasQuePagan = bajas.filter((baja) => baja.fueraDeTermino).length;
  // Lo que corresponde cobrar: inscriptos activos más quienes se dieron de baja después del cierre.
  const conMonto = inscriptos.some((row) => row.monto !== null) || bajas.some((baja) => baja.monto !== null);
  const aCobrar = inscriptos.reduce((total, row) => total + (row.monto ?? 0), 0) + bajas.reduce((total, baja) => total + (baja.fueraDeTermino ? baja.monto ?? 0 : 0), 0);
  const sinMonto = inscriptos.filter((row) => row.monto === null).length;
  const rol = (value: string) => r.porRol.find((item) => item.valor === value)?.total ?? 0;

  return (
    <div className="mt-6 space-y-5">
      {r.dePrueba > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {r.dePrueba} de estos inscriptos son gente de prueba. Se borran con <code className="font-mono">node scripts/inscripciones-prueba.mjs borrar</code>.
        </p>
      )}

      <section className={CARD} aria-labelledby="r-quienes">
        <h2 id="r-quienes" className={H2}>Quiénes van</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Numero label="Inscriptos en total" value={r.total} to={href("lista")} />
          {roles.map((item) => <Numero key={item.id} label={item.label} value={rol(item.id)} to={href("lista", { rol: item.id })} />)}
        </div>
        {r.porArea.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-stone-700">Integrantes de áreas, por área</h3>
            <Desglose items={r.porArea} to={(valor) => href("lista", { rol: "area", area: valor })} label={(valor) => AREA_LABEL[valor] ?? valor} />
          </div>
        )}
      </section>

      {preguntas.length > 0 && (
        <section className={CARD} aria-labelledby="r-preguntas">
          <h2 id="r-preguntas" className={H2}>Preguntas del evento</h2>
          <div className="mt-2 grid gap-x-8 gap-y-5 lg:grid-cols-2">
            {preguntas.map(({ pregunta, total, conteo }) => (
              <div key={pregunta.id}>
                <h3 className="mt-3 text-sm font-bold text-stone-700">
                  {pregunta.texto} <span className="font-normal text-stone-500">({total})</span>
                </h3>
                <Desglose items={conteo.map((item) => ({ valor: item.valor, total: item.total }))} to={(valor) => href("lista", { pregunta: `${pregunta.id}:${valor}` })} label={(valor) => conteo.find((item) => item.valor === valor)?.etiqueta ?? valor} />
              </div>
            ))}
          </div>
        </section>
      )}

      {conMonto && (
        <section className={CARD} aria-labelledby="r-montos">
          <h2 id="r-montos" className={H2}>Montos</h2>
          <p className="mt-3 text-3xl font-black leading-none text-stone-900">{formatMonto(aCobrar)}</p>
          <p className="mt-1.5 text-sm font-semibold text-stone-600">
            Total a cobrar: inscriptos más bajas después del cierre. <Link href={href("pagos")} className="font-bold text-brand-brown underline">Ver pagos</Link>.
            {sinMonto > 0 ? ` ${sinMonto} ${sinMonto === 1 ? "inscripto no tiene" : "inscriptos no tienen"} monto, porque su ciudad no tenía uno cargado al inscribirse.` : ""}
          </p>
        </section>
      )}

      <section className={CARD} aria-labelledby="r-pendientes">
        <h2 id="r-pendientes" className={H2}>Pendientes</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Numero label="Autorizaciones sin firmar" value={r.sinFirmar} to={href("lista", { firma: "no" })} tone="alerta" />
          <Numero label="Sin permiso de imagen" value={r.sinImagen} to={href("lista", { imagen: "no" })} tone="alerta" />
          <Numero label="Falta responder uso de imagen" value={r.imagenSinResponder} to={href("lista", { imagen: "falta" })} tone="alerta" />
          <Numero label="Bajas" value={bajas.length} to="#bajas" />
          <Numero label="Bajas después del cierre (pagan igual)" value={bajasQuePagan} to="#bajas" tone="alerta" />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={CARD} aria-labelledby="r-grupo">
          <h2 id="r-grupo" className={H2}>Por IAM</h2>
          <Desglose items={r.porGrupo} to={(valor) => href("lista", { grupo: valor })} />
        </section>
        <section className={CARD} aria-labelledby="r-ciudad">
          <h2 id="r-ciudad" className={H2}>Por ciudad</h2>
          <Desglose items={r.porCiudad} to={(valor) => href("lista", { ciudad: valor })} />
        </section>
        {r.porGrado.length > 0 && (
          <section className={CARD} aria-labelledby="r-grado">
            <h2 id="r-grado" className={H2}>Chicos por grado</h2>
            <Desglose items={r.porGrado} to={(valor) => href("lista", { grado: valor })} />
          </section>
        )}
        <section className={CARD} aria-labelledby="r-sexo">
          <h2 id="r-sexo" className={H2}>Por sexo</h2>
          <p className="mt-1 text-sm text-stone-500">Para armar habitaciones o carpas.</p>
          <Desglose items={r.porSexo} to={(valor) => href("lista", { sexo: valor })} label={(valor) => SEXO_LABEL[valor] ?? valor} />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={CARD} aria-labelledby="r-cocina">
          <h2 id="r-cocina" className={H2}>Para cocina</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Numero label="Con dieta especial" value={r.dietas} to={href("lista", { dieta: "1" })} />
            <Numero label="Llevan su comida" value={r.llevanComida} to={href("lista", { comida: "1" })} />
          </div>
          {r.tiposDeDieta.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-bold text-stone-700">Qué dietas hay</h3>
              <ul className="m-0 mt-2 list-none space-y-1 p-0 text-sm text-stone-800">
                {r.tiposDeDieta.map((item) => (
                  <li key={item.valor} className="flex justify-between gap-3 px-2 py-1">
                    <span className="min-w-0 break-words first-letter:uppercase">{item.valor}</span>
                    <span className="font-black tabular-nums">{item.total}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className={CARD} aria-labelledby="r-enfermeria">
          <h2 id="r-enfermeria" className={H2}>Para enfermería</h2>
          <p className="mt-1 text-sm text-stone-500">Acá solo la cantidad. El detalle está en la ficha de cada persona.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Numero label="Con alergias" value={r.alergias} to={href("lista", { alergias: "1" })} />
            <Numero label="Con medicación" value={r.medicacion} to={href("lista", { medicacion: "1" })} />
            <Numero label="Con condición médica" value={r.enfermedad} to={href("lista", { enfermedad: "1" })} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Lista({ inscriptos, filtros, eventoFecha, href, base, config, agrupar }: { inscriptos: InscriptoAdmin[]; filtros: Filtros; eventoFecha: string; href: Href; base: string; config: EventoConfig; agrupar: string }) {
  // Cómo se separa la lista: por IAM, por cómo participan o por la respuesta a una pregunta cerrada del evento
  // (p. ej. iniciación / profundización en una formación de animadores).
  const cerradas = config.preguntas.filter((pregunta) => pregunta.tipo !== "texto");
  const preguntaGrupo = cerradas.find((pregunta) => agrupar === `p:${pregunta.id}`)
    // En un evento sin chicos (solo animadores y áreas) lo natural es separar por la primera pregunta cerrada.
    ?? (agrupar === "" && !config.roles.includes("participante") ? cerradas[0] : undefined);
  const modo = preguntaGrupo ? `p:${preguntaGrupo.id}` : agrupar === "rol" ? "rol" : "iam";
  const claveDe = (row: InscriptoAdmin): string => {
    if (modo === "rol") return ROL_LABEL[row.rol] ?? row.rol;
    if (!preguntaGrupo) return grupoDe(row);
    // Quien va por un área y no tiene esa respuesta se agrupa por su área.
    if (row.rol === "area" && !row.respuestas[preguntaGrupo.id]) return `Área de ${row.area ? AREA_LABEL[row.area] ?? row.area : "sin indicar"}`;
    return respuestaDe(row, preguntaGrupo);
  };
  const filas = filtrar(inscriptos, filtros).sort((a, b) => claveDe(a).localeCompare(claveDe(b), "es") || a.apellido.localeCompare(b.apellido, "es") || a.nombre.localeCompare(b.nombre, "es"));
  const activos = Object.entries(filtros) as Array<[FiltroKey, string]>;
  const grupos = [...new Set(inscriptos.map(grupoDe))].sort((a, b) => a.localeCompare(b, "es"));
  const select = "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800";

  return (
    <div className="mt-6">
      {/* Los filtros viajan en la dirección: el servidor devuelve solo las filas que corresponden. */}
      <form method="get" action={base} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="vista" value="lista" />
        <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
          Participa como
          <select name="rol" defaultValue={filtros.rol ?? ""} className={`${select} mt-1 block`}>
            <option value="">Todos</option>
            {Object.entries(ROL_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
          IAM
          <select name="grupo" defaultValue={filtros.grupo ?? ""} className={`${select} mt-1 block`}>
            <option value="">Todas</option>
            {grupos.map((grupo) => <option key={grupo} value={grupo}>{grupo}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
          Autorización
          <select name="firma" defaultValue={filtros.firma ?? ""} className={`${select} mt-1 block`}>
            <option value="">Todas</option>
            <option value="si">Firmada</option>
            <option value="no">Sin firmar</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
          Uso de imagen
          <select name="imagen" defaultValue={filtros.imagen ?? ""} className={`${select} mt-1 block`}>
            <option value="">Todos</option>
            <option value="si">Autorizado</option>
            <option value="no">No autorizado</option>
            <option value="falta">Falta responder</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
          Separar por
          <select name="agrupar" defaultValue={modo} className={`${select} mt-1 block`}>
            <option value="iam">IAM</option>
            <option value="rol">Cómo participa</option>
            {cerradas.map((pregunta) => <option key={pregunta.id} value={`p:${pregunta.id}`}>{pregunta.texto}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-full bg-brand-brown px-5 py-2 text-sm font-bold text-white hover:bg-brand-wood">Filtrar</button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-stone-700">
        <span><strong className="font-black">{filas.length}</strong> de {inscriptos.length}</span>
        {activos.map(([key, value]) => (
          <span key={key} className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-800">
            {value === "1" ? FILTRO_LABEL[key] : `${FILTRO_LABEL[key]}: ${valorLegible(key, value)}`}
          </span>
        ))}
        {activos.length > 0 && <Link href={href("lista")} className="font-bold text-brand-brown underline">Quitar filtros</Link>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th scope="col" className={TH}>Nombre</th>
              <th scope="col" className={TH}>Edad</th>
              <th scope="col" className={TH}>Participa como</th>
              <th scope="col" className={TH}>IAM</th>
              <th scope="col" className={TH}>Grado</th>
              <th scope="col" className={TH}>Autorización</th>
              <th scope="col" className={TH}>Imagen</th>
              <th scope="col" className={`${TH} text-right`}>Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filas.map((row, index) => (
              <Fragment key={row.inscripcionId}>
              {(index === 0 || claveDe(filas[index - 1]) !== claveDe(row)) && (
                // Banda que abre cada grupo y dice cuántos son; si se separa por IAM, lleva su color.
                <tr>
                  <th scope="colgroup" colSpan={8} className="bg-stone-200 px-3 py-2 text-left text-sm font-black text-stone-900" style={modo !== "iam" || row.rol === "area" ? undefined : estiloIam(row.grupoColor)}>
                    {claveDe(row)} · {filas.filter((item) => claveDe(item) === claveDe(row)).length}
                  </th>
                </tr>
              )}
              <tr>
                <th scope="row" className={`${TD} border-l-8 text-left font-bold`} style={{ borderLeftColor: row.rol !== "area" && row.grupoColor ? row.grupoColor : "#e7e5e4" }}>
                  <Link href={`${base}/${row.inscripcionId}`} className="text-brand-brown underline-offset-2 hover:underline">{row.apellido}, {row.nombre}</Link>
                  {row.esPrueba && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Prueba</span>}
                </th>
                <td className={TD}>{edadEnEvento(row, eventoFecha) ?? "—"}</td>
                <td className={TD}>{ROL_LABEL[row.rol] ?? row.rol}{row.rol === "area" && row.area ? ` (${AREA_LABEL[row.area] ?? row.area})` : ""}</td>
                <td className={TD}>{row.grupoNombre ?? "—"}</td>
                <td className={TD}>{row.grado ?? "—"}</td>
                <td className={TD}>{row.firmaEventoId ? "Firmada" : <span className="font-bold text-amber-700">Sin firmar</span>}</td>
                <td className={TD}>{row.imagen === null ? <span className="font-bold text-amber-700">Falta</span> : row.imagen ? "Sí" : <span className="font-bold text-amber-700">No</span>}</td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{row.monto === null ? "—" : row.monto === 0 ? "No paga" : formatMonto(row.monto)}</td>
              </tr>
              </Fragment>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-sm text-stone-500">Nadie coincide con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Logistica({ inscriptos, eventoFecha }: { inscriptos: InscriptoAdmin[]; eventoFecha: string }) {
  const { filas, totales } = tablaLogistica(inscriptos, eventoFecha);
  const comida = inscriptos.filter((row) => row.salud?.dieta?.tiene || row.salud?.alergias?.tiene);
  const condiciones = inscriptos.filter((row) => row.salud?.enfermedad?.tiene);
  const num = `${TD} text-right tabular-nums`;

  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm text-stone-500">Esta vista muestra datos de salud con nombre. Cada vez que alguien la abre queda registrado en la auditoría.</p>

      <section className={CARD} aria-labelledby="l-comida">
        <h2 id="l-comida" className={H2}>Cantidades por IAM</h2>
        <p className="mt-1 text-sm text-stone-500">Para calcular la comida. Los adultos se cuentan con los más grandes.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead className="border-b border-stone-200">
              <tr>
                <th scope="col" className={TH}>IAM</th>
                <th scope="col" className={`${TH} text-right`}>Jardín</th>
                <th scope="col" className={`${TH} text-right`}>1° a 4° grado</th>
                <th scope="col" className={`${TH} text-right`}>Más grandes</th>
                <th scope="col" className={`${TH} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filas.map((fila) => (
                <tr key={fila.grupo}>
                  <th scope="row" className={`${TD} text-left font-bold`}>{fila.grupo}</th>
                  <td className={num}>{fila.jardin}</td>
                  <td className={num}>{fila.chicos}</td>
                  <td className={num}>{fila.grandes}</td>
                  <td className={`${num} font-black`}>{fila.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-stone-300 bg-stone-50">
              <tr>
                <th scope="row" className={`${TD} text-left font-black`}>Total</th>
                <td className={`${num} font-black`}>{totales.jardin}</td>
                <td className={`${num} font-black`}>{totales.chicos}</td>
                <td className={`${num} font-black`}>{totales.grandes}</td>
                <td className={`${num} font-black`}>{totales.total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className={CARD} aria-labelledby="l-dietas">
        <h2 id="l-dietas" className={H2}>Alergias y dietas ({comida.length})</h2>
        <p className="mt-1 text-sm text-stone-500">Para que cocina sepa a quién separarle el plato.</p>
        {comida.length === 0 ? <p className="mt-3 text-sm text-stone-500">Nadie declaró alergias ni dietas.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse">
              <thead className="border-b border-stone-200">
                <tr>
                  <th scope="col" className={TH}>Nombre</th>
                  <th scope="col" className={TH}>IAM</th>
                  <th scope="col" className={TH}>Dieta</th>
                  <th scope="col" className={TH}>Alergias</th>
                  <th scope="col" className={TH}>Lleva su comida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {comida.map((row) => (
                  <tr key={row.inscripcionId}>
                    <th scope="row" className={`${TD} text-left font-bold`}>{row.apellido}, {row.nombre}</th>
                    <td className={TD}>{row.grupoNombre ?? "—"}</td>
                    <td className={TD}>{row.salud?.dieta?.tiene ? row.salud.dieta.detalle : "—"}</td>
                    <td className={TD}>{row.salud?.alergias?.tiene ? row.salud.alergias.detalle : "—"}</td>
                    <td className={TD}>{row.respuestas.lleva_comida === "si" ? "Sí" : row.salud?.dieta?.tiene ? "No" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={CARD} aria-labelledby="l-condiciones">
        <h2 id="l-condiciones" className={H2}>Enfermedades o condiciones médicas ({condiciones.length})</h2>
        {condiciones.length === 0 ? <p className="mt-3 text-sm text-stone-500">Nadie declaró una condición médica.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead className="border-b border-stone-200">
                <tr>
                  <th scope="col" className={TH}>Nombre</th>
                  <th scope="col" className={TH}>IAM</th>
                  <th scope="col" className={TH}>Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {condiciones.map((row) => (
                  <tr key={row.inscripcionId}>
                    <th scope="row" className={`${TD} text-left font-bold`}>{row.apellido}, {row.nombre}</th>
                    <td className={TD}>{row.grupoNombre ?? "—"}</td>
                    <td className={TD}>{row.salud?.enfermedad?.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

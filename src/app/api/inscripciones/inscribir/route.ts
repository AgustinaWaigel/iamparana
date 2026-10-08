import { NextResponse } from "next/server";
import { listAdultosConAcceso } from "@/server/db/cuentas-repository";
import {
  InscripcionError,
  getImagenVigente,
  inscribirPersonas,
  listInscripcionesDeCuenta,
  listPersonasConFirmaEvento,
  listPersonasDeCuenta,
} from "@/server/db/inscripciones-repository";
import { checkRateLimit, getCuentaSesion, isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";
import { getEventoConInscripcion, isInscripcionAbierta } from "@/server/lib/inscripciones-eventos";
import { firmarYAvisar, pedirFirmaDeAdulto, titularEsMenor, validarFirmaPng } from "@/server/lib/inscripciones-firmar";
import { firstIssue, inscribirSchema } from "@/server/lib/inscripciones-validation";

export const dynamic = "force-dynamic";

// Inscribe a personas de la cuenta en un evento con inscripción abierta.
// La inscripción llega firmada: si falta la firma, no se registra nada. La única
// excepción es quien todavía es menor y se inscribe solo, que tiene que indicar
// el email del adulto que va a firmar por él.

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const cuenta = await getCuentaSesion();
  if (!cuenta) return NextResponse.json({ error: "La sesión venció. Volvé a entrar con tu email." }, { status: 401 });

  if (!(await checkRateLimit("inscribir", cuenta.cuentaId, 15, 10))) {
    return NextResponse.json({ error: "Demasiados intentos seguidos. Esperá unos minutos." }, { status: 429 });
  }

  const parsed = inscribirSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  const { firma } = parsed.data;

  try {
    // El estado del evento se vuelve a leer en el servidor: no se confía en lo que mostró la pantalla.
    const evento = await getEventoConInscripcion(parsed.data.eventoId);
    if (!evento || !isInscripcionAbierta(evento, evento.config)) {
      return NextResponse.json({ error: "La inscripción a este evento no está abierta." }, { status: 409 });
    }

    // Antes de inscribir se revisa que venga todo lo necesario para firmar: así no queda nadie a medio inscribir.
    const [personas, firmadas, imagen] = await Promise.all([
      listPersonasDeCuenta(cuenta.cuentaId),
      listPersonasConFirmaEvento(cuenta.cuentaId, evento.id),
      getImagenVigente(cuenta.cuentaId),
    ]);
    const ids = parsed.data.personas.map((item) => item.personaId);
    const yaFirmada = new Set(firmadas);
    const sinImagen = ids.filter((id) => !imagen.has(id));
    const faltaFirmar = ids.some((id) => !yaFirmada.has(id)) || sinImagen.length > 0;
    const menor = titularEsMenor(personas);
    let adultoEmail: string | null = null;

    if (faltaFirmar && menor) {
      adultoEmail = normalizeEmail(parsed.data.adultoEmail);
      if (parsed.data.adultoEmail && !adultoEmail) return NextResponse.json({ error: "Revisá el email del adulto: no parece válido." }, { status: 400 });
      if (adultoEmail === cuenta.email) return NextResponse.json({ error: "El email del adulto tiene que ser distinto del tuyo." }, { status: 400 });
      if (!adultoEmail && (await listAdultosConAcceso(cuenta.cuentaId)).length === 0) {
        return NextResponse.json({ error: "Como sos menor de edad, indicá el email del adulto que va a firmar tu autorización." }, { status: 400 });
      }
    } else if (faltaFirmar) {
      if (!firma) return NextResponse.json({ error: "Para terminar la inscripción falta la firma." }, { status: 400 });
      validarFirmaPng(firma.firma);
      const falta = sinImagen.find((id) => typeof firma.imagen[id] !== "boolean");
      if (falta) {
        const nombre = personas.find((persona) => persona.id === falta)?.nombre ?? "esa persona";
        return NextResponse.json({ error: `Indicá si autorizás el uso de imagen de ${nombre}.` }, { status: 400 });
      }
    }

    await inscribirPersonas({
      cuentaId: cuenta.cuentaId,
      eventoId: evento.id,
      eventoFecha: evento.fecha,
      config: evento.config,
      items: parsed.data.personas,
    });

    let emailEnviado = false;
    if (faltaFirmar && menor) {
      if (adultoEmail) await pedirFirmaDeAdulto({ cuenta, evento, adultoEmail });
    } else if (faltaFirmar && firma) {
      ({ emailEnviado } = await firmarYAvisar({
        cuenta,
        evento,
        datos: firma,
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
        soloPersonas: ids,
      }));
    }

    const inscripciones = (await listInscripcionesDeCuenta(cuenta.cuentaId, evento.id)).filter((item) => ids.includes(item.personaId));
    return NextResponse.json({
      ok: true,
      inscripciones: inscripciones.map((item) => ({ personaId: item.personaId, estado: item.estado })),
      emailEnviado,
      esperaAdulto: faltaFirmar && menor,
    });
  } catch (error) {
    if (error instanceof InscripcionError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("inscripciones/inscribir", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No pudimos registrar la inscripción. Probá de nuevo." }, { status: 500 });
  }
}

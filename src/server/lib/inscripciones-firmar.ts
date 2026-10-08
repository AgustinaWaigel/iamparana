import "server-only";

import { INVITACION_DIAS, createInvitacionFirma, type CuentaSesion } from "@/server/db/cuentas-repository";
import { InscripcionError, firmarAutorizaciones, getFirmaDeCuenta, listPersonasDeCuenta, type PersonaView } from "@/server/db/inscripciones-repository";
import { sendAutorizacionesEmail, sendFirmaAdultoEmail } from "@/server/lib/email-service";
import type { EventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { firmaGuardadaToPdf } from "@/server/lib/inscripciones-pdf";
import { hashTexto, textoAutorizacionEvento, textoAutorizacionImagen, vigenciaImagen } from "@/server/lib/inscripciones-textos";
import { EDAD_ADULTO, ageOn, todayYmd, type FirmaDatos } from "@/server/lib/inscripciones-validation";

// Firma de autorizaciones: lo comparten la ruta que inscribe (la inscripción se envía
// firmada) y la que firma lo que hubiera quedado pendiente.

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const emailDePrueba = (email: string) => email.endsWith(".invalid");
const modoConsola = () => process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console";

/** Comprueba que la firma dibujada sea de verdad una imagen PNG con algo de contenido. */
export function validarFirmaPng(dataUrl: string): void {
  const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  if (png.length < 200 || !png.subarray(0, 8).equals(PNG_MAGIC)) throw new InscripcionError("Falta la firma. Dibujala en el recuadro.");
}

/** true si quien es responsable de la cuenta todavía es menor de edad: no puede firmar autorizaciones. */
export function titularEsMenor(personas: PersonaView[]): boolean {
  const titular = personas.find((persona) => persona.esTitular);
  return Boolean(titular?.fechaNacimiento) && ageOn(titular!.fechaNacimiento!, todayYmd()) < EDAD_ADULTO;
}

/**
 * Registra la firma del adulto y le manda los PDF. La firma queda guardada aunque el
 * email falle: las copias siguen disponibles en la cuenta.
 */
export async function firmarYAvisar(input: {
  cuenta: CuentaSesion;
  evento: EventoConInscripcion;
  datos: FirmaDatos;
  userAgent: string | null;
  soloPersonas?: string[];
}): Promise<{ emailEnviado: boolean }> {
  const { cuenta, evento, datos } = input;
  validarFirmaPng(datos.firma);
  // Una autorización firmada por un menor no vale: tiene que firmar un adulto desde su propia cuenta.
  if (titularEsMenor(await listPersonasDeCuenta(cuenta.cuentaId))) {
    throw new InscripcionError("Como sos menor de edad, la autorización la tiene que firmar un adulto desde su propio email.");
  }

  const today = todayYmd();
  const textoEvento = textoAutorizacionEvento(evento, evento.config.autorizacionTexto);
  const textoImagen = textoAutorizacionImagen(today);

  const firmaIds = await firmarAutorizaciones({
    cuentaId: cuenta.cuentaId,
    eventoId: evento.id,
    textoEvento,
    textoEventoHash: hashTexto(textoEvento),
    textoImagen,
    textoImagenHash: hashTexto(textoImagen),
    imagenVigenteHasta: vigenciaImagen(today),
    firmanteNombre: datos.firmanteNombre,
    firmanteDni: datos.firmanteDni,
    firmaPng: datos.firma,
    imagen: datos.imagen,
    userAgent: input.userAgent,
    soloPersonas: input.soloPersonas,
  });

  let emailEnviado = false;
  try {
    const adjuntos: Array<{ filename: string; content: Buffer }> = [];
    for (const id of firmaIds) {
      const firma = await getFirmaDeCuenta(cuenta.cuentaId, id);
      if (firma) adjuntos.push({ filename: pdfFilename(firma.tipo, firma.personaNombre), content: await firmaGuardadaToPdf(firma) });
    }
    if (modoConsola()) {
      console.log(`[inscripciones] autorizaciones firmadas (modo consola): ${adjuntos.length} PDF`);
    } else if (!emailDePrueba(cuenta.email)) {
      await sendAutorizacionesEmail(cuenta.email, evento.evento, adjuntos);
      emailEnviado = true;
    }
  } catch (error) {
    console.error("inscripciones/firmar email", error instanceof Error ? error.name : "error");
  }
  return { emailEnviado };
}

/**
 * Un menor que se inscribió solo le pide a un adulto que firme: se lo vincula a su cuenta
 * y se le avisa por email. El aviso no lleva nombres.
 */
export async function pedirFirmaDeAdulto(input: { cuenta: CuentaSesion; evento: EventoConInscripcion; adultoEmail: string }): Promise<void> {
  await createInvitacionFirma(input.cuenta.cuentaId, input.adultoEmail);
  if (modoConsola() || emailDePrueba(input.adultoEmail)) return;
  // Si el aviso falla, el pedido igual queda hecho: vale con que el adulto entre con su email.
  await sendFirmaAdultoEmail(input.adultoEmail, input.evento.evento, INVITACION_DIAS).catch(() => undefined);
}

function pdfFilename(tipo: "evento" | "imagen", personaNombre: string): string {
  const persona = personaNombre.normalize("NFD").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "persona";
  return `${tipo === "evento" ? "autorizacion" : "uso-de-imagen"}-${persona}.pdf`;
}

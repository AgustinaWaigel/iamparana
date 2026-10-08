import "server-only";

import crypto from "crypto";

// Textos que firma el adulto responsable. El texto exacto que se muestra es el que
// se guarda con la firma, junto con su huella (hash), para poder demostrar qué se aceptó.
//
// IMPORTANTE: los dos textos por defecto son un punto de partida. Conviene que los
// revise la diócesis o un abogado antes de usarlos con familias.

function fechaLarga(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Texto de la autorización de un evento: el que cargó el admin o, si no cargó ninguno, el genérico. */
export function textoAutorizacionEvento(evento: { evento: string; fecha: string; fechaFin: string | null }, textoAdmin: string): string {
  const cuando = evento.fechaFin && evento.fechaFin !== evento.fecha
    ? `del ${fechaLarga(evento.fecha)} al ${fechaLarga(evento.fechaFin)}`
    : `el ${fechaLarga(evento.fecha)}`;
  const encabezado = `Autorización para participar de «${evento.evento}», ${cuando}, organizado por la Infancia y Adolescencia Misionera (IAM) de Paraná.`;

  const cuerpo = textoAdmin.trim() || [
    "Autorizo a la persona indicada en este documento a participar de la actividad, incluidos los traslados que formen parte de ella.",
    "Declaro que los datos de salud y de contacto que cargué en la inscripción son verdaderos y están actualizados, y me comprometo a avisar si cambian antes del evento.",
    "Autorizo a las personas a cargo del evento a actuar ante una urgencia médica, incluido el traslado a un centro de salud, y a avisarme de inmediato al teléfono de contacto que informé.",
  ].join("\n\n");

  return `${encabezado}\n\n${cuerpo}`;
}

/** Último día de vigencia del permiso de imagen: fin del año en curso. */
export function vigenciaImagen(todayYmd: string): string {
  return `${todayYmd.slice(0, 4)}-12-31`;
}

export function textoAutorizacionImagen(todayYmd: string): string {
  return [
    "Uso de imagen.",
    "Autorizo a la Infancia y Adolescencia Misionera (IAM) de Paraná a tomar fotografías y videos de la persona indicada en este documento durante sus actividades, y a publicarlos en sus medios de comunicación (sitio web, redes sociales y material impreso), sin fines comerciales.",
    `Esta autorización vale hasta el ${fechaLarga(vigenciaImagen(todayYmd))} y puedo retirarla en cualquier momento desde mi cuenta familiar.`,
  ].join("\n\n");
}

export function hashTexto(texto: string): string {
  return crypto.createHash("sha256").update(texto, "utf8").digest("hex");
}

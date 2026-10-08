import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

// PDF de una autorización firmada. Se arma en el momento a partir de lo guardado
// con la firma; no queda ningún archivo en disco.

export interface FirmaPdfData {
  tipo: "evento" | "imagen";
  acepta: boolean;
  texto: string;
  textoHash: string;
  personaNombre: string;
  personaCuil: string | null;
  firmanteNombre: string;
  firmanteDni: string;
  firmanteEmail: string | null;
  firmaPng: Uint8Array | null;
  userAgent: string | null;
  /** Fecha y hora de la firma, en UTC (formato de la base). */
  createdAt: string;
  revocadaAt: string | null;
}

const PAGE = { width: 595.28, height: 841.89, margin: 56 };
const INK = rgb(0.17, 0.11, 0.07);
const SOFT = rgb(0.42, 0.36, 0.31);

function fechaHora(utc: string): string {
  const date = new Date(`${utc.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return utc;
  return `${date.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "long", timeStyle: "short" })} (hora de Argentina)`;
}

export async function buildFirmaPdf(data: FirmaPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const charset = new Set(regular.getCharacterSet());
  // La fuente estándar no tiene todos los caracteres: los que falten no deben romper el PDF.
  const clean = (value: string) => Array.from(value.replace(/\t/g, " ")).map((char) => (charset.has(char.codePointAt(0)!) ? char : "?")).join("");

  let page: PDFPage = pdf.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;
  const maxWidth = PAGE.width - PAGE.margin * 2;

  const ensure = (height: number) => {
    if (y - height < PAGE.margin) {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
    }
  };

  const write = (text: string, options: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {}) => {
    const font = options.font ?? regular;
    const size = options.size ?? 11;
    const lineHeight = size * 1.45;
    for (const paragraph of clean(text).split(/\r?\n/)) {
      const lines: string[] = [];
      let line = "";
      for (const word of paragraph.split(" ")) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      lines.push(line);
      for (const item of lines) {
        ensure(lineHeight);
        y -= lineHeight;
        page.drawText(item, { x: PAGE.margin, y, size, font, color: options.color ?? INK });
      }
    }
    y -= options.gap ?? 8;
  };

  write("Infancia y Adolescencia Misionera de Paraná", { size: 10, color: SOFT, gap: 2 });
  write(data.tipo === "evento" ? "Autorización de participación" : "Autorización de uso de imagen", { font: bold, size: 18, gap: 14 });

  write("Persona autorizada", { font: bold, size: 11, gap: 0 });
  write(`${data.personaNombre}${data.personaCuil ? ` — CUIL ${data.personaCuil}` : ""}`, { gap: 14 });

  write("Texto aceptado", { font: bold, size: 11, gap: 2 });
  write(data.texto, { gap: 14 });

  if (data.tipo === "imagen") {
    write(data.acepta ? "Respuesta: SÍ autoriza el uso de imagen." : "Respuesta: NO autoriza el uso de imagen.", { font: bold, gap: 14 });
  }
  if (data.revocadaAt) {
    write(`Esta autorización fue retirada el ${fechaHora(data.revocadaAt)}.`, { font: bold, gap: 14 });
  }

  write("Firma", { font: bold, size: 11, gap: 4 });
  if (data.firmaPng) {
    try {
      const image = await pdf.embedPng(data.firmaPng);
      const scale = Math.min(220 / image.width, 90 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ensure(height + 8);
      y -= height;
      page.drawImage(image, { x: PAGE.margin, y, width, height });
      y -= 4;
      page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.margin + 220, y }, thickness: 0.6, color: SOFT });
      y -= 6;
    } catch {
      write("(No se pudo incluir la imagen de la firma.)", { color: SOFT });
    }
  }
  write(`${data.firmanteNombre} — DNI ${data.firmanteDni}`, { gap: 2 });
  write(`Firmado el ${fechaHora(data.createdAt)}.`, { gap: 16 });

  write("Constancia de firma electrónica", { font: bold, size: 9, color: SOFT, gap: 0 });
  write(
    [
      data.firmanteEmail ? `Quien firmó entró a su cuenta con un código enviado a ${data.firmanteEmail}.` : "",
      data.userAgent ? `Dispositivo: ${data.userAgent}` : "",
      `Huella del texto aceptado (SHA-256): ${data.textoHash}`,
    ].filter(Boolean).join("\n"),
    { size: 8, color: SOFT },
  );

  return pdf.save();
}

/** PDF de una firma tal como se guarda (con la firma dibujada como data URL). */
export async function firmaGuardadaToPdf(firma: Omit<FirmaPdfData, "firmaPng"> & { firmaPng: string | null }): Promise<Buffer> {
  const png = firma.firmaPng ? Buffer.from(firma.firmaPng.slice(firma.firmaPng.indexOf(",") + 1), "base64") : null;
  return Buffer.from(await buildFirmaPdf({ ...firma, firmaPng: png }));
}

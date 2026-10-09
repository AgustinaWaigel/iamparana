import "server-only";

import crypto from "node:crypto";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { google } from "googleapis";
import { getTursoClient } from "@/server/db/turso";

// Copia de seguridad de la base de datos. Se guarda CIFRADA en una carpeta PRIVADA del
// Google Drive del sitio: el archivo tiene datos de familias, así que sin la clave
// INSCRIPCIONES_SECRET no se puede leer, y nunca se comparte con nadie.
//
// Formato del archivo: "IAMRESP1" + iv (12 bytes) + tag (16 bytes) + datos (JSON comprimido y cifrado).
// Para leerlo: node scripts/respaldo-leer.mjs <archivo>

const CARPETA = "Respaldos del sitio IAM (privado, no compartir)";
const MAGIA = Buffer.from("IAMRESP1");
/** Cuántas copias se conservan; las más viejas se borran. */
const CONSERVAR = 8;
// Tablas que no se respaldan: sesiones abiertas, códigos y pedidos de un solo uso, y quién está en línea.
const EXCLUIDAS = new Set(["auth_sessions", "auth_2fa", "password_resets", "cuenta_sesiones", "cuenta_codigos", "user_presence", "visitor_presence"]);

export interface RespaldoInfo {
  id: string;
  nombre: string;
  creado: string;
  /** Tamaño en bytes. */
  peso: number;
}

function claveDeRespaldo(): Buffer {
  const secret = process.env.INSCRIPCIONES_SECRET;
  const master = secret ? Buffer.from(secret, "base64") : null;
  if (!master || master.length < 32) throw new Error("INSCRIPCIONES_SECRET no configurada: no se puede cifrar el respaldo");
  return Buffer.from(crypto.hkdfSync("sha256", master, Buffer.alloc(0), "iam-inscripciones:respaldo", 32));
}

function drive() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) throw new Error("Google Drive no está configurado");
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth });
}

async function carpetaId(cliente: ReturnType<typeof drive>): Promise<string> {
  const busqueda = await cliente.files.list({
    q: `name='${CARPETA}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });
  const existente = busqueda.data.files?.[0]?.id;
  if (existente) return existente;
  // La carpeta se crea sin compartir: solo la ve la cuenta dueña del Drive.
  const creada = await cliente.files.create({ requestBody: { name: CARPETA, mimeType: "application/vnd.google-apps.folder" }, fields: "id" });
  if (!creada.data.id) throw new Error("No se pudo crear la carpeta de respaldos");
  return creada.data.id;
}

/** Todas las tablas con sus filas. Los datos binarios van en base64. */
async function volcarBase(): Promise<{ tablas: number; filas: number; json: string }> {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  const lista = await client.execute("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%' ORDER BY name");
  const tablas: Record<string, { sql: string; columnas: string[]; filas: unknown[][] }> = {};
  let filas = 0;
  for (const tabla of lista.rows) {
    const nombre = String(tabla.name);
    if (EXCLUIDAS.has(nombre)) continue;
    const datos = await client.execute(`SELECT * FROM "${nombre.replace(/"/g, '""')}"`);
    tablas[nombre] = {
      sql: String(tabla.sql ?? ""),
      columnas: datos.columns,
      filas: datos.rows.map((row) =>
        datos.columns.map((columna) => {
          const valor = row[columna];
          if (valor instanceof ArrayBuffer) return { base64: Buffer.from(valor).toString("base64") };
          if (typeof valor === "bigint") return Number(valor);
          return valor ?? null;
        }),
      ),
    };
    filas += datos.rows.length;
  }
  return { tablas: Object.keys(tablas).length, filas, json: JSON.stringify({ version: 1, creado: new Date().toISOString(), tablas }) };
}

/** Hace una copia cifrada, la sube a Drive y borra las más viejas. No devuelve ningún dato personal. */
export async function crearRespaldo(): Promise<{ nombre: string; tablas: number; filas: number; peso: number }> {
  const { tablas, filas, json } = await volcarBase();
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv("aes-256-gcm", claveDeRespaldo(), iv);
  const cifrado = Buffer.concat([cifrador.update(gzipSync(Buffer.from(json, "utf8"))), cifrador.final()]);
  const archivo = Buffer.concat([MAGIA, iv, cifrador.getAuthTag(), cifrado]);

  const cliente = drive();
  const carpeta = await carpetaId(cliente);
  const nombre = `respaldo-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.iamresp`;
  await cliente.files.create({
    requestBody: { name: nombre, parents: [carpeta], mimeType: "application/octet-stream" },
    media: { mimeType: "application/octet-stream", body: Readable.from([archivo]) },
    fields: "id",
  });

  // Se conservan las últimas copias; el resto se borra para no acumular datos de más.
  const viejas = (await listarRespaldos()).slice(CONSERVAR);
  for (const vieja of viejas) await cliente.files.delete({ fileId: vieja.id }).catch(() => undefined);

  return { nombre, tablas, filas, peso: archivo.length };
}

/** Copias guardadas, de la más nueva a la más vieja. */
export async function listarRespaldos(): Promise<RespaldoInfo[]> {
  const cliente = drive();
  const carpeta = await carpetaId(cliente);
  const lista = await cliente.files.list({
    q: `'${carpeta}' in parents and trashed=false`,
    fields: "files(id, name, createdTime, size)",
    orderBy: "createdTime desc",
    pageSize: 50,
  });
  return (lista.data.files ?? []).map((file) => ({ id: String(file.id), nombre: String(file.name), creado: String(file.createdTime ?? ""), peso: Number(file.size ?? 0) }));
}

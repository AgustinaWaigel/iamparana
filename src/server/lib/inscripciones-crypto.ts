import "server-only";

import crypto from "crypto";

// Criptografía del módulo de inscripciones. Todo sale de una única clave maestra
// (INSCRIPCIONES_SECRET, 32 bytes en base64). Si falta, el módulo no funciona:
// es preferible un error a guardar datos de menores sin cifrar.
//
// IMPORTANTE: si se pierde o se cambia esa clave, los datos cifrados (CUIL, fichas
// de salud) no se pueden recuperar. Tiene que estar respaldada fuera del servidor.

type KeyPurpose = "cifrado" | "indice" | "codigos";

const derivedKeys = new Map<KeyPurpose, Buffer>();

function getKey(purpose: KeyPurpose): Buffer {
  const cached = derivedKeys.get(purpose);
  if (cached) return cached;

  const secret = process.env.INSCRIPCIONES_SECRET;
  const master = secret ? Buffer.from(secret, "base64") : null;
  if (!master || master.length < 32) {
    throw new Error("INSCRIPCIONES_SECRET no configurada o inválida (se esperan 32 bytes en base64)");
  }

  // Una subclave por uso: comprometer una no compromete a las otras.
  const key = Buffer.from(crypto.hkdfSync("sha256", master, Buffer.alloc(0), `iam-inscripciones:${purpose}`, 32));
  derivedKeys.set(purpose, key);
  return key;
}

/** Identificador aleatorio no adivinable (para personas, cuentas, inscripciones...). */
export function createRandomId(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/** Cifra un texto con AES-256-GCM. Devuelve "v1.iv.tag.datos" en base64url. */
export function encryptText(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey("cifrado"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decryptText(stored: string): string {
  const [version, iv, tag, data] = stored.split(".");
  if (version !== "v1" || !iv || !tag || data === undefined) {
    throw new Error("Dato cifrado con formato desconocido");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey("cifrado"), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

export function encryptJson(value: unknown): string {
  return encryptText(JSON.stringify(value));
}

export function decryptJson<T>(stored: string): T {
  return JSON.parse(decryptText(stored)) as T;
}

/**
 * Índice ciego: permite buscar o exigir unicidad sobre un dato cifrado (el CUIL)
 * sin guardarlo legible. El mismo valor da siempre el mismo índice.
 */
export function blindIndex(value: string): string {
  return crypto.createHmac("sha256", getKey("indice")).update(value.trim()).digest("base64url");
}

/** Código de acceso de 6 dígitos. */
export function createAccessCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Huella de un código atada al email, para que no sirva con otra cuenta. */
export function hashAccessCode(email: string, code: string): string {
  return crypto.createHmac("sha256", getKey("codigos")).update(`${email}\n${code}`).digest("base64url");
}

/** Comparación en tiempo constante de dos huellas. */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

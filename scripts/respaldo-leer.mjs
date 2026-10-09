// Descifra una copia de seguridad del sitio y la deja como archivo JSON.
//
//   node scripts/respaldo-leer.mjs <archivo.iamresp> [salida.json]
//
// Sin el segundo argumento solo muestra un resumen (tablas y cantidad de filas), sin guardar nada.
// Usa INSCRIPCIONES_SECRET de .env.local: tiene que ser la misma clave con la que se hizo la copia.
//
// CUIDADO: el JSON descifrado tiene datos personales de familias. Guardalo solo el tiempo que haga
// falta para recuperar lo perdido y después borralo. No lo subas a ningún lado.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const [entrada, salida] = process.argv.slice(2);
if (!entrada) {
  console.error('Uso: node scripts/respaldo-leer.mjs <archivo.iamresp> [salida.json]');
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
    const corte = line.indexOf('=');
    return [line.slice(0, corte), line.slice(corte + 1).replace(/^(["'])(.*)\1$/, '$2')];
  }),
);
const master = env.INSCRIPCIONES_SECRET ? Buffer.from(env.INSCRIPCIONES_SECRET, 'base64') : null;
if (!master || master.length < 32) {
  console.error('Falta INSCRIPCIONES_SECRET en .env.local, o no es válida.');
  process.exit(1);
}
const clave = Buffer.from(crypto.hkdfSync('sha256', master, Buffer.alloc(0), 'iam-inscripciones:respaldo', 32));

const archivo = fs.readFileSync(entrada);
if (archivo.subarray(0, 8).toString() !== 'IAMRESP1') {
  console.error('Ese archivo no es una copia de seguridad del sitio.');
  process.exit(1);
}

let datos;
try {
  const descifrador = crypto.createDecipheriv('aes-256-gcm', clave, archivo.subarray(8, 20));
  descifrador.setAuthTag(archivo.subarray(20, 36));
  datos = JSON.parse(gunzipSync(Buffer.concat([descifrador.update(archivo.subarray(36)), descifrador.final()])).toString('utf8'));
} catch {
  console.error('No se pudo descifrar: la clave no es la misma con la que se hizo la copia, o el archivo está dañado.');
  process.exit(1);
}

console.log(`Copia del ${datos.creado}`);
for (const [nombre, tabla] of Object.entries(datos.tablas)) console.log(`  ${nombre}: ${tabla.filas.length} filas`);

if (salida) {
  fs.writeFileSync(salida, JSON.stringify(datos));
  console.log(`\nGuardado en ${salida}. Tiene datos personales: borralo cuando termines.`);
}

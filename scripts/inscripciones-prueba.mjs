// Carga (o borra) familias de prueba inscriptas en un evento, para ver cómo quedan
// el resumen, la lista y la vista de logística del admin.
//
// Uso (con el servidor de desarrollo corriendo en http://localhost:3000):
//   node scripts/inscripciones-prueba.mjs crear            → en el primer evento con inscripción abierta
//   node scripts/inscripciones-prueba.mjs crear <eventoId> → en ese evento
//   node scripts/inscripciones-prueba.mjs borrar           → borra toda la gente de prueba
//
// Las cuentas de prueba usan el dominio @prueba.invalid (no existe, así que no se les
// manda ningún email) y en el admin aparecen con la etiqueta "Prueba". Todo pasa por
// las mismas rutas que usa una familia real, así que los datos quedan cifrados igual.

import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { createClient } from '@libsql/client';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const DOMINIO = '@prueba.invalid';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);
const db = createClient({ url: env.TURSO_CONNECTION_URL, authToken: env.TURSO_AUTH_TOKEN });

const NO = { tiene: false, detalle: '' };
const si = (detalle) => ({ tiene: true, detalle });

// rol del adulto: null = no va al evento (solo deja nombre y teléfono).
const FAMILIAS = [
  { apellido: 'Gómez', ciudad: 'Paraná', adulto: 'Mariana', rol: null, firma: true, imagen: true, hijos: [
    { nombre: 'Tomás', sexo: 'M', edad: 7 }, { nombre: 'Lucía', sexo: 'F', edad: 9, alergias: si('Maní') }] },
  { apellido: 'Fernández', ciudad: 'Paraná', adulto: 'Carlos', rol: null, firma: true, imagen: true, otro: ['Elena Ruiz', '343 4551122', 'abuela'], hijos: [
    { nombre: 'Benjamín', sexo: 'M', edad: 6 }, { nombre: 'Martina', sexo: 'F', edad: 8, dieta: si('Celíaca'), comida: true }, { nombre: 'Joaquín', sexo: 'M', edad: 11 }] },
  { apellido: 'Ramírez', ciudad: 'Crespo', adulto: 'Silvia', rol: 'acompanante', sexo: 'F', edadAdulto: 41, firma: true, imagen: true, hijos: [
    { nombre: 'Valentina', sexo: 'F', edad: 10, enfermedad: si('Asma'), medicacion: si('Salbutamol, si le falta el aire') }] },
  { apellido: 'Acosta', ciudad: 'Paraná', adulto: 'Diego', rol: null, firma: true, imagen: true, hijos: [
    { nombre: 'Mateo', sexo: 'M', edad: 7 }, { nombre: 'Emma', sexo: 'F', edad: 6 }] },
  { apellido: 'Benítez', ciudad: 'Diamante', adulto: 'Laura', rol: null, firma: true, imagen: false, hijos: [
    { nombre: 'Santino', sexo: 'M', edad: 9, dieta: si('Vegetariano') }] },
  { apellido: 'Sosa', ciudad: 'Paraná', adulto: 'Gabriela', rol: 'animador', sexo: 'F', edadAdulto: 24, animaA: 'Grupo de 3° y 4° grado', firma: true, imagen: true, hijos: [] },
  { apellido: 'Medina', ciudad: 'Crespo', adulto: 'Rodrigo', rol: null, firma: true, imagen: true, hijos: [
    { nombre: 'Catalina', sexo: 'F', edad: 12 }, { nombre: 'Felipe', sexo: 'M', edad: 8, alergias: si('Picadura de abeja'), medicacion: si('Antihistamínico') }] },
  { apellido: 'Herrera', ciudad: 'Paraná', adulto: 'Paula', rol: 'area', area: 'logistica', sexo: 'F', edadAdulto: 33, firma: true, imagen: true, hijos: [
    { nombre: 'Bautista', sexo: 'M', edad: 7 }] },
  { apellido: 'Ojeda', ciudad: 'Paraná', adulto: 'Martín', rol: 'area', area: 'animacion', sexo: 'M', edadAdulto: 27, dietaAdulto: si('Sin lactosa'), firma: true, imagen: true, hijos: [] },
  { apellido: 'Villalba', ciudad: 'Diamante', adulto: 'Noelia', rol: null, firma: true, imagen: true, hijos: [
    { nombre: 'Isabella', sexo: 'F', edad: 13 }, { nombre: 'Thiago', sexo: 'M', edad: 10, dieta: si('Celíaco'), comida: false }] },
  { apellido: 'Cardozo', ciudad: 'Paraná', adulto: 'Julián', rol: 'area', area: 'espiritualidad', sexo: 'M', edadAdulto: 38, firma: true, imagen: true, hijos: [
    { nombre: 'Agustina', sexo: 'F', edad: 6 }, { nombre: 'Lautaro', sexo: 'M', edad: 9, enfermedad: si('Diabetes tipo 1'), medicacion: si('Insulina') }] },
  { apellido: 'Paz', ciudad: 'Paraná', adulto: 'Florencia', rol: 'animador', sexo: 'F', edadAdulto: 21, animaA: 'Grupo de 1° y 2° grado', firma: true, imagen: false, hijos: [] },
  // Animadores de 17: se inscriben solos y la autorización la firma un adulto desde su email.
  { apellido: 'Quiroga', ciudad: 'Paraná', adulto: 'Camila', rol: 'animador', sexo: 'F', edadAdulto: 17, animaA: 'Grupo de 5° y 6° grado', hijos: [] },
  { apellido: 'Zapata', ciudad: 'Crespo', adulto: 'Ignacio', rol: 'animador', sexo: 'M', edadAdulto: 17, animaA: 'Grupo de 3° y 4° grado', hijos: [] },
  { apellido: 'Leiva', ciudad: 'Crespo', adulto: 'Hernán', rol: 'area', area: 'comunicacion', sexo: 'M', edadAdulto: 29, firma: true, imagen: true, hijos: [] },
  { apellido: 'Roldán', ciudad: 'Paraná', adulto: 'Cecilia', rol: null, firma: true, imagen: true, hijos: [
    { nombre: 'Olivia', sexo: 'F', edad: 8 }, { nombre: 'Simón', sexo: 'M', edad: 7, alergias: si('Huevo') }, { nombre: 'Renata', sexo: 'F', edad: 11 }] },
];

function gradoPorEdad(edad) {
  if (edad <= 5) return 'Jardín';
  return edad <= 11 ? `${edad - 5}° grado` : `${edad - 11}° año`;
}

function cuilValido() {
  for (;;) {
    const base = `20${String(crypto.randomInt(10000000, 99999999))}`;
    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const mod = 11 - (pesos.reduce((total, peso, i) => total + peso * Number(base[i]), 0) % 11);
    if (mod === 10) continue;
    return base + (mod === 11 ? 0 : mod);
  }
}

// Imagen PNG con un garabato, como la que manda el recuadro de firma.
function firmaPng() {
  const w = 240, h = 80;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  const fase = crypto.randomInt(0, 60);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const on = Math.abs(40 + 22 * Math.sin((x + fase) / 14) - y) < 1.6 && x > 20 && x < 220;
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = 31; raw[o + 1] = 20; raw[o + 2] = 16; raw[o + 3] = on ? 255 : 0;
    }
  }
  const tabla = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const byte of buf) c = tabla[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

async function borrar() {
  const cuentas = `SELECT id FROM cuentas WHERE email LIKE '%${DOMINIO}'`;
  const personas = `SELECT persona_id FROM cuenta_persona WHERE cuenta_id IN (${cuentas})`;
  const antes = Number((await db.execute(`SELECT COUNT(*) AS n FROM cuentas WHERE email LIKE '%${DOMINIO}'`)).rows[0].n);
  // Los ids se juntan antes de borrar los vínculos, que es de donde salen.
  const ids = (await db.execute(personas)).rows.map((row) => String(row.persona_id));
  const lista = ids.map(() => '?').join(',') || "''";
  await db.batch([
    { sql: `DELETE FROM firmas WHERE persona_id IN (${lista})`, args: ids },
    { sql: `DELETE FROM inscripciones WHERE persona_id IN (${lista})`, args: ids },
    { sql: `DELETE FROM contactos_emergencia WHERE persona_id IN (${lista})`, args: ids },
    { sql: `DELETE FROM personas_salud WHERE persona_id IN (${lista})`, args: ids },
    { sql: `DELETE FROM cuenta_persona WHERE cuenta_id IN (${cuentas})`, args: [] },
    { sql: `DELETE FROM personas WHERE id IN (${lista})`, args: ids },
    { sql: `DELETE FROM cuenta_sesiones WHERE cuenta_id IN (${cuentas})`, args: [] },
    { sql: `DELETE FROM cuentas WHERE email LIKE '%${DOMINIO}'`, args: [] },
  ], 'write');
  console.log(`Borradas ${antes} cuentas de prueba y ${ids.length} personas.`);
}

async function crear(eventoArg) {
  const config = eventoArg
    ? (await db.execute({ sql: 'SELECT * FROM agenda_inscripcion WHERE evento_id = ?', args: [eventoArg] })).rows[0]
    : (await db.execute("SELECT * FROM agenda_inscripcion WHERE habilitada = 1 AND (abre_at IS NULL OR abre_at <= DATE('now', '-3 hours')) AND (cierra_at IS NULL OR cierra_at >= DATE('now', '-3 hours')) LIMIT 1")).rows[0];
  if (!config) throw new Error('No encontré un evento con la inscripción abierta. Abrí una desde /calendario o pasá el id del evento.');
  const eventoId = String(config.evento_id);
  const roles = JSON.parse(String(config.roles_json));
  const pideSalud = Number(config.pide_salud) === 1;
  const preguntas = JSON.parse(String(config.preguntas_json || '[]'));

  const grupos = (await db.execute('SELECT id FROM grupos_iam WHERE activo = 1 ORDER BY nombre')).rows.map((row) => String(row.id));
  if (grupos.length === 0) throw new Error('No hay grupos IAM activos. Cargá alguno en /admin/inscripciones.');

  const ping = await fetch(`${BASE}/inscripciones`).catch(() => null);
  if (!ping?.ok) throw new Error(`El sitio no responde en ${BASE}. Levantá el servidor con npm run dev.`);

  // Fecha de nacimiento para que hoy tenga exactamente esa edad (cumplió hace entre 1 y 7 meses).
  const nacimiento = (edad, i) => {
    const fecha = new Date();
    fecha.setFullYear(fecha.getFullYear() - edad);
    fecha.setDate(fecha.getDate() - 30 - ((i * 37) % 180));
    return fecha.toISOString().slice(0, 10);
  };
  const respuestas = () => Object.fromEntries(preguntas.map((p) => [p.id, p.tipo === 'si_no' ? 'si' : p.tipo === 'opciones' ? p.opciones[0] ?? '' : 'Respuesta de prueba']));
  const lote = crypto.randomBytes(3).toString('hex');
  let personasCreadas = 0;

  for (const [index, familia] of FAMILIAS.entries()) {
    const cuentaId = `prueba-${crypto.randomBytes(10).toString('hex')}`;
    const token = crypto.randomBytes(32).toString('hex');
    await db.batch([
      { sql: 'INSERT INTO cuentas (id, email) VALUES (?, ?)', args: [cuentaId, `familia-${lote}-${index + 1}${DOMINIO}`] },
      { sql: "INSERT INTO cuenta_sesiones (token_hash, cuenta_id, expires_at) VALUES (?, ?, DATETIME('now', '+1 hour'))", args: [crypto.createHash('sha256').update(token).digest('hex'), cuentaId] },
    ], 'write');

    const post = async (path, body) => {
      // El servidor de desarrollo a veces corta la conexión mientras recompila: se reintenta.
      let response;
      for (let intento = 1; ; intento++) {
        try {
          response = await fetch(BASE + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: BASE, Cookie: `iam_familia=${token}` },
            body: JSON.stringify(body),
          });
          break;
        } catch (error) {
          if (intento === 4) throw error;
          await new Promise((resolve) => setTimeout(resolve, 3000 * intento));
        }
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`${path} (${familia.apellido}): ${data.error || response.status}`);
      return data;
    };

    const grupoId = grupos[index % grupos.length];
    const telefono = `343 4${String(100000 + index * 7919).slice(0, 6)}`;
    const grupoSanguineo = ['0+', 'A+', 'B+', '0-'][index % 4];
    const condiciones = (p) => ({ enfermedad: p.enfermedad ?? NO, medicacion: p.medicacion ?? NO, alergias: p.alergias ?? NO, dieta: p.dieta ?? NO });
    const items = [];

    const adultoVa = familia.rol && roles.includes(familia.rol);
    const titular = await post('/api/inscripciones/personas', adultoVa ? {
      nombre: familia.adulto, apellido: familia.apellido, sexo: familia.sexo, cuil: cuilValido(), fechaNacimiento: nacimiento(familia.edadAdulto, index),
      telefono, ciudad: familia.ciudad, grupoId: familia.rol === 'area' ? '' : grupoId, salud: { grupoSanguineo, ...condiciones({ dieta: familia.dietaAdulto }) }, consentimiento: true,
    } : { soloContacto: true, nombre: familia.adulto, apellido: familia.apellido, telefono, consentimiento: true });
    personasCreadas += 1;
    if (adultoVa) {
      items.push({
        personaId: titular.id, rol: familia.rol, area: familia.area ?? '', animaA: familia.animaA ?? '', respuestas: respuestas(), llevaComida: false,
        ...(familia.edadAdulto < 18 ? { grado: gradoPorEdad(familia.edadAdulto) } : {}),
        ...(pideSalud ? { salud: condiciones({ dieta: familia.dietaAdulto }) } : {}),
        otroContacto: { nombre: `Contacto de ${familia.adulto}`, telefono: '343 4000111', vinculo: 'familiar' },
      });
    }

    if (roles.includes('participante')) {
      for (const [i, hijo] of familia.hijos.entries()) {
        const persona = await post('/api/inscripciones/personas', {
          nombre: hijo.nombre, apellido: familia.apellido, sexo: hijo.sexo, cuil: cuilValido(), fechaNacimiento: nacimiento(hijo.edad, index + i),
          telefono: '', ciudad: familia.ciudad, grupoId, vinculo: 'Hijo/a', salud: { grupoSanguineo, ...condiciones(hijo) },
        });
        personasCreadas += 1;
        items.push({
          personaId: persona.id, rol: 'participante', respuestas: respuestas(), llevaComida: Boolean(hijo.comida), grado: gradoPorEdad(hijo.edad),
          ...(pideSalud ? { salud: condiciones(hijo) } : {}),
          ...(familia.otro ? { otroContacto: { nombre: familia.otro[0], telefono: familia.otro[1], vinculo: familia.otro[2] } } : {}),
        });
      }
    }

    if (items.length === 0) { console.log(`· ${familia.apellido}: sin personas para los roles de este evento`); continue; }
    const menor = adultoVa && familia.edadAdulto < 18;
    await post('/api/inscripciones/inscribir', {
      eventoId,
      personas: items,
      ...(menor ? { adultoEmail: `adulto-${lote}-${index + 1}${DOMINIO}` } : {
        firma: {
          firmanteNombre: `${familia.adulto} ${familia.apellido}`, firmanteDni: String(crypto.randomInt(20000000, 45000000)), acepto: true,
          firma: firmaPng(), imagen: Object.fromEntries(items.map((item) => [item.personaId, familia.imagen !== false])),
        },
      }),
    });
    console.log(`· ${familia.apellido}: ${items.length} inscripto(s)${menor ? ', espera la firma de un adulto' : ', firmado'}`);
  }

  await db.execute(`DELETE FROM cuenta_sesiones WHERE cuenta_id IN (SELECT id FROM cuentas WHERE email LIKE '%${DOMINIO}')`);
  console.log(`\nListo: ${FAMILIAS.length} familias de prueba, ${personasCreadas} personas.`);
  console.log(`Mirá el resultado en ${BASE}/admin/inscripciones`);
}

const [accion, arg] = process.argv.slice(2);
try {
  if (accion === 'crear') await crear(arg);
  else if (accion === 'borrar') await borrar();
  else console.log('Uso: node scripts/inscripciones-prueba.mjs crear [eventoId] | borrar');
} catch (error) {
  console.error('No se pudo completar:', error.message);
  process.exitCode = 1;
}

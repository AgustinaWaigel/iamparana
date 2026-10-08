import "server-only";

import { getTursoClient } from "@/server/db/turso";

// Esquema del módulo de inscripciones a eventos (ver inscripciones-eventos.md).
// Vive aparte del esquema general para que nada del resto del sitio lo cargue.
//
// Convenciones:
// - Los ids de cuentas, personas, inscripciones y firmas son aleatorios (TEXT), no correlativos.
// - Las columnas *_cifrado guardan AES-256-GCM (server/lib/inscripciones-crypto.ts).
// - evento_id es TEXT porque los eventos pueden venir de la tabla `agenda` o de Google Calendar.

const STATEMENTS = [
  // ── Acceso ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS cuentas (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    consentimiento_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
  )`,
  // Los códigos se guardan por email (no por cuenta): la cuenta recién existe
  // después de verificar el primero, y así pedir un código no revela quién está registrado.
  `CREATE TABLE IF NOT EXISTS cuenta_codigos (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    codigo_hash TEXT NOT NULL,
    intentos INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    usado_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cuenta_codigos_email ON cuenta_codigos(email, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS cuenta_sesiones (
    token_hash TEXT PRIMARY KEY,
    cuenta_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cuenta_sesiones_cuenta ON cuenta_sesiones(cuenta_id)`,
  // Un adulto invita a otro email a ver e inscribir a las mismas personas a cargo.
  `CREATE TABLE IF NOT EXISTS cuenta_invitaciones (
    id TEXT PRIMARY KEY,
    cuenta_id TEXT NOT NULL,
    email TEXT NOT NULL,
    aceptada_at TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cuenta_invitaciones_email ON cuenta_invitaciones(email)`,

  // ── Grupos IAM ───────────────────────────────────────────────────────
  // Los carga el admin; las familias eligen el suyo de la lista.
  `CREATE TABLE IF NOT EXISTS grupos_iam (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    ciudad TEXT,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // ── Personas ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    sexo TEXT,
    cuil_cifrado TEXT,
    cuil_indice TEXT UNIQUE,
    fecha_nacimiento TEXT NOT NULL,
    telefono TEXT,
    ciudad TEXT,
    grupo_id TEXT,
    grado TEXT,
    grado_anio INTEGER,
    area TEXT CHECK(area IS NULL OR area IN ('animacion', 'comunicacion', 'formacion', 'logistica', 'espiritualidad')),
    anima_a TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos_iam(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_personas_grupo ON personas(grupo_id)`,
  // Una persona puede estar en más de una cuenta (p. ej. dos adultos responsables).
  `CREATE TABLE IF NOT EXISTS cuenta_persona (
    cuenta_id TEXT NOT NULL,
    persona_id TEXT NOT NULL,
    vinculo TEXT,
    es_titular INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cuenta_id, persona_id),
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cuenta_persona_persona ON cuenta_persona(persona_id)`,
  `CREATE TABLE IF NOT EXISTS personas_salud (
    persona_id TEXT PRIMARY KEY,
    datos_cifrado TEXT NOT NULL,
    confirmado_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS contactos_emergencia (
    id TEXT PRIMARY KEY,
    persona_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    vinculo TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contactos_emergencia_persona ON contactos_emergencia(persona_id)`,

  // Usuarios del sitio (animadores) que pueden ver a los inscriptos de una IAM. Lo asigna el admin.
  `CREATE TABLE IF NOT EXISTS grupo_animadores (
    grupo_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (grupo_id, user_id),
    FOREIGN KEY (grupo_id) REFERENCES grupos_iam(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_grupo_animadores_user ON grupo_animadores(user_id)`,

  // ── Eventos e inscripciones ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS agenda_inscripcion (
    evento_id TEXT PRIMARY KEY,
    habilitada INTEGER NOT NULL DEFAULT 0,
    abre_at TEXT,
    cierra_at TEXT,
    cupo INTEGER,
    lista_espera INTEGER NOT NULL DEFAULT 1,
    edad_min INTEGER,
    edad_max INTEGER,
    roles_json TEXT NOT NULL DEFAULT '["participante"]',
    pide_salud INTEGER NOT NULL DEFAULT 1,
    preguntas_json TEXT NOT NULL DEFAULT '[]',
    grupos_grado_json TEXT,
    autorizacion_texto TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS inscripciones (
    id TEXT PRIMARY KEY,
    persona_id TEXT NOT NULL,
    evento_id TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('participante', 'area', 'animador', 'acompanante')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'confirmada', 'lista_espera', 'cancelada')),
    respuestas_json TEXT NOT NULL DEFAULT '{}',
    pago_estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(pago_estado IN ('pendiente', 'pagado', 'exento')),
    pago_marcado_por INTEGER,
    pago_marcado_at TEXT,
    creada_por_cuenta_id TEXT,
    datos_snapshot_cifrado TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (persona_id, evento_id),
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
    FOREIGN KEY (creada_por_cuenta_id) REFERENCES cuentas(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inscripciones_evento ON inscripciones(evento_id, estado)`,

  // ── Firmas ───────────────────────────────────────────────────────────
  // tipo 'evento': una por persona y evento. tipo 'imagen': una por persona, vale hasta vigente_hasta.
  `CREATE TABLE IF NOT EXISTS firmas (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL CHECK(tipo IN ('evento', 'imagen')),
    persona_id TEXT NOT NULL,
    evento_id TEXT,
    cuenta_id TEXT,
    acepta INTEGER NOT NULL DEFAULT 1,
    firmante_nombre TEXT NOT NULL,
    firmante_dni_cifrado TEXT NOT NULL,
    texto_hash TEXT NOT NULL,
    firma_imagen TEXT,
    user_agent TEXT,
    vigente_hasta TEXT,
    revocada_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
    FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_firmas_persona ON firmas(persona_id, tipo)`,
  `CREATE INDEX IF NOT EXISTS idx_firmas_evento ON firmas(evento_id)`,
];

let schemaPromise: Promise<void> | null = null;

export function inscripcionesClient() {
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  return client;
}

/** Crea las tablas del módulo si faltan. Un solo viaje a la base por proceso. */
export function ensureInscripcionesSchema(): Promise<void> {
  if (!schemaPromise) {
    const client = inscripcionesClient();
    schemaPromise = client
      .batch(STATEMENTS, "write")
      // Bases creadas antes de unificar con los usuarios del sitio: falta la columna user_id.
      .then(() => client.execute("ALTER TABLE cuentas ADD COLUMN user_id INTEGER").catch(() => undefined))
      // Un usuario del sitio se vincula a una sola cuenta familiar (los NULL no chocan entre sí).
      .then(() => client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_cuentas_user ON cuentas(user_id)"))
      // El texto firmado se guarda completo para poder rearmar el PDF; antes solo estaba su huella.
      .then(() => client.execute("ALTER TABLE firmas ADD COLUMN texto TEXT").catch(() => undefined))
      // Invitación de un menor a un adulto para que firme por él: comparte también a quien invita.
      .then(() => client.execute("ALTER TABLE cuenta_invitaciones ADD COLUMN incluye_titular INTEGER NOT NULL DEFAULT 0").catch(() => undefined))
      // Bajas: cuándo fue y si fue después del cierre de la inscripción (en ese caso corresponde pagar igual).
      .then(() => client.execute("ALTER TABLE inscripciones ADD COLUMN baja_at TEXT").catch(() => undefined))
      .then(() => client.execute("ALTER TABLE inscripciones ADD COLUMN baja_fuera_de_termino INTEGER NOT NULL DEFAULT 0").catch(() => undefined))
      // Monto de la inscripción: el evento lo define por ciudad y cada inscripción guarda el que le tocó.
      .then(() => client.execute("ALTER TABLE agenda_inscripcion ADD COLUMN montos_json TEXT").catch(() => undefined))
      .then(() => client.execute("ALTER TABLE inscripciones ADD COLUMN monto INTEGER").catch(() => undefined))
      // Color con el que se identifica cada IAM en las planillas del admin.
      .then(() => client.execute("ALTER TABLE grupos_iam ADD COLUMN color TEXT").catch(() => undefined))
      // Con qué se pagó: transferencia o efectivo.
      .then(() => client.execute("ALTER TABLE inscripciones ADD COLUMN pago_medio TEXT").catch(() => undefined))
      // Los animadores piden el acceso desde su perfil y el admin lo aprueba. Lo que ya existía queda aprobado.
      .then(() => client.execute("ALTER TABLE grupo_animadores ADD COLUMN estado TEXT NOT NULL DEFAULT 'aprobado'").catch(() => undefined))
      // Quien coordina una IAM gestiona a sus animadores. A los coordinadores los nombra el admin.
      .then(() => client.execute("ALTER TABLE grupo_animadores ADD COLUMN rol TEXT NOT NULL DEFAULT 'animador'").catch(() => undefined))
      .then(() => undefined)
      .catch((error) => {
        schemaPromise = null;
        throw error;
      });
  }
  return schemaPromise;
}

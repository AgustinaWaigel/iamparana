import "server-only";

import { z } from "zod";

// Reglas de validación del módulo de inscripciones. Todo lo que llega del
// navegador pasa por acá antes de tocar la base: el cliente nunca es de fiar.

export const ROLES = ["participante", "area", "animador", "acompanante"] as const;
export type Rol = (typeof ROLES)[number];

export const AREAS = ["animacion", "comunicacion", "formacion", "logistica", "espiritualidad"] as const;

export const EDAD_ADULTO = 18;
/** Desde qué edad alguien puede tener su propia cuenta e inscribirse solo (hay animadores de 17). */
export const EDAD_CUENTA_PROPIA = 17;

const TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Fecha de hoy en Argentina, como YYYY-MM-DD. */
export function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

/** Toma la parte de fecha de un valor tipo "2026-11-08" o "2026-11-08T10:00:00-03:00". */
export function toYmd(value: string): string {
  return value.slice(0, 10);
}

/** Edad cumplida en una fecha dada (ambas YYYY-MM-DD). */
export function ageOn(birthYmd: string, onYmd: string): number {
  const [by, bm, bd] = birthYmd.split("-").map(Number);
  const [oy, om, od] = onYmd.split("-").map(Number);
  let age = oy - by;
  if (om < bm || (om === bm && od < bd)) age -= 1;
  return age;
}

/** Valida un CUIL/CUIT argentino (11 dígitos con dígito verificador). */
export function normalizeCuil(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return null;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + weight * Number(digits[index]), 0);
  const mod = 11 - (sum % 11);
  const check = mod === 11 ? 0 : mod === 10 ? 9 : mod;
  return check === Number(digits[10]) ? digits : null;
}

const text = (max: number) => z.string().trim().min(1, "Este dato es obligatorio.").max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida.");
const phone = z.string().trim().regex(/^[0-9+()\s-]{6,25}$/, "El teléfono no parece válido.");

/** Cada condición de salud: sí/no y, si es sí, el detalle. */
const condicion = z
  .object({ tiene: z.boolean(), detalle: z.string().trim().max(500).optional().default("") })
  .refine((value) => !value.tiene || value.detalle.length > 0, { message: "Contanos el detalle." });

/** Lo que casi no cambia. No se pide obra social ni afiliado: los eventos tienen seguro. */
export const saludFijaSchema = z.object({
  grupoSanguineo: z.string().trim().max(20).default(""),
});

/** Enfermedades, medicación, alergias y dieta: se cargan con la persona y se revisan en cada inscripción. */
export const condicionesSchema = z.object({
  enfermedad: condicion,
  medicacion: condicion,
  alergias: condicion,
  dieta: condicion,
});

/** Ficha completa, tal como se carga con la persona. */
export const saludSchema = saludFijaSchema.extend(condicionesSchema.shape);

/** Ficha guardada. Las condiciones pueden faltar en fichas cargadas antes de que se pidieran con la persona. */
export type SaludData = z.infer<typeof saludFijaSchema> & Partial<z.infer<typeof condicionesSchema>>;

export const contactoSchema = z.object({
  nombre: text(120),
  telefono: phone,
  vinculo: text(60),
});
export type ContactoData = z.infer<typeof contactoSchema>;

export const personaSchema = z.object({
  /** Presente al editar; ausente al crear. */
  id: z.string().trim().max(64).optional(),
  nombre: text(80),
  apellido: text(80),
  sexo: z.enum(["F", "M", "X"]),
  /** Obligatorio al crear; al editar, vacío significa "no cambia". */
  cuil: z.string().trim().max(20).optional().default(""),
  fechaNacimiento: ymd,
  telefono: z.union([phone, z.literal("")]).optional().transform((value) => value || null),
  ciudad: text(80),
  /** Obligatorio en menores. Un adulto puede no pertenecer a ninguna IAM (vacío). */
  grupoId: z.string().trim().max(64).optional().default(""),
  /** Relación de la persona con el titular de la cuenta (no aplica al titular). */
  vinculo: optionalText(60),
  salud: saludSchema,
  /** Consentimiento de tratamiento de datos; se exige la primera vez. */
  consentimiento: z.boolean().optional().default(false),
});
export type PersonaInput = z.infer<typeof personaSchema>;

/**
 * Adulto responsable que no participa de los eventos: solo se le pide nombre y
 * teléfono. Sin CUIL, fecha de nacimiento ni ficha de salud.
 */
export const titularContactoSchema = z.object({
  id: z.string().trim().max(64).optional(),
  nombre: text(80),
  apellido: text(80),
  telefono: phone,
  consentimiento: z.boolean().optional().default(false),
});
export type TitularContactoInput = z.infer<typeof titularContactoSchema>;

/** Lo que completa el adulto al firmar. */
export const firmaDatosSchema = z.object({
  firmanteNombre: text(120),
  firmanteDni: z.string().trim().transform((value) => value.replace(/[.\s]/g, "")).pipe(z.string().regex(/^\d{7,8}$/, "El DNI tiene que tener 7 u 8 números.")),
  acepto: z.literal(true, { message: "Para firmar tenés que marcar que leíste y aceptás." }),
  /** Firma dibujada, como imagen PNG. */
  firma: z.string().max(600000).regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "Falta la firma. Dibujala en el recuadro."),
  /** Decisión de uso de imagen por persona (true = autoriza). */
  imagen: z.record(z.string().max(64), z.boolean()).optional().default({}),
});
export type FirmaDatos = z.infer<typeof firmaDatosSchema>;

export const inscribirSchema = z.object({
  eventoId: z.string().trim().min(1).max(200),
  /** La inscripción se envía firmada: sin firma no se registra (salvo que quien inscribe sea menor). */
  firma: firmaDatosSchema.optional(),
  /** Email del adulto que va a firmar, cuando quien se inscribe es menor de edad. */
  adultoEmail: z.string().trim().max(254).optional().default(""),
  personas: z
    .array(
      z.object({
        personaId: z.string().trim().min(1).max(64),
        rol: z.enum(ROLES),
        llevaComida: z.boolean().optional().default(false),
        /** Área en la que participa en este evento (solo si el rol es "area"). */
        area: z.union([z.enum(AREAS), z.literal("")]).optional().transform((value) => value || null),
        /** Grupo o etapa que anima en este evento (solo si el rol es "animador"). */
        animaA: optionalText(80),
        /** Grado o año escolar a la fecha del evento (menores). */
        grado: optionalText(40),
        /** Enfermedades, medicación, alergias y dieta, revisadas y confirmadas para este evento. */
        salud: condicionesSchema.optional(),
        /** Otra persona a quien avisar, además del adulto que inscribe. */
        otroContacto: contactoSchema.optional(),
        respuestas: z.record(z.string().max(64), z.string().trim().max(500)).optional().default({}),
      }),
    )
    .min(1, "Elegí al menos una persona.")
    .max(20),
});
export type InscribirInput = z.infer<typeof inscribirSchema>;

const pregunta = z.object({
  id: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/),
  texto: text(160),
  tipo: z.enum(["texto", "si_no", "opciones"]),
  opciones: z.array(z.string().trim().min(1).max(80)).max(12).optional().default([]),
  obligatoria: z.boolean().optional().default(false),
  /** A quiénes se les pregunta, según cómo participan. Vacío = a todos. */
  roles: z.array(z.enum(ROLES)).max(ROLES.length).optional().default([]),
});

/** true si una pregunta del evento le corresponde a alguien que participa con ese rol. */
export function preguntaAplica(pregunta: { roles?: readonly string[] }, rol: string): boolean {
  return !pregunta.roles || pregunta.roles.length === 0 || pregunta.roles.includes(rol);
}
export type Pregunta = z.infer<typeof pregunta>;

export const eventoConfigSchema = z
  .object({
    eventoId: z.string().trim().min(1).max(200),
    habilitada: z.boolean(),
    abreAt: z.union([ymd, z.literal("")]).optional().transform((value) => value || null),
    cierraAt: z.union([ymd, z.literal("")]).optional().transform((value) => value || null),
    edadMin: z.number().int().min(0).max(120).nullable().optional().default(null),
    edadMax: z.number().int().min(0).max(120).nullable().optional().default(null),
    roles: z.array(z.enum(ROLES)).min(1, "Elegí al menos un rol."),
    pideSalud: z.boolean().optional().default(true),
    preguntas: z.array(pregunta).max(20).optional().default([]),
    autorizacionTexto: z.string().trim().max(8000).optional().default(""),
    /** Monto de la inscripción por ciudad, en pesos. */
    montos: z
      .object({
        porCiudad: z.record(z.string().trim().min(1).max(80), z.number().int().min(0).max(100000000)).refine((value) => Object.keys(value).length <= 80, { message: "Demasiadas ciudades." }),
        otras: z.number().int().min(0).max(100000000).nullable(),
      })
      .optional()
      .default({ porCiudad: {}, otras: null }),
  })
  .refine((value) => !value.abreAt || !value.cierraAt || value.abreAt <= value.cierraAt, {
    message: "El cierre no puede ser anterior a la apertura.",
  })
  .refine((value) => value.edadMin === null || value.edadMax === null || value.edadMin <= value.edadMax, {
    message: "La edad mínima no puede ser mayor que la máxima.",
  });
export type EventoConfigInput = z.infer<typeof eventoConfigSchema>;

export const grupoSchema = z.object({
  id: z.string().trim().max(64).optional(),
  nombre: text(120),
  ciudad: optionalText(80),
  activo: z.boolean().optional().default(true),
  /** Color de la IAM en las planillas, como #rrggbb; vacío = sin color. */
  color: z.union([z.string().trim().regex(/^#[0-9a-fA-F]{6}$/), z.literal("")]).optional().transform((value) => value || null),
});

/** Primer mensaje de error legible de una validación fallida. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message || "Revisá los datos e intentá de nuevo.";
}

export const firmarSchema = firmaDatosSchema.extend({ eventoId: z.string().trim().min(1).max(200) });
export type FirmarInput = z.infer<typeof firmarSchema>;

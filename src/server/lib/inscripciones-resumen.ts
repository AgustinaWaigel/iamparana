import "server-only";

import { grupoDeGrado, type GrupoGrado } from "@/app/inscripciones/grados";
import type { InscriptoAdmin } from "@/server/db/inscripciones-admin-repository";
import { EDAD_ADULTO, ageOn } from "@/server/lib/inscripciones-validation";

// Filtros y totales del panel de un evento. Todo se calcula en el servidor a partir
// de los inscriptos: al navegador le llegan solo los números o las filas ya filtradas.

export const FILTROS = ["rol", "area", "grupo", "ciudad", "sexo", "grado", "firma", "imagen", "dieta", "alergias", "medicacion", "enfermedad", "comida", "pregunta"] as const;
export type FiltroKey = (typeof FILTROS)[number];
export type Filtros = Partial<Record<FiltroKey, string>>;

export const SIN_DATO = "Sin dato";
export const AREAS_GRUPO = "Áreas";
export const SIN_IAM = "Sin IAM";

/** Con qué grupo se cuenta a un inscripto: quien va por un área se cuenta con las áreas, no con su IAM. */
export function grupoDe(row: InscriptoAdmin): string {
  return row.rol === "area" ? AREAS_GRUPO : row.grupoNombre ?? SIN_IAM;
}

export function edadEnEvento(row: InscriptoAdmin, eventoFecha: string): number | null {
  return row.fechaNacimiento ? ageOn(row.fechaNacimiento, eventoFecha) : null;
}

/** Lee los filtros de la dirección, descartando lo que no sea un filtro conocido. */
export function parseFiltros(params: Record<string, string | string[] | undefined>): Filtros {
  const filtros: Filtros = {};
  for (const key of FILTROS) {
    const value = params[key];
    if (typeof value === "string" && value.trim()) filtros[key] = value.trim().slice(0, 120);
  }
  return filtros;
}

export function filtrar(rows: InscriptoAdmin[], filtros: Filtros): InscriptoAdmin[] {
  return rows.filter((row) => {
    if (filtros.rol && row.rol !== filtros.rol) return false;
    if (filtros.area && (row.area ?? SIN_DATO) !== filtros.area) return false;
    if (filtros.grupo && grupoDe(row) !== filtros.grupo) return false;
    if (filtros.ciudad && (row.ciudad ?? SIN_DATO) !== filtros.ciudad) return false;
    if (filtros.sexo && (row.sexo ?? SIN_DATO) !== filtros.sexo) return false;
    if (filtros.grado && (row.grado ?? SIN_DATO) !== filtros.grado) return false;
    if (filtros.firma && (filtros.firma === "si") !== Boolean(row.firmaEventoId)) return false;
    if (filtros.imagen === "si" && row.imagen !== true) return false;
    if (filtros.imagen === "no" && row.imagen !== false) return false;
    if (filtros.imagen === "falta" && row.imagen !== null) return false;
    if (filtros.dieta && !row.salud?.dieta?.tiene) return false;
    if (filtros.alergias && !row.salud?.alergias?.tiene) return false;
    if (filtros.medicacion && !row.salud?.medicacion?.tiene) return false;
    if (filtros.enfermedad && !row.salud?.enfermedad?.tiene) return false;
    if (filtros.comida && row.respuestas.lleva_comida !== "si") return false;
    // Respuesta a una pregunta del evento, como "idDeLaPregunta:valor" (valor vacío = sin responder).
    if (filtros.pregunta) {
      const corte = filtros.pregunta.indexOf(":");
      if (corte < 1 || (row.respuestas[filtros.pregunta.slice(0, corte)] ?? "") !== filtros.pregunta.slice(corte + 1)) return false;
    }
    return true;
  });
}

export type Conteo = Array<{ valor: string; total: number }>;

function contar(values: Array<string | null | undefined>): Conteo {
  const totals = new Map<string, number>();
  for (const value of values) {
    const key = value?.trim() || SIN_DATO;
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  return [...totals.entries()].map(([valor, total]) => ({ valor, total })).sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor, "es"));
}

export interface ResumenEvento {
  total: number;
  porRol: Conteo;
  /** Adultos de área, por cada una de las áreas. */
  porArea: Conteo;
  /** Solo menores. */
  porGrado: Conteo;
  porGrupo: Conteo;
  porCiudad: Conteo;
  porSexo: Conteo;
  dietas: number;
  /** Qué dietas hay, tal como las escribieron las familias. Sin nombres. */
  tiposDeDieta: Conteo;
  llevanComida: number;
  alergias: number;
  medicacion: number;
  enfermedad: number;
  sinFirmar: number;
  sinImagen: number;
  imagenSinResponder: number;
  dePrueba: number;
}

export function resumir(rows: InscriptoAdmin[], eventoFecha: string): ResumenEvento {
  const menores = rows.filter((row) => {
    const edad = edadEnEvento(row, eventoFecha);
    return edad !== null && edad < EDAD_ADULTO;
  });
  return {
    total: rows.length,
    porRol: contar(rows.map((row) => row.rol)),
    porArea: contar(rows.filter((row) => row.rol === "area").map((row) => row.area)),
    porGrado: contar(menores.map((row) => row.grado)),
    porGrupo: contar(rows.map(grupoDe)),
    porCiudad: contar(rows.map((row) => row.ciudad)),
    porSexo: contar(rows.map((row) => row.sexo)),
    dietas: rows.filter((row) => row.salud?.dieta?.tiene).length,
    tiposDeDieta: contar(rows.filter((row) => row.salud?.dieta?.tiene).map((row) => row.salud?.dieta?.detalle.toLowerCase())),
    llevanComida: rows.filter((row) => row.respuestas.lleva_comida === "si").length,
    alergias: rows.filter((row) => row.salud?.alergias?.tiene).length,
    medicacion: rows.filter((row) => row.salud?.medicacion?.tiene).length,
    enfermedad: rows.filter((row) => row.salud?.enfermedad?.tiene).length,
    sinFirmar: rows.filter((row) => !row.firmaEventoId).length,
    sinImagen: rows.filter((row) => row.imagen === false).length,
    imagenSinResponder: rows.filter((row) => row.imagen === null).length,
    dePrueba: rows.filter((row) => row.esPrueba).length,
  };
}

export const SIN_RESPONDER = "Sin responder";

type PreguntaCerrada = { id: string; texto: string; tipo: string; roles?: readonly string[] };

/** Respuesta legible de un inscripto a una pregunta cerrada del evento. */
export function respuestaDe(row: InscriptoAdmin, pregunta: PreguntaCerrada): string {
  const valor = row.respuestas[pregunta.id];
  if (!valor) return SIN_RESPONDER;
  return pregunta.tipo === "si_no" ? (valor === "si" ? "Sí" : "No") : valor;
}

/**
 * Cuántos respondieron cada opción de las preguntas cerradas del evento (opciones y sí/no).
 * Solo cuenta a quienes se les hizo la pregunta.
 */
export function respuestasPorPregunta<T extends PreguntaCerrada>(rows: InscriptoAdmin[], preguntas: T[]): Array<{ pregunta: T; total: number; conteo: Array<{ valor: string; etiqueta: string; total: number }> }> {
  return preguntas
    .filter((pregunta) => pregunta.tipo !== "texto")
    .map((pregunta) => {
      const aplican = rows.filter((row) => !pregunta.roles || pregunta.roles.length === 0 || pregunta.roles.includes(row.rol));
      const totales = new Map<string, { etiqueta: string; total: number }>();
      for (const row of aplican) {
        const valor = row.respuestas[pregunta.id] ?? "";
        const actual = totales.get(valor) ?? { etiqueta: respuestaDe(row, pregunta), total: 0 };
        actual.total += 1;
        totales.set(valor, actual);
      }
      return { pregunta, total: aplican.length, conteo: [...totales.entries()].map(([valor, item]) => ({ valor, ...item })).sort((a, b) => b.total - a.total) };
    });
}

export interface FilaLogistica {
  grupo: string;
  jardin: number;
  /** De 1° a 4° grado. */
  chicos: number;
  /** De 5° grado en adelante, y los adultos. */
  grandes: number;
  total: number;
}

/** Tabla para calcular la comida: una fila por IAM, con jardín, los de 1° a 4° grado y los más grandes por separado. */
export function tablaLogistica(rows: InscriptoAdmin[], eventoFecha: string): { filas: FilaLogistica[]; totales: FilaLogistica } {
  const filas = new Map<string, FilaLogistica>();
  const totales: FilaLogistica = { grupo: "Total", jardin: 0, chicos: 0, grandes: 0, total: 0 };
  for (const row of rows) {
    const edad = edadEnEvento(row, eventoFecha);
    // Los adultos van siempre con los más grandes, tengan o no un grado cargado.
    const columna: GrupoGrado = edad !== null && edad < EDAD_ADULTO ? grupoDeGrado(row.grado) : "grandes";
    const grupo = grupoDe(row);
    const fila = filas.get(grupo) ?? { grupo, jardin: 0, chicos: 0, grandes: 0, total: 0 };
    fila[columna] += 1;
    fila.total += 1;
    totales[columna] += 1;
    totales.total += 1;
    filas.set(grupo, fila);
  }
  return { filas: [...filas.values()].sort((a, b) => a.grupo.localeCompare(b.grupo, "es")), totales };
}

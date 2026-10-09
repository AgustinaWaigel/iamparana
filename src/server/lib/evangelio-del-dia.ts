import "server-only";

// El Evangelio de cada día, tomado del servicio para sitios web de Evangelizo (evangeliodeldia.org).
// Trae el pasaje entero: para el inicio se elige una frase corta y el resto se ofrece para leer completo.
// Si el servicio no responde, devuelve null y el inicio muestra una frase de la lista propia (hoy-datos.ts).

const FEED = "https://feed.evangelizo.org/v2/reader.php";
/** Largo máximo de la frase destacada. */
const MAX_FRASE = 210;

export interface EvangelioDelDia {
  /** Frase corta para destacar. */
  frase: string;
  /** Cita abreviada, por ejemplo "Lc 11, 15-26". */
  cita: string;
  /** El pasaje completo, un párrafo por elemento. */
  parrafos: string[];
  /** Día litúrgico, por ejemplo "Viernes de la 27a semana del Tiempo Ordinario". */
  dia: string | null;
}

function aTexto(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
    .replace(/&amp;/g, "&");
}

async function pedir(fecha: string, tipo: string, contenido?: string): Promise<string | null> {
  const url = `${FEED}?date=${fecha}&lang=SP&type=${tipo}${contenido ? `&content=${contenido}` : ""}`;
  // El texto de un día no cambia: se guarda medio día para no pedirlo en cada visita.
  const response = await fetch(url, { next: { revalidate: 43200 }, signal: AbortSignal.timeout(4000) });
  if (!response.ok) return null;
  const texto = aTexto(await response.text()).trim();
  // Los errores del servicio (por ejemplo, una fecha fuera de su rango) llegan como texto común.
  return /^Reader Evangelizo Error/i.test(texto) ? null : texto;
}

// "Jesús les dijo:", "Jesús, que conocía sus pensamientos, les respondió:"... El verbo tiene que estar
// pegado a Jesús: si no, se terminaría destacando lo que dice otra persona del pasaje.
const HABLA_JESUS = /(?:Dijo (?:Jes[uú]s|el Señor)|Jes[uú]s(?:,[^,.:]{0,70},)?(?:\s+[\wáéíóúñ]+){0,5}?\s+(?:dijo|dice|decía|respondió|replicó|contestó|exclamó|añadió|agregó|diciendo|proclamó))[^.:]{0,50}:\s*/i;

/** Elige una frase corta del pasaje: lo primero que dice Jesús, o si no el comienzo. */
export function elegirFrase(parrafos: string[]): string {
  const completo = parrafos.join(" ");
  const habla = completo.match(HABLA_JESUS);
  const desde = habla && habla.index !== undefined ? completo.slice(habla.index + habla[0].length) : completo;
  const oraciones = desde.replace(/^["'«“‘\s]+/, "").match(/[^.!?]+[.!?]+["'»”’]*/g) ?? [desde];

  let frase = "";
  for (const oracion of oraciones) {
    const limpia = oracion.trim();
    if (frase && frase.length + limpia.length + 1 > MAX_FRASE) break;
    frase = frase ? `${frase} ${limpia}` : limpia;
    if (frase.length >= 60) break;
  }
  // Las comillas del pasaje se sacan: el inicio le pone las suyas.
  frase = frase.replace(/["«»“”]/g, "").replace(/^['‘\s]+|['’\s]+$/g, "");
  return frase.length > MAX_FRASE ? `${frase.slice(0, frase.lastIndexOf(" ", MAX_FRASE)).replace(/[,;:]$/, "")}…` : frase;
}

/** Evangelio de la fecha "AAAA-MM-DD", o null si no se pudo traer. */
export async function evangelioDelDia(ymd: string): Promise<EvangelioDelDia | null> {
  const fecha = ymd.replace(/-/g, "");
  if (!/^\d{8}$/.test(fecha) || Date.now() < noReintentarHasta) return null;
  const resultado = await traer(fecha);
  // Si el servicio está caído, no se lo espera en cada visita: se vuelve a probar en diez minutos.
  if (!resultado) noReintentarHasta = Date.now() + 10 * 60_000;
  return resultado;
}

let noReintentarHasta = 0;

async function traer(fecha: string): Promise<EvangelioDelDia | null> {
  try {
    const [texto, cita, dia] = await Promise.all([
      pedir(fecha, "reading", "GSP"),
      pedir(fecha, "reading_st", "GSP"),
      pedir(fecha, "liturgic_t").catch(() => null),
    ]);
    if (!texto || !cita) return null;

    const parrafos = texto
      .split("\n")
      .map((linea) => linea.trim())
      // El servicio agrega al final su propio crédito: se muestra aparte, con enlace.
      .filter((linea) => linea && !/^Extra[ií]do de la Biblia|^Para recibir cada ma[ñn]ana/i.test(linea));
    if (parrafos.length === 0) return null;

    const frase = elegirFrase(parrafos);
    if (frase.length < 15) return null;
    // "Lc 11,15-26." → "Lc 11, 15-26"
    return { frase, cita: cita.replace(/\.$/, "").replace(/,(\S)/g, ", $1"), parrafos, dia: dia || null };
  } catch {
    return null;
  }
}

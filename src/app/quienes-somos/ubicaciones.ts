// Ubicación aproximada de cada IAM para el mapa de "Quiénes somos".
// Las coordenadas se buscaron una sola vez en OpenStreetMap por el nombre de la parroquia y la ciudad;
// las que no se encontraron se ubican en el centro de su ciudad. Para corregir un punto, cambiá acá
// su [latitud, longitud] (se pueden copiar de Google Maps con clic derecho sobre el lugar).

type Punto = [number, number];

/** Centro de cada ciudad. */
export const CIUDADES: Record<string, Punto> = {
  "Colonia Avellaneda": [-31.76369, -60.41212],
  "Crespo": [-32.03078, -60.30625],
  "Diamante": [-32.06704, -60.64265],
  "Feliciano": [-30.3847, -58.7517],
  "La Paz": [-30.74229, -59.64393],
  "Las Cuevas": [-32.3342, -60.48557],
  "Oro Verde": [-31.82368, -60.5159],
  "Paraná": [-31.73301, -60.52985],
  "San Benito": [-31.7815, -60.43755],
  "Valle María": [-31.9905, -60.58822],
  "Villaguay": [-31.86763, -59.02702],
};

/** Punto propio de cada IAM, con la clave "nombre|ciudad". */
export const IAM_UBICACIONES: Record<string, Punto> = {
  "Inmaculada Concepción|Villaguay": [-31.85958, -59.03482],
  "Nuestra Señora de La Paz|La Paz": [-30.74118, -59.64448],
  "Nuestra Señora de Luján|Paraná": [-31.75345, -60.51105],
  "Nuestra Señora de la Esperanza|Paraná": [-31.73395, -60.49703],
  "Nuestra Señora del Rosario|Crespo": [-32.03589, -60.31232],
  "San Benito Abad|San Benito": [-31.78371, -60.4415],
  "San Cipriano|Diamante": [-32.06779, -60.64262],
  "San Francisco Javier|Paraná": [-31.76381, -60.51214],
  "San Francisco de Borja|Paraná": [-31.7608, -60.49019],
  "San José Obrero|Paraná": [-31.76541, -60.49958],
  "San José de Crespo|Crespo": [-32.02379, -60.30399],
  "Santa Rosa|Villaguay": [-31.84647, -59.01392],
  "Santa Teresa de los Andes|Colonia Avellaneda": [-31.76174, -60.41488],
  "Santo Espíritu|Valle María": [-31.98827, -60.58047],
};

/**
 * Dónde va el punto de una IAM: su ubicación propia si se conoce; si no, el centro de su ciudad,
 * corrido un poco según su lugar en la lista para que varias IAM de la misma ciudad no queden encimadas.
 */
export function ubicacionDe(nombre: string, ciudad: string | null, lugarEnCiudad: number): { punto: Punto; exacta: boolean } | null {
  const clave = `${nombre}|${ciudad ?? ''}`;
  if (IAM_UBICACIONES[clave]) return { punto: IAM_UBICACIONES[clave], exacta: true };
  const centro = ciudad ? CIUDADES[ciudad] : undefined;
  if (!centro) return null;
  const angulo = lugarEnCiudad * 2.4;
  const radio = lugarEnCiudad === 0 ? 0 : 0.006 + lugarEnCiudad * 0.0015;
  return { punto: [centro[0] + Math.sin(angulo) * radio, centro[1] + Math.cos(angulo) * radio], exacta: false };
}

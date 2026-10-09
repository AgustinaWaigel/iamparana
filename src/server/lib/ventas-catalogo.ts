import "server-only";

// Merch de la IAM: lo que Comunicación vende en los eventos. Los productos y los precios viven en
// la base de datos del sistema de ventas (otra aplicación): acá solo se leen, nunca se copian ni se modifican.
//
// Ese sistema también devuelve el costo y el stock exacto de cada producto: esos datos son
// internos y no salen de este archivo. Al navegador solo llega lo que define ProductoCatalogo.

const VENTAS_URL = (process.env.VENTAS_API_URL || "https://ventascomunicacion.onrender.com").replace(/\/+$/, "");

export interface ProductoCatalogo {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen: string | null;
}

/** Categorías con las que se muestra el catálogo; en el sistema de ventas están escritas de varias formas. */
const CATEGORIAS: Array<{ nombre: string; coincide: RegExp }> = [
  { nombre: "Llaveros", coincide: /llavero/ },
  { nombre: "Stickers", coincide: /sticker/ },
  { nombre: "Mates", coincide: /\bmate\b|bombilla/ },
  { nombre: "Librería", coincide: /libreria|papeleria|cuaderno|birome|lapicera/ },
  { nombre: "Insignias", coincide: /insignia|escudo|carnet|panoleta/ },
  { nombre: "Decoración", coincide: /decoracion|\b3d\b|vela/ },
  { nombre: "Accesorios", coincide: /accesorio|pulsera|collar|rosario|\bpin|colgante/ },
];

function sinTildes(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

function categoriaDe(categoria: string, nombre: string): string {
  // Primero se mira el nombre del producto (es lo más confiable) y después la categoría cargada.
  const porNombre = CATEGORIAS.find((item) => item.coincide.test(sinTildes(nombre)));
  if (porNombre) return porNombre.nombre;
  return CATEGORIAS.find((item) => item.coincide.test(sinTildes(categoria)))?.nombre ?? "Otros";
}

/** Saca el precio escrito dentro del nombre ("LLAVERO $1500") y las mayúsculas sostenidas. */
function nombreProlijo(nombre: string): string {
  let limpio = nombre.replace(/\s*\$\s?\d[\d.]*/g, "").replace(/\s+/g, " ").trim();
  if (limpio === limpio.toUpperCase() || limpio === limpio.toLowerCase()) {
    limpio = limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
  }
  return limpio || nombre.trim();
}

type Fila = Record<string, unknown>;

/**
 * Lee de la base de datos de ventas (Supabase) la vista `catalogo.productos`, que expone solo
 * lo que se puede mostrar. Está en un esquema aparte para no abrir el resto de las tablas.
 * Devuelve null si la base no está configurada o la vista todavía no existe.
 */
async function leerDeLaBase(): Promise<Fila[] | null> {
  const url = (process.env.VENTAS_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.VENTAS_SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";
  if (!url || !key) return null;
  const response = await fetch(`${url}/rest/v1/productos?select=id,nombre,categoria,precio,imagen`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Accept-Profile": "catalogo" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data: unknown = await response.json();
  // La vista ya filtra lo que tiene stock: acá no llega ni el stock ni el costo.
  return Array.isArray(data) ? (data as Fila[]).map((fila) => ({ ...fila, stock: 1 })) : null;
}

/** Respaldo: el sistema de ventas, mientras la base no esté habilitada para leerse desde acá. */
async function leerDelSistema(): Promise<Fila[] | null> {
  const response = await fetch(`${VENTAS_URL}/api/productos`, {
    // Se vuelve a consultar cada 5 minutos; si una consulta falla, se sigue mostrando la última que anduvo.
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data: unknown = await response.json();
  return Array.isArray(data) ? (data as Fila[]) : null;
}

/**
 * Productos a la venta (con stock), ordenados por categoría y nombre.
 * Devuelve null si no se pudo leer de ningún lado: la página sigue funcionando sin el catálogo.
 */
export async function listCatalogo(): Promise<ProductoCatalogo[] | null> {
  try {
    const data = (await leerDeLaBase().catch(() => null)) ?? (await leerDelSistema());
    if (!data) return null;

    const productos: ProductoCatalogo[] = [];
    const vistos = new Set<string>();
    for (const item of data) {
      const nombreOriginal = typeof item.nombre === "string" ? item.nombre : "";
      const precio = Number(item.precio);
      if (!nombreOriginal.trim() || !Number.isFinite(precio) || precio <= 0 || Number(item.stock) <= 0) continue;
      const nombre = nombreProlijo(nombreOriginal);
      // El mismo producto cargado dos veces con el mismo precio se muestra una sola vez.
      const clave = `${sinTildes(nombre)}|${precio}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      productos.push({
        id: Number(item.id),
        nombre,
        categoria: categoriaDe(typeof item.categoria === "string" ? item.categoria : "", nombreOriginal),
        precio,
        imagen: typeof item.imagen === "string" && /^[\w.\-() ]+$/.test(item.imagen) ? `${VENTAS_URL}/uploads/${encodeURIComponent(item.imagen)}` : null,
      });
    }
    return productos.sort((a, b) => a.categoria.localeCompare(b.categoria, "es") || a.nombre.localeCompare(b.nombre, "es"));
  } catch (error) {
    console.error("No se pudo leer el catálogo de ventas:", error instanceof Error ? error.message : error);
    return null;
  }
}

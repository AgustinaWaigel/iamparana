import { z } from "zod";

// Validación de la ficha de una IAM que carga el admin.

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);

/**
 * Acepta el usuario ("@iamparana") o el enlace completo y devuelve siempre el enlace.
 * Devuelve null si está vacío y undefined si no es de esa red.
 */
export function normalizarRed(valor: string, dominio: "instagram.com" | "facebook.com"): string | null | undefined {
  const limpio = valor.trim();
  if (!limpio) return null;
  if (/^https?:\/\//i.test(limpio) || limpio.toLowerCase().includes(dominio)) {
    try {
      const url = new URL(/^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`);
      const host = url.hostname.toLowerCase().replace(/^(www|m|web)\./, "");
      if (host !== dominio || url.pathname === "/") return undefined;
      return `https://www.${dominio}${url.pathname}${dominio === "facebook.com" ? url.search : ""}`;
    } catch {
      return undefined;
    }
  }
  const usuario = limpio.replace(/^@/, "");
  return /^[A-Za-z0-9._-]{1,80}$/.test(usuario) ? `https://www.${dominio}/${usuario}` : undefined;
}

const red = (dominio: "instagram.com" | "facebook.com", nombre: string) =>
  z.string().max(300).optional().transform((value, ctx) => {
    const enlace = normalizarRed(value ?? "", dominio);
    if (enlace === undefined) {
      ctx.addIssue({ code: "custom", message: `El ${nombre} no parece válido: poné el usuario o el enlace de la página.` });
      return z.NEVER;
    }
    return enlace;
  });

export const iamSchema = z
  .object({
    id: z.string().trim().max(64).optional(),
    nombre: z.string().trim().min(1, "Falta el nombre de la IAM.").max(120),
    ciudad: optionalText(80),
    activo: z.boolean().optional().default(true),
    /** Color de la IAM, como #rrggbb; vacío = sin color. */
    color: z.union([z.string().trim().regex(/^#[0-9a-fA-F]{6}$/), z.literal("")]).optional().transform((value) => value || null),
    direccion: optionalText(160),
    telefono: z.union([z.string().trim().regex(/^[0-9+()\s-]{6,25}$/, "El teléfono no parece válido."), z.literal("")]).optional().transform((value) => value || null),
    instagram: red("instagram.com", "Instagram"),
    facebook: red("facebook.com", "Facebook"),
    lat: z.number().min(-90).max(90).nullable().optional().transform((value) => value ?? null),
    lng: z.number().min(-180).max(180).nullable().optional().transform((value) => value ?? null),
  })
  .refine((value) => (value.lat === null) === (value.lng === null), { message: "El punto del mapa está incompleto." });

export type IamInput = z.infer<typeof iamSchema>;

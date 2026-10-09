// Enlaces para el teléfono de contacto de una IAM.

export function telHref(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}

/**
 * Enlace de WhatsApp, solo cuando el número se puede armar sin adivinar: con código de país (54...)
 * o con código de área y sin 0 ni 15 (10 dígitos). Si no, devuelve null y se ofrece solo llamar.
 */
export function whatsappHref(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("54") && digitos.length >= 12) return `https://wa.me/${digitos}`;
  const local = digitos.replace(/^0/, "");
  return local.length === 10 ? `https://wa.me/549${local}` : null;
}

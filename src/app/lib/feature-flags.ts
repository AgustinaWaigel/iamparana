// Turso es la fuente principal en producción. Solo se desactiva de forma
// explícita; si la variable falta en Netlify no debemos volver al contenido
// estático antiguo después de guardar cambios desde el administrador.
export const isTursoReadEnabled = process.env.USE_TURSO_READ !== "false";
export const isTursoWriteEnabled = process.env.USE_TURSO_WRITE === "true";

import "server-only";

import { getTursoClient } from "@/db/turso";

export type NoticiaInput = {
  slug: string;
  title: string;
  date: string;
  cat?: string;
  bajada?: string;
  description: string;
  image: string;
  content: string;
};

export type CancionInput = {
  slug: string;
  title: string;
  artist: string;
  content: string;
};

export type AgendaInput = {
  evento: string;
  fecha: string;
  fecha_fin?: string | null;
};

export type CarouselInput = {
  slug?: string | null;
  imageDesktop: string;
  imageMobile: string;
  alt: string;
  link?: string | null;
  buttonText?: string | null;
  order?: number;
};

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Turso no configurado");
  }
  return client;
}

export async function listNoticiasAdmin() {
  const client = clientOrThrow();
  const result = await client.execute(
    "SELECT slug, title, date, cat, description, image, updated_at FROM noticias ORDER BY date DESC"
  );
  return result.rows;
}

export async function getNoticiaAdmin(slug: string) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT slug, title, date, cat, bajada, description, image, content FROM noticias WHERE slug = ? LIMIT 1",
    args: [slug],
  });
  return result.rows[0] ?? null;
}

export async function createNoticiaAdmin(data: NoticiaInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO noticias (slug, title, date, cat, bajada, description, image, content, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
    args: [data.slug, data.title, data.date, data.cat ?? "NACIONAL", data.bajada ?? null, data.description, data.image, data.content],
  });
}

export async function updateNoticiaAdmin(slug: string, data: Omit<NoticiaInput, "slug">) {
  const client = clientOrThrow();
  await client.execute({
    sql: "UPDATE noticias SET title = ?, date = ?, cat = ?, bajada = ?, description = ?, image = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?",
    args: [data.title, data.date, data.cat ?? "NACIONAL", data.bajada ?? null, data.description, data.image, data.content, slug],
  });
}

export async function deleteNoticiaAdmin(slug: string) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM noticias WHERE slug = ?",
    args: [slug],
  });
}

export async function listCancionesAdmin() {
  const client = clientOrThrow();
  const result = await client.execute(
    "SELECT slug, title, artist, updated_at FROM canciones ORDER BY title ASC"
  );
  return result.rows;
}

export async function getCancionAdmin(slug: string) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT slug, title, artist, content FROM canciones WHERE slug = ? LIMIT 1",
    args: [slug],
  });
  return result.rows[0] ?? null;
}

export async function createCancionAdmin(data: CancionInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO canciones (slug, title, artist, content, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
    args: [data.slug, data.title, data.artist, data.content],
  });
}

export async function updateCancionAdmin(slug: string, data: Omit<CancionInput, "slug">) {
  const client = clientOrThrow();
  await client.execute({
    sql: "UPDATE canciones SET title = ?, artist = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?",
    args: [data.title, data.artist, data.content, slug],
  });
}

export async function deleteCancionAdmin(slug: string) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM canciones WHERE slug = ?",
    args: [slug],
  });
}

export async function listAgendaAdmin() {
  const client = clientOrThrow();
  const result = await client.execute(
    "SELECT id, evento, fecha, fecha_fin FROM agenda ORDER BY fecha ASC"
  );
  return result.rows;
}

export async function getAgendaAdmin(id: number) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, evento, fecha, fecha_fin FROM agenda WHERE id = ? LIMIT 1",
    args: [id],
  });
  return result.rows[0] ?? null;
}

export async function createAgendaAdmin(data: AgendaInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO agenda (evento, fecha, fecha_fin) VALUES (?, ?, ?)",
    args: [data.evento, data.fecha, data.fecha_fin ?? null],
  });
}

export async function updateAgendaAdmin(id: number, data: AgendaInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "UPDATE agenda SET evento = ?, fecha = ?, fecha_fin = ? WHERE id = ?",
    args: [data.evento, data.fecha, data.fecha_fin ?? null, id],
  });
}

export async function deleteAgendaAdmin(id: number) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM agenda WHERE id = ?",
    args: [id],
  });
}

export async function listCarouselAdmin() {
  const client = clientOrThrow();
  const result = await client.execute(
    "SELECT id, slug, imageDesktop, imageMobile, alt, link, buttonText, \"order\" FROM carousel ORDER BY \"order\" ASC"
  );
  return result.rows;
}

export async function getCarouselAdmin(id: number) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, slug, imageDesktop, imageMobile, alt, link, buttonText, \"order\" FROM carousel WHERE id = ? LIMIT 1",
    args: [id],
  });
  return result.rows[0] ?? null;
}

export async function createCarouselAdmin(data: CarouselInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO carousel (slug, imageDesktop, imageMobile, alt, link, buttonText, \"order\") VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [data.slug ?? null, data.imageDesktop, data.imageMobile, data.alt, data.link ?? null, data.buttonText ?? null, data.order ?? 0],
  });
}

export async function updateCarouselAdmin(id: number, data: CarouselInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "UPDATE carousel SET slug = ?, imageDesktop = ?, imageMobile = ?, alt = ?, link = ?, buttonText = ?, \"order\" = ? WHERE id = ?",
    args: [data.slug ?? null, data.imageDesktop, data.imageMobile, data.alt, data.link ?? null, data.buttonText ?? null, data.order ?? 0, id],
  });
}

export async function deleteCarouselAdmin(id: number) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM carousel WHERE id = ?",
    args: [id],
  });
}

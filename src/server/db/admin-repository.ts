import "server-only";

import { getTursoClient } from "@/server/db/turso";

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

export type NoticiaGaleriaInput = {
  noticia_slug: string;
  image_url: string;
  alt_text?: string;
  caption?: string;
  order?: number;
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

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

async function getUniqueNoticiaSlug(baseSlug: string) {
  const client = clientOrThrow();
  const normalizedSlug = normalizeSlug(baseSlug) || "noticia";

  const result = await client.execute({
    sql: "SELECT slug FROM noticias WHERE slug = ? OR slug LIKE ?",
    args: [normalizedSlug, `${normalizedSlug}-%`],
  });

  const existingSlugs = new Set(result.rows.map((row) => String(row.slug)));

  if (!existingSlugs.has(normalizedSlug)) {
    return normalizedSlug;
  }

  let suffix = 2;
  let candidate = `${normalizedSlug}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedSlug}-${suffix}`;
  }

  return candidate;
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
  const slug = await getUniqueNoticiaSlug(data.slug);
  await client.execute({
    sql: "INSERT INTO noticias (slug, title, date, cat, bajada, description, image, content, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
    args: [slug, data.title, data.date, data.cat ?? "NACIONAL", data.bajada ?? null, data.description, data.image, data.content],
  });

  return slug;
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

// GALERÍA DE NOTICIAS

export async function getNoticiaGaleria(noticia_slug: string) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, noticia_slug, image_url, alt_text, caption, \"order\" FROM noticias_galeria WHERE noticia_slug = ? ORDER BY \"order\" ASC",
    args: [noticia_slug],
  });
  return result.rows;
}

export async function addNoticiaGaleriaImage(data: NoticiaGaleriaInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO noticias_galeria (noticia_slug, image_url, alt_text, caption, \"order\") VALUES (?, ?, ?, ?, ?)",
    args: [data.noticia_slug, data.image_url, data.alt_text ?? null, data.caption ?? null, data.order ?? 999],
  });
}

export async function deleteNoticiaGaleriaImage(id: number) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM noticias_galeria WHERE id = ?",
    args: [id],
  });
}

export async function deleteNoticiaGaleriaBySlug(slug: string) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM noticias_galeria WHERE noticia_slug = ?",
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

// DOCUMENTOS

export type DocumentInput = {
  section: string;
  title: string;
  description?: string;
  googleDriveId: string;
  googleDriveUrl?: string;
  fileSize?: number;
  fileType?: string;
  uploadedByUserId: number;
};

export async function saveDocument(data: DocumentInput) {
  const client = clientOrThrow();
  await client.execute({
    sql: "INSERT INTO documents (section, title, description, google_drive_id, google_drive_url, file_size, file_type, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      data.section,
      data.title,
      data.description ?? null,
      data.googleDriveId,
      data.googleDriveUrl ?? null,
      data.fileSize ?? null,
      data.fileType ?? null,
      data.uploadedByUserId,
    ],
  });
}

export async function getDocumentsBySection(section: string) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, section, title, description, google_drive_id, google_drive_url, file_size, file_type, uploaded_by_user_id, created_at FROM documents WHERE section = ? ORDER BY created_at DESC",
    args: [section],
  });
  return result.rows;
}

export async function getDocumentsBySections(sections: string[]) {
  const client = clientOrThrow();
  const normalized = sections.map((item) => item.trim()).filter(Boolean);

  if (normalized.length === 0) {
    return [];
  }

  const placeholders = normalized.map(() => "?").join(", ");
  const result = await client.execute({
    sql: `SELECT id, section, title, description, google_drive_id, google_drive_url, file_size, file_type, uploaded_by_user_id, created_at
          FROM documents
          WHERE section IN (${placeholders})
          ORDER BY created_at DESC`,
    args: normalized,
  });

  return result.rows;
}

export async function getDocument(id: number) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, section, title, description, google_drive_id, google_drive_url, file_size, file_type, uploaded_by_user_id, created_at FROM documents WHERE id = ? LIMIT 1",
    args: [id],
  });
  return result.rows[0] ?? null;
}

export async function updateDocument(id: number, data: Partial<DocumentInput>) {
  const client = clientOrThrow();
  
  // Construir dinámicamente el SET clause
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (data.title !== undefined) {
    setClauses.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    setClauses.push("description = ?");
    values.push(data.description);
  }
  if (data.googleDriveUrl !== undefined) {
    setClauses.push("google_drive_url = ?");
    values.push(data.googleDriveUrl);
  }
  
  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  await client.execute({
    sql: `UPDATE documents SET ${setClauses.join(", ")} WHERE id = ?`,
    args: values,
  });
}

export async function deleteDocument(id: number) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM documents WHERE id = ?",
    args: [id],
  });
}

// GOOGLE DRIVE CONFIG

export async function getGoogleDriveConfig(section: string) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, section, folder_id, folder_name FROM google_drive_config WHERE section = ? LIMIT 1",
    args: [section],
  });
  return result.rows[0] ?? null;
}

export async function updateGoogleDriveConfig(section: string, folderId: string, folderName?: string) {
  const client = clientOrThrow();
  await client.execute({
    sql: "UPDATE google_drive_config SET folder_id = ?, folder_name = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ?",
    args: [folderId, folderName ?? section, section],
  });
}

// LINKS

interface LinkInput {
  section: string;
  title: string;
  description?: string;
  url: string;
  icon?: string;
  created_by_user_id: number;
}

export async function saveLink(link: LinkInput) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: `INSERT INTO links (section, title, description, url, icon, created_by_user_id)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [link.section, link.title, link.description || null, link.url, link.icon || null, link.created_by_user_id],
  });
  return result.lastInsertRowid;
}

export async function getLinksBySection(section: string) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, section, title, description, url, icon, created_by_user_id, created_at FROM links WHERE section = ? ORDER BY created_at DESC",
    args: [section],
  });
  return result.rows;
}

export async function getLinksBySections(sections: string[]) {
  const client = clientOrThrow();
  const normalized = sections.map((item) => item.trim()).filter(Boolean);

  if (normalized.length === 0) {
    return [];
  }

  const placeholders = normalized.map(() => "?").join(", ");
  const result = await client.execute({
    sql: `SELECT id, section, title, description, url, icon, created_by_user_id, created_at
          FROM links
          WHERE section IN (${placeholders})
          ORDER BY created_at DESC`,
    args: normalized,
  });

  return result.rows;
}

export async function getLink(id: number) {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, section, title, description, url, icon, created_by_user_id, created_at FROM links WHERE id = ? LIMIT 1",
    args: [id],
  });
  return result.rows[0] ?? null;
}

export async function updateLink(id: number, link: Partial<LinkInput>) {
  const client = clientOrThrow();
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (link.title !== undefined) {
    setClauses.push('title = ?');
    values.push(link.title);
  }
  if (link.description !== undefined) {
    setClauses.push('description = ?');
    values.push(link.description);
  }
  if (link.url !== undefined) {
    setClauses.push('url = ?');
    values.push(link.url);
  }
  if (link.icon !== undefined) {
    setClauses.push('icon = ?');
    values.push(link.icon);
  }
  
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  if (setClauses.length === 1) return; // No actualizar si no hay cambios
  
  await client.execute({
    sql: `UPDATE links SET ${setClauses.join(", ")} WHERE id = ?`,
    args: values,
  });
}

export async function deleteLink(id: number) {
  const client = clientOrThrow();
  await client.execute({
    sql: "DELETE FROM links WHERE id = ?",
    args: [id],
  });
}

import "server-only";

import { ensureSchemaInitialized, getTursoClient } from "@/server/db/turso";

export interface ResourcePage {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  texture_url: string | null;
  template: string;
  created_by_user_id: number;
  created_at: string;
}

export interface ResourceSection {
  id: number;
  page_id: number;
  slug: string;
  title: string;
  section_key: string;
  position: number;
}

export interface SectionDocument {
  id: number;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface SectionLink {
  id: number;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  created_at: string;
}

export interface ResourceSectionWithContent extends ResourceSection {
  documents: SectionDocument[];
  links: SectionLink[];
}

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Base de datos no configurada");
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

async function getUniquePageSlug(baseValue: string) {
  const client = clientOrThrow();
  const baseSlug = normalizeSlug(baseValue) || "pagina";

  const result = await client.execute({
    sql: "SELECT slug FROM resource_pages WHERE slug = ? OR slug LIKE ?",
    args: [baseSlug, `${baseSlug}-%`],
  });

  const existing = new Set(result.rows.map((row) => String(row.slug)));
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

async function getUniqueSectionSlug(pageId: number, baseValue: string) {
  const client = clientOrThrow();
  const baseSlug = normalizeSlug(baseValue) || "seccion";

  const result = await client.execute({
    sql: "SELECT slug FROM resource_sections WHERE page_id = ? AND (slug = ? OR slug LIKE ?)",
    args: [pageId, baseSlug, `${baseSlug}-%`],
  });

  const existing = new Set(result.rows.map((row) => String(row.slug)));
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

export async function listResourcePages(): Promise<ResourcePage[]> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const result = await client.execute(`
    SELECT p.id, p.slug, p.title, p.description, p.texture_url, p.created_by_user_id, p.created_at,
           COALESCE(s.template, 'gold') as template
    FROM resource_pages p
    LEFT JOIN resource_page_styles s ON s.page_id = p.id
    ORDER BY p.created_at DESC
  `);
  return result.rows as unknown as ResourcePage[];
}

export async function createResourcePage(input: {
  slug: string;
  title: string;
  description?: string;
  textureUrl?: string;
  template?: string;
  createdByUserId: number;
}): Promise<number> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const slug = await getUniquePageSlug(input.slug || input.title);
  const result = await client.execute({
    sql: "INSERT INTO resource_pages (slug, title, description, texture_url, created_by_user_id) VALUES (?, ?, ?, ?, ?)",
    args: [
      slug,
      input.title,
      input.description ?? null,
      input.textureUrl ?? null,
      input.createdByUserId,
    ],
  });

  const pageId = Number(result.lastInsertRowid);
  await client.execute({
    sql: "INSERT OR REPLACE INTO resource_page_styles (page_id, template, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    args: [pageId, input.template || 'gold'],
  });

  return pageId;
}

export async function getResourcePageBySlug(slug: string): Promise<ResourcePage | null> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const result = await client.execute({
    sql: `SELECT p.id, p.slug, p.title, p.description, p.texture_url, p.created_by_user_id, p.created_at,
                 COALESCE(s.template, 'gold') as template
          FROM resource_pages p
          LEFT JOIN resource_page_styles s ON s.page_id = p.id
          WHERE p.slug = ?
          LIMIT 1`,
    args: [slug],
  });

  return (result.rows[0] as unknown as ResourcePage) ?? null;
}

export async function getResourcePageById(id: number): Promise<ResourcePage | null> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const result = await client.execute({
    sql: `SELECT p.id, p.slug, p.title, p.description, p.texture_url, p.created_by_user_id, p.created_at,
                 COALESCE(s.template, 'gold') as template
          FROM resource_pages p
          LEFT JOIN resource_page_styles s ON s.page_id = p.id
          WHERE p.id = ?
          LIMIT 1`,
    args: [id],
  });

  return (result.rows[0] as unknown as ResourcePage) ?? null;
}

export async function listResourceSections(pageId: number): Promise<ResourceSection[]> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, page_id, slug, title, section_key, position FROM resource_sections WHERE page_id = ? ORDER BY position ASC, created_at ASC",
    args: [pageId],
  });

  return result.rows as unknown as ResourceSection[];
}

export async function createResourceSection(input: {
  pageId: number;
  pageSlug: string;
  slug: string;
  title: string;
}): Promise<number> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();

  const positionResult = await client.execute({
    sql: "SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM resource_sections WHERE page_id = ?",
    args: [input.pageId],
  });

  const nextPosition = Number(positionResult.rows[0]?.next_position ?? 0);
  const slug = await getUniqueSectionSlug(input.pageId, input.slug || input.title);
  const sectionKey = `rp:${input.pageSlug}:${slug}`;

  const result = await client.execute({
    sql: "INSERT INTO resource_sections (page_id, slug, title, section_key, position) VALUES (?, ?, ?, ?, ?)",
    args: [input.pageId, slug, input.title, sectionKey, nextPosition],
  });

  return Number(result.lastInsertRowid);
}

export async function getResourceSectionById(id: number): Promise<ResourceSection | null> {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const result = await client.execute({
    sql: "SELECT id, page_id, slug, title, section_key, position FROM resource_sections WHERE id = ? LIMIT 1",
    args: [id],
  });

  return (result.rows[0] as unknown as ResourceSection) ?? null;
}

export async function updateResourcePage(
  id: number,
  data: { title?: string; description?: string; textureUrl?: string; template?: string }
) {
  await ensureSchemaInitialized();
  const client = clientOrThrow();

  await client.execute({
    sql: `UPDATE resource_pages
          SET title = COALESCE(?, title),
              description = ?,
              texture_url = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [data.title ?? null, data.description ?? null, data.textureUrl ?? null, id],
  });

  if (data.template) {
    await client.execute({
      sql: "INSERT OR REPLACE INTO resource_page_styles (page_id, template, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      args: [id, data.template],
    });
  }
}

export async function deleteResourcePage(id: number) {
  await ensureSchemaInitialized();
  const client = clientOrThrow();

  const sections = await listResourceSections(id);
  for (const section of sections) {
    await client.execute({ sql: "DELETE FROM documents WHERE section = ?", args: [section.section_key] });
    await client.execute({ sql: "DELETE FROM links WHERE section = ?", args: [section.section_key] });
  }

  await client.execute({ sql: "DELETE FROM resource_page_styles WHERE page_id = ?", args: [id] });
  await client.execute({ sql: "DELETE FROM resource_sections WHERE page_id = ?", args: [id] });
  await client.execute({ sql: "DELETE FROM resource_pages WHERE id = ?", args: [id] });
}

export async function updateResourceSection(id: number, data: { title?: string }) {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  await client.execute({
    sql: `UPDATE resource_sections
          SET title = COALESCE(?, title),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [data.title ?? null, id],
  });
}

export async function deleteResourceSection(id: number) {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const section = await getResourceSectionById(id);
  if (!section) return;

  await client.execute({ sql: "DELETE FROM documents WHERE section = ?", args: [section.section_key] });
  await client.execute({ sql: "DELETE FROM links WHERE section = ?", args: [section.section_key] });
  await client.execute({ sql: "DELETE FROM resource_sections WHERE id = ?", args: [id] });
}

export async function moveResourceSection(id: number, direction: "up" | "down") {
  await ensureSchemaInitialized();
  const client = clientOrThrow();
  const current = await getResourceSectionById(id);
  if (!current) return;

  const comparator = direction === "up" ? "<" : ">";
  const sort = direction === "up" ? "DESC" : "ASC";
  const neighborResult = await client.execute({
    sql: `SELECT id, position FROM resource_sections
          WHERE page_id = ? AND position ${comparator} ?
          ORDER BY position ${sort}
          LIMIT 1`,
    args: [current.page_id, current.position],
  });

  const neighbor = neighborResult.rows[0] as { id?: number; position?: number } | undefined;
  if (!neighbor?.id || neighbor.position === undefined) return;

  await client.execute({
    sql: "UPDATE resource_sections SET position = ? WHERE id = ?",
    args: [neighbor.position, current.id],
  });
  await client.execute({
    sql: "UPDATE resource_sections SET position = ? WHERE id = ?",
    args: [current.position, Number(neighbor.id)],
  });
}

async function getDocumentsBySectionKey(sectionKey: string): Promise<SectionDocument[]> {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: `SELECT id, title, description, google_drive_url, file_type, file_size, created_at
          FROM documents
          WHERE section = ?
          ORDER BY created_at DESC`,
    args: [sectionKey],
  });

  return result.rows as unknown as SectionDocument[];
}

async function getLinksBySectionKey(sectionKey: string): Promise<SectionLink[]> {
  const client = clientOrThrow();
  const result = await client.execute({
    sql: `SELECT id, title, description, url, icon, created_at
          FROM links
          WHERE section = ?
          ORDER BY created_at DESC`,
    args: [sectionKey],
  });

  return result.rows as unknown as SectionLink[];
}

export async function getResourcePageWithContent(slug: string): Promise<{
  page: ResourcePage;
  sections: ResourceSectionWithContent[];
} | null> {
  const page = await getResourcePageBySlug(slug);
  if (!page) return null;

  const sections = await listResourceSections(page.id);
  const sectionsWithContent: ResourceSectionWithContent[] = [];

  for (const section of sections) {
    const [documents, links] = await Promise.all([
      getDocumentsBySectionKey(section.section_key),
      getLinksBySectionKey(section.section_key),
    ]);

    sectionsWithContent.push({
      ...section,
      documents,
      links,
    });
  }

  return {
    page,
    sections: sectionsWithContent,
  };
}

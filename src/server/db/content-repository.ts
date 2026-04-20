import "server-only";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getTursoClient } from "@/server/db/turso";
import { isTursoReadEnabled } from "@/app/lib/feature-flags";

export interface NoticiaPreview {
  slug: string;
  title: string;
  date: string;
  description: string;
  image: string;
}

export interface NoticiaDetail {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    cat?: string;
    bajada?: string;
    description: string;
    image: string;
  };
  content: string;
}

export interface CancionBasic {
  title: string;
  artist: string;
  slug: string;
}

export interface CancionDetail {
  title: string;
  artist: string;
  content: string;
}

export interface AgendaEvento {
  id?: number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  todo_el_dia?: boolean;
}

export interface CarouselItem {
  imageDesktop: string;
  imageMobile: string;
  alt: string;
  link?: string;
  buttonText?: string;
  order?: number;
}

const contentRoot = path.join(process.cwd(), "contents");
const noticiasDir = path.join(contentRoot, "noticias");
const cancionesDir = path.join(contentRoot, "canciones");
const agendaDir = path.join(contentRoot, "agenda");
const carouselDir = path.join(contentRoot, "carousel");

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function readNoticiasFromFs(): NoticiaPreview[] {
  try {
    if (!fs.existsSync(noticiasDir)) {
      return [];
    }
    const filenames = fs.readdirSync(noticiasDir);
    const noticias = filenames.map((filename) => {
      const filePath = path.join(noticiasDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContent);
      return {
        slug: filename.replace(/\.md$/, ""),
        title: asString(data.title),
        date: asString(data.date),
        description: asString(data.description),
        image: asString(data.image),
      };
    });

    return noticias.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error reading noticias from filesystem:", error);
    return [];
  }
}

function readNoticiaDetailFromFs(slug: string): NoticiaDetail | null {
  if (!isValidSlug(slug)) {
    return null;
  }

  const filePath = path.join(noticiasDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    frontmatter: {
      title: asString(data.title),
      date: asString(data.date),
      cat: asOptionalString(data.cat),
      bajada: asOptionalString(data.bajada),
      description: asString(data.description),
      image: asString(data.image),
    },
    content,
  };
}

function readCancionesFromFs(): CancionBasic[] {
  try {
    if (!fs.existsSync(cancionesDir)) {
      return [];
    }
    const files = fs.readdirSync(cancionesDir);
    return files.map((filename) => {
      const filePath = path.join(cancionesDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContent);

      return {
        title: asString(data.title),
        artist: asString(data.artist),
        slug: filename.replace(/\.md$/, ""),
      };
    });
  } catch (error) {
    console.error("Error reading canciones from filesystem:", error);
    return [];
  }
}

function readCancionDetailFromFs(slug: string): CancionDetail | null {
  if (!isValidSlug(slug)) {
    return null;
  }

  const filePath = path.join(cancionesDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return {
    title: asString(data.title),
    artist: asString(data.artist),
    content,
  };
}

function readAgendaFromFs(): AgendaEvento[] {
  try {
    if (!fs.existsSync(agendaDir)) {
      return [];
    }
    const filenames = fs.readdirSync(agendaDir);
    return filenames.map((filename) => {
      const filePath = path.join(agendaDir, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContent);

      return {
        fecha: asString(data.fecha),
        fecha_fin: asOptionalString(data.fecha_fin),
        evento: asString(data.evento),
        color: asOptionalString(data.color),
        descripcion: asOptionalString(data.descripcion),
        hora_inicio: asOptionalString(data.hora_inicio),
        hora_fin: asOptionalString(data.hora_fin),
        todo_el_dia: typeof data.todo_el_dia === "boolean" ? data.todo_el_dia : undefined,
      };
    });
  } catch (error) {
    console.error("Error reading agenda from filesystem:", error);
    return [];
  }
}

function readCarouselFromFs(): CarouselItem[] {
  try {
    if (!fs.existsSync(carouselDir)) {
      return [];
    }
    const filenames = fs.readdirSync(carouselDir);
    return filenames
      .map((filename) => {
        const filePath = path.join(carouselDir, filename);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent);
        return {
          imageDesktop: asString(data.imageDesktop),
          imageMobile: asString(data.imageMobile),
          alt: asString(data.alt),
          link: asOptionalString(data.link),
          buttonText: asOptionalString(data.buttonText),
          order: asNumber(data.order, 0),
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Error reading carousel from filesystem:", error);
    return [];
  }
}

export async function listNoticiasPreview(): Promise<NoticiaPreview[]> {
  const client = getTursoClient();
  if (isTursoReadEnabled && client) {
    try {
      const result = await client.execute(
        "SELECT slug, title, date, description, image FROM noticias ORDER BY date DESC"
      );

      return result.rows.map((row) => ({
        slug: asString(row.slug),
        title: asString(row.title),
        date: asString(row.date),
        description: asString(row.description),
        image: asString(row.image),
      }));
    } catch (error) {
      console.error("Turso read noticias failed, fallback to FS", error);
    }
  }

  return readNoticiasFromFs();
}

export async function listNoticiaSlugs(): Promise<string[]> {
  const noticias = await listNoticiasPreview();
  return noticias.map((item) => item.slug);
}

export async function getNoticiaDetailBySlug(slug: string): Promise<NoticiaDetail | null> {
  const client = getTursoClient();
  if (isTursoReadEnabled && client && isValidSlug(slug)) {
    try {
      const result = await client.execute({
        sql: "SELECT slug, title, date, cat, bajada, description, image, content FROM noticias WHERE slug = ? LIMIT 1",
        args: [slug],
      });

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          slug: asString(row.slug),
          frontmatter: {
            title: asString(row.title),
            date: asString(row.date),
            cat: asOptionalString(row.cat),
            bajada: asOptionalString(row.bajada),
            description: asString(row.description),
            image: asString(row.image),
          },
          content: asString(row.content),
        };
      }
    } catch (error) {
      console.error("Turso read noticia detail failed, fallback to FS", error);
    }
  }

  return readNoticiaDetailFromFs(slug);
}

export async function listCancionesBasic(): Promise<CancionBasic[]> {
  const client = getTursoClient();
  if (isTursoReadEnabled && client) {
    try {
      const result = await client.execute("SELECT slug, title, artist FROM canciones ORDER BY title ASC");
      return result.rows.map((row) => ({
        slug: asString(row.slug),
        title: asString(row.title),
        artist: asString(row.artist),
      }));
    } catch (error) {
      console.error("Turso read canciones failed, fallback to FS", error);
    }
  }

  return readCancionesFromFs();
}

export async function getCancionDetailBySlug(slug: string): Promise<CancionDetail | null> {
  const client = getTursoClient();
  if (isTursoReadEnabled && client && isValidSlug(slug)) {
    try {
      const result = await client.execute({
        sql: "SELECT title, artist, content FROM canciones WHERE slug = ? LIMIT 1",
        args: [slug],
      });

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          title: asString(row.title),
          artist: asString(row.artist),
          content: asString(row.content),
        };
      }
    } catch (error) {
      console.error("Turso read cancion detail failed, fallback to FS", error);
    }
  }

  return readCancionDetailFromFs(slug);
}

export async function listAgendaEventos(): Promise<AgendaEvento[]> {
  const client = getTursoClient();
  if (client) {
    try {
      const result = await client.execute("SELECT id, fecha, fecha_fin, evento, color, descripcion, hora_inicio, hora_fin, todo_el_dia FROM agenda ORDER BY fecha ASC");
      return result.rows.map((row) => ({
        id: asNumber(row.id),
        fecha: asString(row.fecha),
        fecha_fin: asOptionalString(row.fecha_fin),
        evento: asString(row.evento),
        color: asOptionalString(row.color),
        descripcion: asOptionalString(row.descripcion),
        hora_inicio: asOptionalString(row.hora_inicio),
        hora_fin: asOptionalString(row.hora_fin),
        todo_el_dia: typeof row.todo_el_dia === "number" ? row.todo_el_dia === 1 : undefined,
      }));
    } catch (error) {
      try {
        const legacyResult = await client.execute("SELECT id, fecha, fecha_fin, evento FROM agenda ORDER BY fecha ASC");
        return legacyResult.rows.map((row) => ({
          id: asNumber(row.id),
          fecha: asString(row.fecha),
          fecha_fin: asOptionalString(row.fecha_fin),
          evento: asString(row.evento),
        }));
      } catch (legacyError) {
        console.error("Turso read agenda failed, fallback to FS", error, legacyError);
      }
    }
  }

  return readAgendaFromFs();
}

export async function createAgendaEvento(
  evento: string,
  fecha: string,
  fecha_fin?: string,
  color?: string,
  descripcion?: string,
  hora_inicio?: string,
  hora_fin?: string,
  todo_el_dia?: boolean
): Promise<number> {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Database client not available");
  }

  try {
    const result = await client.execute({
      sql: "INSERT INTO agenda (evento, fecha, fecha_fin, color, descripcion, hora_inicio, hora_fin, todo_el_dia, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      args: [
        evento,
        fecha,
        fecha_fin || null,
        color || null,
        descripcion || null,
        hora_inicio || null,
        hora_fin || null,
        todo_el_dia === false ? 0 : 1,
      ],
    });
    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error("Error creating agenda evento:", error);
    throw error;
  }
}

export async function updateAgendaEvento(
  id: number,
  evento: string,
  fecha: string,
  fecha_fin?: string,
  color?: string,
  descripcion?: string,
  hora_inicio?: string,
  hora_fin?: string,
  todo_el_dia?: boolean
): Promise<void> {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Database client not available");
  }

  try {
    await client.execute({
      sql: "UPDATE agenda SET evento = ?, fecha = ?, fecha_fin = ?, color = ?, descripcion = ?, hora_inicio = ?, hora_fin = ?, todo_el_dia = ? WHERE id = ?",
      args: [
        evento,
        fecha,
        fecha_fin || null,
        color || null,
        descripcion || null,
        hora_inicio || null,
        hora_fin || null,
        todo_el_dia === false ? 0 : 1,
        id,
      ],
    });
  } catch (error) {
    console.error("Error updating agenda evento:", error);
    throw error;
  }
}

export async function deleteAgendaEvento(id: number): Promise<void> {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Database client not available");
  }

  try {
    await client.execute({
      sql: "DELETE FROM agenda WHERE id = ?",
      args: [id],
    });
  } catch (error) {
    console.error("Error deleting agenda evento:", error);
    throw error;
  }
}

export async function listCarouselItems(): Promise<CarouselItem[]> {
  const client = getTursoClient();
  if (isTursoReadEnabled && client) {
    try {
      const result = await client.execute(
        "SELECT imageDesktop, imageMobile, alt, link, buttonText, \"order\" FROM carousel ORDER BY \"order\" ASC"
      );

      return result.rows.map((row) => ({
        imageDesktop: asString(row.imageDesktop),
        imageMobile: asString(row.imageMobile),
        alt: asString(row.alt),
        link: asOptionalString(row.link),
        buttonText: asOptionalString(row.buttonText),
        order: asNumber(row.order),
      }));
    } catch (error) {
      console.error("Turso read carousel failed, fallback to FS", error);
    }
  }

  return readCarouselFromFs();
}

export async function saveContent(
  seccion: string,
  titulo: string,
  contenido: string
): Promise<void> {
  const client = getTursoClient();
  if (!client) {
    throw new Error("Database client not available");
  }

  try {
    // Crear tabla si no existe
    await client.execute(
      `CREATE TABLE IF NOT EXISTS custom_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seccion TEXT NOT NULL,
        titulo TEXT,
        contenido TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Insertar o actualizar contenido
    await client.execute(
      `INSERT INTO custom_content (seccion, titulo, contenido, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(seccion) DO UPDATE SET 
       titulo = excluded.titulo,
       contenido = excluded.contenido,
       updated_at = CURRENT_TIMESTAMP`,
      [seccion, titulo, contenido]
    );
  } catch (error) {
    console.error("Error saving content to Turso:", error);
    throw error;
  }
}

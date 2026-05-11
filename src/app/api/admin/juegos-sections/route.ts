import { NextResponse } from 'next/server';
import { getTursoClient } from '@/server/db/turso';
import { badRequest, isValidSlug, requirePermission, serverError } from '@/app/api/admin/_shared/auth';

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) {
    throw new Error('Turso no configurado');
  }
  return client;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

async function getUniqueSlug(baseValue: string) {
  const client = clientOrThrow();
  const baseSlug = normalizeSlug(baseValue) || 'seccion';
  const result = await client.execute({
    sql: 'SELECT slug FROM juegos_sections WHERE slug = ? OR slug LIKE ?',
    args: [baseSlug, `${baseSlug}-%`],
  });

  const existing = new Set(result.rows.map((row: any) => String(row.slug)));
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

export async function GET() {
  const auth = await requirePermission('content.read');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const client = clientOrThrow();
    const result = await client.execute(
      'SELECT id, slug, title, position FROM juegos_sections ORDER BY position ASC, created_at ASC'
    );
    return NextResponse.json(
      result.rows.map((row: any) => ({
        id: row[0],
        slug: row[1],
        title: row[2],
        position: row[3],
      }))
    );
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission('content.write');
  if ('errorResponse' in auth) return auth.errorResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Body invalido');
  }

  if (typeof body !== 'object' || body === null) {
    return badRequest('Payload invalido');
  }

  const payload = body as Record<string, unknown>;
  const title = String(payload.title || '').trim();
  const slugInput = String(payload.slug || '').trim();

  if (!title) {
    return badRequest('title is required');
  }

  if (slugInput && !isValidSlug(slugInput)) {
    return badRequest('Slug invalido. Usa solo minusculas, numeros y guiones');
  }

  try {
    const client = clientOrThrow();
    const slug = slugInput ? normalizeSlug(slugInput) : await getUniqueSlug(title);

    const positionResult = await client.execute({
      sql: 'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM juegos_sections',
      args: [],
    });
    const nextPosition = Number(positionResult.rows[0]?.next_position ?? 0);

    await client.execute({
      sql: 'INSERT INTO juegos_sections (slug, title, position) VALUES (?, ?, ?)',
      args: [slug, title, nextPosition],
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : 'No se pudo crear la seccion');
  }
}

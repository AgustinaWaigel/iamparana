import { NextResponse } from 'next/server';
import { getTursoClient } from '@/server/db/turso';
import { badRequest, isValidSlug, parseId, requirePermission, serverError } from '@/app/api/admin/_shared/auth';

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('content.write');
  if ('errorResponse' in auth) return auth.errorResponse;

  const { id } = await params;
  const parsedId = parseId(id);
  if (parsedId === null) return badRequest('ID invalido');

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
  const position = Number(payload.position ?? NaN);

  if (!title) {
    return badRequest('title is required');
  }

  if (slugInput && !isValidSlug(slugInput)) {
    return badRequest('Slug invalido. Usa solo minusculas, numeros y guiones');
  }

  try {
    const client = clientOrThrow();
    const slug = slugInput ? normalizeSlug(slugInput) : '';

    await client.execute({
      sql: `UPDATE juegos_sections
            SET title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                position = COALESCE(?, position),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [title || null, slug || null, Number.isFinite(position) ? position : null, parsedId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : 'No se pudo actualizar la seccion');
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('content.delete');
  if ('errorResponse' in auth) return auth.errorResponse;

  const { id } = await params;
  const parsedId = parseId(id);
  if (parsedId === null) return badRequest('ID invalido');

  try {
    const client = clientOrThrow();
    const generalSection = await client.execute({
      sql: "SELECT id FROM juegos_sections WHERE slug = 'general' LIMIT 1",
      args: [],
    });
    const generalId = generalSection.rows[0]?.id ? Number(generalSection.rows[0].id) : null;

    if (generalId) {
      await client.execute({
        sql: 'UPDATE juegos SET section_id = ? WHERE section_id = ?',
        args: [generalId, parsedId],
      });
    } else {
      await client.execute({
        sql: 'UPDATE juegos SET section_id = NULL WHERE section_id = ?',
        args: [parsedId],
      });
    }

    await client.execute({
      sql: 'DELETE FROM juegos_sections WHERE id = ?',
      args: [parsedId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : 'No se pudo eliminar la seccion');
  }
}

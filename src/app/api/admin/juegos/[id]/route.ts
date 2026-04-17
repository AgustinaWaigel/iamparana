import { NextResponse, NextRequest } from 'next/server';
import { getTursoClient } from '@/app/db/turso';
import { requirePermission, badRequest, serverError, parseId } from '@/app/api/admin/_shared/auth';

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) {
    throw new Error('Turso no configurado');
  }
  return client;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePermission('content.write');
  if ('errorResponse' in auth) return auth.errorResponse;

  const parsedId = parseId(id);
  if (parsedId === null) return badRequest('ID inválido');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Body inválido');
  }

  if (typeof body !== 'object' || body === null) {
    return badRequest('Payload inválido');
  }

  const payload = body as Record<string, unknown>;
  const { title, description, youtubeId, category, order } = payload;

  if (typeof title !== 'string' || typeof description !== 'string') {
    return badRequest('Campos requeridos faltantes');
  }

  try {
    const client = clientOrThrow();
    
    const youtubeIdValue = typeof youtubeId === 'string' ? youtubeId : null;
    const categoryValue = typeof category === 'string' ? category : 'general';
    const orderValue = typeof order === 'number' ? order : 999;
    
    await client.execute(
      'UPDATE juegos SET title = ?, description = ?, youtubeId = ?, category = ?, "order" = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, youtubeIdValue, categoryValue, orderValue, parsedId]
    );
    return NextResponse.json({ message: 'Juego actualizado' });
  } catch (error) {
    console.error('Error:', error);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requirePermission('content.delete');
  if ('errorResponse' in auth) return auth.errorResponse;

  const parsedId = parseId(id);
  if (parsedId === null) return badRequest('ID inválido');

  try {
    const client = clientOrThrow();
    await client.execute('DELETE FROM juegos WHERE id = ?', [parsedId]);
    return NextResponse.json({ message: 'Juego eliminado' });
  } catch (error) {
    console.error('Error:', error);
    return serverError();
  }
}

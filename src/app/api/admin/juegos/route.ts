import { NextResponse, NextRequest } from 'next/server';
import { getTursoClient } from '@/app/db/turso';
import { requirePermission, badRequest, serverError } from '@/app/api/admin/_shared/auth';

function clientOrThrow() {
  const client = getTursoClient();
  if (!client) {
    throw new Error('Turso no configurado');
  }
  return client;
}

export async function GET(req: NextRequest) {
  try {
    const client = clientOrThrow();
    const result = await client.execute(
      'SELECT id, slug, title, description, youtubeId, category, "order" FROM juegos ORDER BY "order" ASC'
    );

    return NextResponse.json(
      result.rows.map((row: any) => ({
        id: row[0],
        slug: row[1],
        title: row[2],
        description: row[3],
        youtubeId: row[4],
        category: row[5],
        order: row[6],
      }))
    );
  } catch (error) {
    console.error('Error:', error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('content.write');
  if ('errorResponse' in auth) return auth.errorResponse;

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
  const { slug, title, description, youtubeId, category, order } = payload;

  if (typeof slug !== 'string' || typeof title !== 'string' || typeof description !== 'string') {
    return badRequest('Campos requeridos faltantes');
  }

  try {
    const client = clientOrThrow();
    
    const youtubeIdValue = typeof youtubeId === 'string' ? youtubeId : null;
    const categoryValue = typeof category === 'string' ? category : 'general';
    const orderValue = typeof order === 'number' ? order : 999;
    
    await client.execute(
      'INSERT INTO juegos (slug, title, description, youtubeId, category, "order") VALUES (?, ?, ?, ?, ?, ?)',
      [slug, title, description, youtubeIdValue, categoryValue, orderValue]
    );
    return NextResponse.json({ message: 'Juego creado' });
  } catch (error) {
    console.error('Error:', error);
    return serverError();
  }
}

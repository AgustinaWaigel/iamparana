import { NextResponse, NextRequest } from 'next/server';
import { getTursoClient } from '@/server/db/turso';
import { requirePermission, serverError, badRequest } from '@/app/api/admin/_shared/auth';

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
      'SELECT id, section, title, description, content, updated_at FROM animacion_content WHERE section = ? LIMIT 1',
      ['main']
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        id: 0,
        section: 'main',
        title: 'Animación',
        description: 'Cantar, bailar, jugar...',
        content: null,
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      id: row[0],
      section: row[1],
      title: row[2],
      description: row[3],
      content: row[4],
      updated_at: row[5],
    });
  } catch (error) {
    console.error('Error:', error);
    // Retornar valores por defecto si hay error
    return NextResponse.json({
      id: 0,
      section: 'main',
      title: 'Animación',
      description: 'Cantar, bailar, jugar. Parte de nuestro día a día en la IAM es esto, por eso venimos a ayudarte con recursos para tus encuentros, y con el día a día. Acá vas a poder encontrar las canciones que cantamos siempre en la IAM y también muchos juegos y dinámicas que te van a servir. ¡A jugar y a bailar!',
      content: null,
    });
  }
}

export async function PUT(req: NextRequest) {
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

  const { title, description, content } = body as Record<string, unknown>;

  if (typeof title !== 'string' || typeof description !== 'string') {
    return badRequest('Title y description son requeridos');
  }

  try {
    const client = clientOrThrow();

    // Verificar si existe
    const existing = await client.execute(
      'SELECT id FROM animacion_content WHERE section = ?',
      ['main']
    );

    const contentValue = typeof content === 'string' ? content : null;

    if (existing.rows.length > 0) {
      await client.execute(
        'UPDATE animacion_content SET title = ?, description = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ?',
        [title, description, contentValue, 'main']
      );
    } else {
      await client.execute(
        'INSERT INTO animacion_content (section, title, description, content) VALUES (?, ?, ?, ?)',
        ['main', title, description, contentValue]
      );
    }

    return NextResponse.json({ message: 'Contenido actualizado' });
  } catch (error) {
    console.error('Error:', error);
    return serverError();
  }
}

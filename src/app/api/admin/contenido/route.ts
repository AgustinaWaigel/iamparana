import { NextResponse } from 'next/server';
import { requirePermission, serverError, badRequest } from '@/api/admin/_shared/auth';
import { saveContent } from '@/db/content-repository';

export async function POST(req: Request) {
  const auth = await requirePermission('content.write');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();

    const { seccion, titulo, contenido } = body;

    if (!seccion || !contenido) {
      return badRequest('Sección y contenido son requeridos');
    }

    // Guardar contenido
    await saveContent(seccion, titulo || 'Sin título', contenido);

    return NextResponse.json({
      success: true,
      message: 'Contenido guardado correctamente',
    });
  } catch (error) {
    console.error('Error saving content:', error);
    return serverError();
  }
}

export async function GET(req: Request) {
  const auth = await requirePermission('content.read');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const seccion = searchParams.get('seccion');

    if (!seccion) {
      return badRequest('Sección es requerida');
    }

    // Obtener contenido
    const content = await getContentBySection(seccion);

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error getting content:', error);
    return serverError();
  }
}

// Función auxiliar (necesitarías implementarla en content-repository)
async function getContentBySection(section: string) {
  // Implementar según tu base de datos
  return { section, content: null };
}

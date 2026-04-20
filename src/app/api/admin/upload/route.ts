// Subida de archivos al storage/Drive para noticias, documentos y recursos.
import { NextResponse } from 'next/server';
import { requirePermission, serverError } from '@/app/api/admin/_shared/auth';
import { uploadFileToDrive, getOrCreateFolder } from '@/lib/google-drive-service';

const UPLOAD_FOLDERS = {
  noticia: 'IAM Paraná - Noticias',
  documento: 'IAM Paraná - Documentos',
  imagen: 'IAM Paraná - Imágenes',
  audio: 'IAM Paraná - Audio',
  cancion: 'IAM Paraná - Canciones',
} as const;

export async function POST(req: Request) {
  try {
    const auth = await requirePermission('content.write');
    if ('errorResponse' in auth) return auth.errorResponse;

    // Obtener FormData - manejo robusto
    let formData: FormData;
    
    try {
      formData = await req.formData();
    } catch (parseError) {
      console.error('FormData parse error:', parseError);
      return NextResponse.json(
        { error: 'Error al procesar el archivo. Asegúrate de que sea un archivo válido.' },
        { status: 400 }
      );
    }

    const file = formData.get('file');
    const type = (formData.get('type') as string) || 'imagen';

    // Validar que se recibió un archivo
    if (!file || !(file instanceof File)) {
      console.error('No file received or invalid file object');
      return NextResponse.json(
        { error: 'Se requiere un archivo válido' },
        { status: 400 }
      );
    }

    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      );
    }

    console.log(`Subiendo archivo: ${file.name}, tipo: ${type}, tamaño: ${file.size}`);

    // Validar tipo de carpeta
    const folderName = UPLOAD_FOLDERS[type as keyof typeof UPLOAD_FOLDERS] || UPLOAD_FOLDERS.imagen;

    // Obtener o crear carpeta en Google Drive
    const folderId = await getOrCreateFolder(folderName);

    // Subir archivo
    const result = await uploadFileToDrive(
      file,
      file.name,
      folderId,
      file.type
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al subir archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      fileName: result.fileName,
      size: result.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al subir: ${message}` },
      { status: 500 }
    );
  }
}

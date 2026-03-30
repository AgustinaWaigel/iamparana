import { NextResponse } from 'next/server';
import { requirePermission, serverError } from '@/api/admin/_shared/auth';
import { uploadFileToDrive, getOrCreateFolder } from '@/../lib/google-drive-service';

const UPLOAD_FOLDERS = {
  noticia: 'IAM Paraná - Noticias',
  documento: 'IAM Paraná - Documentos',
  imagen: 'IAM Paraná - Imágenes',
  audio: 'IAM Paraná - Audio',
  cancion: 'IAM Paraná - Canciones',
} as const;

export async function POST(req: Request) {
  const auth = await requirePermission('content.write');
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'imagen';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

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
        { error: result.error || 'Upload failed' },
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
    return serverError();
  }
}

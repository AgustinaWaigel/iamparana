import "server-only";

import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleDriveImageUrl } from './drive-utils';

// 1. Configuración de Variables de Entorno (OAuth2)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

// Re-exportar utilidades de drive para comodidad
export { getGoogleDriveImageUrl } from './drive-utils';

// 2. Obtener cliente autenticado mediante OAuth2
function getDriveClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Credenciales de Google Drive (OAuth2) no configuradas en .env');
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// 3. Crear o obtener carpeta (Busca en tu unidad personal)
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${
        parentFolderId ? ` and '${parentFolderId}' in parents` : ''
      }`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 1,
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    const createResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] }),
      },
      fields: 'id',
    });

    if (!createResponse.data.id) {
      throw new Error('Error al crear la carpeta en Drive');
    }

    return createResponse.data.id;
  } catch (error) {
    console.error('Error en getOrCreateFolder:', error);
    throw error;
  }
}

// 4. Subir archivo a Google Drive
export async function uploadFileToDrive(
  file: Buffer | File,
  fileName: string,
  parentFolderId: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    // Convertir a Buffer de forma segura para Next.js
    let fileBuffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      fileBuffer = file;
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `El archivo excede el límite de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    const drive = getDriveClient();

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [parentFolderId],
      },
      media: {
        mimeType: mimeType,
        body: Readable.from([fileBuffer]),
      },
      fields: 'id, name, size, mimeType, webViewLink, webContentLink',
    });

    if (!response.data.id) {
      return { success: false, error: 'No se recibió ID del archivo' };
    }

    // Intentar compartir el archivo
    await makeFilePublic(response.data.id);

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name || fileName,
      url: response.data.webViewLink || '',
      size: response.data.size ? parseInt(String(response.data.size)) : 0,
      mimeType: response.data.mimeType || mimeType,
    };
  } catch (error) {
    console.error('Error en uploadFileToDrive:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo',
    };
  }
}

// 5. Funciones auxiliares (Público, URL, Eliminar)
async function makeFilePublic(fileId: string): Promise<void> {
  const drive = getDriveClient();
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (error) {
    console.log('Aviso: No se pudo marcar como público (puede ser restricción de cuenta):', error);
  }
}

export async function getPublicFileUrl(fileId: string): Promise<string | null> {
  const drive = getDriveClient();
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink, mimeType',
    });
    if (response.data.mimeType?.startsWith('image/')) {
      return response.data.webContentLink ? `${response.data.webContentLink}&export=download` : null;
    }
    return response.data.webViewLink || null;
  } catch (error) {
    console.error('Error al obtener URL:', error);
    return null;
  }
}

export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  const drive = getDriveClient();
  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
}
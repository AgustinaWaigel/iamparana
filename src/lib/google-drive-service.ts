'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';

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

// Obtener cliente autenticado
function getDriveClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google Drive credentials not configured');
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

// Crear o obtener carpeta
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const drive = getDriveClient();

  try {
    // Buscar carpeta existente
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

    // Crear nueva carpeta si no existe
    const createResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] }),
      },
      fields: 'id',
    });

    if (!createResponse.data.id) {
      throw new Error('Failed to create folder');
    }

    return createResponse.data.id;
  } catch (error) {
    console.error('Error creating/getting folder:', error);
    throw error;
  }
}

// Subir archivo a Google Drive
export async function uploadFileToDrive(
  file: Buffer | File,
  fileName: string,
  parentFolderId: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    // Validar tamaño
    const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
      };
    }

    const drive = getDriveClient();

    const fileMetadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [parentFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, mimeType, webViewLink, webContentLink',
    });

    if (!response.data.id) {
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }

    // Hacer el archivo público
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
    console.error('Error uploading file to Drive:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error uploading file',
    };
  }
}

// Hacer archivo público
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
    console.log('Warning: Could not make file public:', error);
    // No lanzar error, continuar de todas formas
  }
}

// Obtener URL pública del archivo
export async function getPublicFileUrl(fileId: string): Promise<string | null> {
  const drive = getDriveClient();

  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink, mimeType',
    });

    // Para imágenes, usar webContentLink para obtener el contenido directo
    if (response.data.mimeType?.startsWith('image/')) {
      return response.data.webContentLink ? `${response.data.webContentLink}&export=download` : null;
    }

    return response.data.webViewLink || null;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}

// Eliminar archivo de Google Drive
export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  const drive = getDriveClient();

  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

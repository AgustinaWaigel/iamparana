import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { extractGoogleDriveFileId } from '@/lib/drive-utils';

export const runtime = 'nodejs';

function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Credenciales de Google Drive no configuradas');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get('id') || '').trim();
    const src = String(searchParams.get('src') || '').trim();

    const fileId = id || extractGoogleDriveFileId(src);
    if (!fileId) {
      return NextResponse.json({ error: 'Parámetro id inválido' }, { status: 400 });
    }

    const drive = getDriveClient();

    const meta = await drive.files.get({
      fileId,
      fields: 'mimeType',
      supportsAllDrives: true,
    });

    const mimeType = String(meta.data.mimeType || 'application/octet-stream');

    const mediaResponse = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
      },
      {
        responseType: 'arraybuffer',
      }
    );

    const bytes = Buffer.from(mediaResponse.data as ArrayBuffer);

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('drive-image error', error);
    return NextResponse.json({ error: 'No se pudo cargar la imagen' }, { status: 404 });
  }
}

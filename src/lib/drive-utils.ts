export function getGoogleDriveImageUrl(urlOrPath: string | undefined | null): string | null {
  if (!urlOrPath) return null;

  const value = String(urlOrPath).trim();
  if (!value) return null;

  if (value.startsWith('/')) {
    return value;
  }

  // URL externa normal (incluye googleusercontent directo)
  if (value.startsWith('http') && !value.includes('drive.google.com') && !value.includes('docs.google.com')) {
    return value;
  }

  let fileId = value;

  if (value.includes('drive.google.com') || value.includes('docs.google.com')) {
    const match =
      value.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      value.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      value.match(/\/uc\?.*?[?&]id=([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      fileId = match[1];
    }
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    // Servimos archivos de Drive mediante nuestro endpoint autenticado. Esto
    // evita depender de permisos públicos, redirects y cachés cruzadas.
    return `/api/drive-image?id=${encodeURIComponent(fileId)}&v=3`;
  }

  return value;
}

export function extractGoogleDriveFileId(urlOrPath: string | undefined | null): string {
  if (!urlOrPath) return '';

  const value = String(urlOrPath).trim();
  if (!value) return '';

  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) {
    return value;
  }

  if (value.includes('drive.google.com') || value.includes('docs.google.com')) {
    const match =
      value.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      value.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      value.match(/\/uc\?.*?[?&]id=([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      return match[1];
    }
  }

  return '';
}

export function getGoogleDriveProxyImageUrl(urlOrPath: string | undefined | null): string | null {
  if (!urlOrPath) return null;

  const raw = String(urlOrPath).trim();
  if (!raw) return null;
  if (raw.startsWith('/')) return raw;

  const fileId = extractGoogleDriveFileId(raw);
  if (fileId) {
    // Cambiar esta versión invalida respuestas incorrectas que hayan quedado
    // almacenadas antes de separar la caché de Netlify por ID de archivo.
    return `/api/drive-image?id=${encodeURIComponent(fileId)}&v=3`;
  }

  return raw;
}

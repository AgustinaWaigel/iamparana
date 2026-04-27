export function getGoogleDriveImageUrl(urlOrPath: string | undefined | null): string {
  if (!urlOrPath) return '';

  if (urlOrPath.startsWith('/')) {
    return urlOrPath;
  }

  // URL externa normal (incluye googleusercontent directo)
  if (urlOrPath.startsWith('http') && !urlOrPath.includes('drive.google.com') && !urlOrPath.includes('docs.google.com')) {
    return urlOrPath;
  }

  let fileId = urlOrPath;

  if (urlOrPath.includes('drive.google.com') || urlOrPath.includes('docs.google.com')) {
    const match =
      urlOrPath.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      urlOrPath.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      urlOrPath.match(/\/uc\?.*?[?&]id=([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      fileId = match[1];
    }
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    // Endpoint más estable para <img>
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }

  return urlOrPath;
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

export function getGoogleDriveProxyImageUrl(urlOrPath: string | undefined | null): string {
  if (!urlOrPath) return '';

  const raw = String(urlOrPath).trim();
  if (!raw) return '';
  if (raw.startsWith('/')) return raw;

  const fileId = extractGoogleDriveFileId(raw);
  if (fileId) {
    return `/api/drive-image?id=${encodeURIComponent(fileId)}`;
  }

  return raw;
}
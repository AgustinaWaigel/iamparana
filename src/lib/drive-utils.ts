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
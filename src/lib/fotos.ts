/** ¿El enlace es un álbum de Google Fotos? Esos se muestran en "Fotos de los eventos". */
export function esAlbumDeFotos(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.toLowerCase();
    return host === 'photos.app.goo.gl' || host === 'photos.google.com' || (host === 'goo.gl' && pathname.startsWith('/photos'));
  } catch {
    return false;
  }
}

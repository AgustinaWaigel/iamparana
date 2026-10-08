// País al que acompañamos este año con la Infancia y Adolescencia Misionera.
// Para cambiar de año: actualizá el país, su ubicación (latitud, longitud) y las fotos.
// Las fotos pueden ser rutas dentro de /public (por ejemplo "/assets/mision/foto1.webp")
// o enlaces de Google Drive, igual que en el carrusel. Al tocar el país se muestran las tres primeras
// y el video de YouTube.

export interface FotoMision {
  src: string;
  /** Descripción de la foto para quien no la puede ver. */
  alt: string;
  epigrafe?: string;
}

export const MISION_DEL_ANIO = {
  anio: 2026,
  pais: 'Papúa Nueva Guinea',
  /** [latitud, longitud] */
  ubicacion: [-6.3, 147.2] as [number, number],
  /** De dónde sale la flecha. */
  origen: { nombre: 'Argentina', ubicacion: [-34, -64] as [number, number] },
  resumen:
    'Desde Argentina, nuestra ayuda cruza el océano hasta Oceanía. Tocá Papúa Nueva Guinea en el globo y conocé un poco más sobre su realidad.',
  datos: [
    { label: 'Continente', valor: 'Oceanía' },
    { label: 'Capital', valor: 'Port Moresby' },
    { label: 'Idiomas', valor: 'Más de 800' },
  ],
  fotos: [
    { src: '/assets/mision/chicos-pulgares.webp', alt: 'Chicos sonriendo con los pulgares arriba frente a casas de palma sobre pilotes' },
    { src: '/assets/mision/chicos-techo.webp', alt: 'Chicos y chicas sentados bajo un techo de hojas de palma' },
    { src: '/assets/mision/comunidad.webp', alt: 'Familias de una comunidad sentadas en el pasto, algunas bajo paraguas de colores' },
  ] as FotoMision[],
  /** Video que se ve al tocar el país; `inicio` en segundos. */
  video: { id: 'TGb4ljMUbXg', inicio: 490, titulo: 'Video sobre Papúa Nueva Guinea' } as { id: string; inicio: number; titulo: string } | null,
};

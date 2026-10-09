'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Mapa con un punto por cada IAM. Usa Leaflet con el mapa libre de OpenStreetMap,
// que no necesita clave. Los puntos llegan ya calculados desde el servidor.

export interface PuntoIam {
  id: string;
  nombre: string;
  ciudad: string;
  lat: number;
  lng: number;
  color: string;
}

export function MapaIam({ puntos }: { puntos: PuntoIam[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);
  // Vuelve a mostrar todas las IAM juntas; lo define el mapa cuando termina de cargar.
  const volverRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor || puntos.length === 0) return;
    let mapa: import('leaflet').Map | null = null;
    let vigente = true;
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // La librería se carga recién acá: necesita el navegador.
    import('leaflet')
      .then(({ default: L }) => {
        if (!vigente) return;
        // Se acerca y se aleja con la rueda del mouse, de a pasos cortos para que sea suave.
        mapa = L.map(contenedor, { scrollWheelZoom: true, zoomSnap: 0.5, zoomDelta: 0.5, wheelPxPerZoomLevel: 90, attributionControl: true });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(mapa);

        for (const punto of puntos) {
          const icono = L.divIcon({
            className: '',
            iconSize: [30, 38],
            iconAnchor: [15, 36],
            popupAnchor: [0, -32],
            // Un globito con el color de la IAM y borde oscuro, para que se vea sobre cualquier parte del mapa.
            html: `<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 1.5C7.5 1.5 1.5 7.4 1.5 14.7c0 9.6 13.5 21.8 13.5 21.8s13.500-12.2 13.500-21.8C28.500 7.400 22.500 1.500 15 1.500Z" fill="${punto.color}" stroke="#3a1508" stroke-width="2.5"/><circle cx="15" cy="14.500" r="4.500" fill="#fff" stroke="#3a1508" stroke-width="2"/></svg>`,
          });
          const nombre = document.createElement('strong');
          nombre.textContent = punto.nombre;
          const ciudad = document.createElement('span');
          ciudad.textContent = punto.ciudad;
          const globo = document.createElement('div');
          globo.className = 'mapa-iam-globo';
          globo.append(nombre, ciudad);
          const marcador = L.marker([punto.lat, punto.lng], { icon: icono, title: `${punto.nombre}, ${punto.ciudad}`, alt: `${punto.nombre}, ${punto.ciudad}` }).addTo(mapa).bindPopup(globo);
          // Al tocar una IAM, el mapa se acerca a ella (si ya estaba cerca, solo la centra).
          marcador.on('click', () => mapa?.flyTo([punto.lat, punto.lng], Math.max(mapa.getZoom(), 13), { duration: quieto ? 0 : 0.8 }));
        }
        const todas = L.latLngBounds(puntos.map((punto) => [punto.lat, punto.lng] as [number, number]));
        const verTodas = () => mapa?.flyToBounds(todas, { padding: [36, 36], maxZoom: 13, duration: quieto ? 0 : 0.8 });
        mapa.fitBounds(todas, { padding: [36, 36], maxZoom: 13 });
        volverRef.current = verTodas;
      })
      .catch(() => { if (vigente) setFallo(true); });

    return () => {
      vigente = false;
      volverRef.current = null;
      mapa?.remove();
    };
  }, [puntos]);

  if (fallo) {
    return <p className="m-0 max-w-none rounded-2xl border border-dashed border-brand-brown/20 px-5 py-8 text-center text-base text-brand-ink/65">No pudimos cargar el mapa. Abajo está la lista de todas las IAM.</p>;
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label="Mapa de las IAM de la Arquidiócesis de Paraná"
        className="relative z-0 h-[min(75svh,34rem)] w-full overflow-hidden rounded-[26px] bg-brand-cream ring-1 ring-brand-brown/15"
      />
      <button
        type="button"
        onClick={() => volverRef.current?.()}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-brand-deep shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)] ring-1 ring-brand-brown/20 transition-colors hover:bg-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
      >
        <Maximize2 size={15} aria-hidden /> Ver todas
      </button>
    </div>
  );
}

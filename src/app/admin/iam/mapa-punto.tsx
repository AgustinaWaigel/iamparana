"use client";

import { useEffect, useRef, useState } from "react";
import { pinSvg } from "@/app/quienes-somos/mapa-iam";
import "leaflet/dist/leaflet.css";

// Mapa para marcar dónde queda una IAM: se toca el lugar o se arrastra el globito.

export type Punto = [number, number];

const redondear = (valor: number) => Math.round(valor * 100000) / 100000;

export function MapaPunto({ punto, centro, color, onChange }: { punto: Punto | null; centro: Punto; color: string; onChange: (punto: Punto) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);
  // Lo que arma el mapa al cargar: una función que pone (o saca) el globito donde se le diga.
  const mostrarRef = useRef<((punto: Punto | null, color: string) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const actual = useRef({ punto, color });

  useEffect(() => {
    onChangeRef.current = onChange;
    actual.current = { punto, color };
  });

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor) return;
    let mapa: import("leaflet").Map | null = null;
    let vigente = true;

    import("leaflet")
      .then(({ default: L }) => {
        if (!vigente) return;
        const inicio = actual.current.punto;
        mapa = L.map(contenedor, { scrollWheelZoom: true, zoomSnap: 0.5 }).setView(inicio ?? centro, inicio ? 16 : 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        }).addTo(mapa);

        let marcador: import("leaflet").Marker | null = null;
        const avisar = (lat: number, lng: number) => onChangeRef.current([redondear(lat), redondear(lng)]);

        mostrarRef.current = (nuevo, nuevoColor) => {
          if (!mapa) return;
          if (!nuevo) {
            marcador?.remove();
            marcador = null;
            return;
          }
          const icono = L.divIcon({ className: "", iconSize: [30, 38], iconAnchor: [15, 36], html: pinSvg(nuevoColor) });
          if (marcador) {
            marcador.setLatLng(nuevo).setIcon(icono);
          } else {
            marcador = L.marker(nuevo, { icon: icono, draggable: true, title: "Arrastrá para corregir el lugar" }).addTo(mapa);
            marcador.on("dragend", () => {
              const lugar = marcador?.getLatLng();
              if (lugar) avisar(lugar.lat, lugar.lng);
            });
          }
          mapa.setView(nuevo, Math.max(mapa.getZoom(), 15));
        };

        mapa.on("click", (evento) => avisar(evento.latlng.lat, evento.latlng.lng));
        mostrarRef.current(actual.current.punto, actual.current.color);
      })
      .catch(() => { if (vigente) setFallo(true); });

    return () => {
      vigente = false;
      mostrarRef.current = null;
      mapa?.remove();
    };
    // El centro solo importa al abrir: después manda el punto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lat = punto?.[0] ?? null;
  const lng = punto?.[1] ?? null;
  useEffect(() => {
    mostrarRef.current?.(lat === null || lng === null ? null : [lat, lng], color);
  }, [lat, lng, color]);

  if (fallo) {
    return <p className="m-0 max-w-none rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-600">No pudimos cargar el mapa. Probá recargar la página.</p>;
  }

  return <div ref={ref} role="region" aria-label="Mapa para marcar dónde queda la IAM" className="relative z-0 h-72 w-full overflow-hidden rounded-xl border border-stone-200 bg-brand-cream sm:h-80" />;
}

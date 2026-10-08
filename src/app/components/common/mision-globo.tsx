"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import { getGoogleDriveProxyImageUrl } from "@/lib/drive-utils";
import { FadeInSection } from "./fade-in-section";
import { MISION_DEL_ANIO } from "./mision-del-anio";
import { Ondas } from "./ondas";
import { crearTierra, type Tierra } from "./tierra-webgl";

// Globo que gira con una flecha que sale de Argentina y llega al país de la misión del año.
// Al tocar el país se abre una tarjeta con fotos de los chicos de allá y un video.

type LatLng = [number, number];
type Vec = [number, number, number];

const RAD = Math.PI / 180;
const DESTINO = MISION_DEL_ANIO.ubicacion;
const ORIGEN = MISION_DEL_ANIO.origen.ubicacion;
const ELEVACION = 0.05;
const ALTURA_ARCO = 0.22;
const AMARILLO = "#f6c445";
const OSCURO = "#3a1508";

/** Punto del globo (radio 1), en las mismas coordenadas con las que se dibuja la Tierra. */
function vector([lat, lng]: LatLng): Vec {
  const la = lat * RAD;
  const lo = lng * RAD - Math.PI;
  return [-Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}

/** Posición en pantalla (0–1) de un punto ya escalado, y si se ve (adelante o asomando por el borde). */
function proyectar(p: Vec, phi: number, theta: number) {
  const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta);
  const x = cp * p[0] + sp * p[2];
  const y = sp * st * p[0] + ct * p[1] - cp * st * p[2];
  const z = -sp * ct * p[0] + st * p[1] + cp * ct * p[2];
  return { x: (x + 1) / 2, y: (-y + 1) / 2, visible: z >= 0 || x * x + y * y >= 0.64 };
}

/** Interpolación sobre el círculo máximo entre dos puntos (radio 1). */
function slerp(a: Vec, b: Vec, t: number): Vec {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const s = Math.sin(omega) || 1;
  const ka = Math.sin((1 - t) * omega) / s;
  const kb = Math.sin(t * omega) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

const escalar = (v: Vec, r: number): Vec => [v[0] * r, v[1] * r, v[2] * r];
const V_ORIGEN = vector(ORIGEN);
const V_DESTINO = vector(DESTINO);
// Vista de reposo: el punto medio del viaje queda de frente, así se ven las dos puntas.
const MEDIO = slerp(V_ORIGEN, V_DESTINO, 0.5);
const PHI_MEDIO = Math.PI / 2 - Math.atan2(MEDIO[2], -MEDIO[0]);
const THETA_MEDIO = Math.max(-0.6, Math.min(0.6, Math.asin(MEDIO[1])));
// Inclinación mientras gira: un poco hacia el sur, donde están las dos puntas del viaje.
const THETA_GIRO = Math.max(-0.45, THETA_MEDIO);
// Ángulos con los que el país queda de frente.
const PHI_PAIS = (3 * Math.PI) / 2 - DESTINO[1] * RAD;
const THETA_PAIS = DESTINO[0] * RAD;
/** Hasta dónde se puede inclinar el globo hacia cada polo al arrastrarlo, en radianes. */
const INCLINACION_MAX = 1.25;
/** Velocidad de giro, en radianes por segundo. */
const VELOCIDAD = 0.22;

/** Diferencia de ángulo más corta, para girar hacia el país por el camino más corto. */
function delta(desde: number, hasta: number) {
  return Math.atan2(Math.sin(hasta - desde), Math.cos(hasta - desde));
}
const ARCO: Vec[] = Array.from({ length: 90 }, (_, index) => {
  const t = index / 89;
  return escalar(slerp(V_ORIGEN, V_DESTINO, t), 0.8 + 0.012 + ALTURA_ARCO * Math.sin(Math.PI * t));
});

export function MisionGlobo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcoRef = useRef<HTMLCanvasElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const puntoRef = useRef<HTMLButtonElement>(null);
  const origenRef = useRef<HTMLSpanElement>(null);
  const abanicoRef = useRef<HTMLDivElement>(null);
  const estado = useRef({
    phi: PHI_MEDIO,
    theta: THETA_MEDIO,
    reloj: 0,
    ultimo: 0,
    arrastre: null as null | { x: number; y: number; phi: number; theta: number },
    /** Inclinación a la que vuelve el globo mientras gira: la de reposo, o la que dejó quien lo arrastró. */
    inclinacion: THETA_GIRO,
    abierto: false,
    quieto: false,
    revelado: 0,
    vistoAt: 0,
  });
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const arco = arcoRef.current;
    const contenedor = contenedorRef.current;
    if (!canvas || !arco || !contenedor) return;
    const s = estado.current;
    s.quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (s.quieto) s.revelado = 1;

    const tierra: Tierra | null = crearTierra(canvas, "/assets/mision/tierra.webp");
    let frame = 0;
    let ancho = 0;
    let dpr = 1;

    const crear = () => {
      ancho = contenedor.offsetWidth;
      if (!ancho) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      arco.width = ancho * dpr;
      arco.height = ancho * dpr;
      tierra?.redimensionar(ancho * dpr);
    };

    const dibujarArco = (phi: number, theta: number) => {
      const ctx = arco.getContext("2d");
      if (!ctx) return;
      const lado = arco.width;
      ctx.clearRect(0, 0, lado, lado);
      const hasta = Math.max(2, Math.round(ARCO.length * s.revelado));
      const puntos = ARCO.slice(0, hasta).map((p) => proyectar(p, phi, theta));
      const inicio = puntos[0];
      const fin = puntos[puntos.length - 1];
      const gradiente = ctx.createLinearGradient(inicio.x * lado, inicio.y * lado, fin.x * lado, fin.y * lado);
      gradiente.addColorStop(0, "rgba(255,255,255,0.95)");
      gradiente.addColorStop(1, AMARILLO);
      ctx.strokeStyle = gradiente;
      ctx.lineWidth = 2.5 * dpr;
      ctx.lineCap = "round";
      // Trazo punteado que avanza hacia el destino, como un viaje en camino.
      ctx.setLineDash([7 * dpr, 7 * dpr]);
      ctx.lineDashOffset = s.quieto ? 0 : -s.reloj * 0.6 * dpr;
      ctx.beginPath();
      let enTrazo = false;
      for (const punto of puntos) {
        if (!punto.visible) { enTrazo = false; continue; }
        if (enTrazo) ctx.lineTo(punto.x * lado, punto.y * lado);
        else ctx.moveTo(punto.x * lado, punto.y * lado);
        enTrazo = true;
      }
      // Primero un trazo oscuro más ancho, así la flecha se lee sobre el mar y sobre cualquier continente.
      ctx.strokeStyle = OSCURO;
      ctx.lineWidth = 6.5 * dpr;
      ctx.stroke();
      ctx.strokeStyle = gradiente;
      ctx.lineWidth = 3 * dpr;
      ctx.stroke();
      ctx.setLineDash([]);

      // Punto de partida.
      if (inicio.visible) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = OSCURO;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.arc(inicio.x * lado, inicio.y * lado, 5.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Punta de flecha cuando el trazo llega al destino.
      if (s.revelado >= 1 && fin.visible) {
        const previo = puntos[puntos.length - 4] ?? inicio;
        const angulo = Math.atan2(fin.y - previo.y, fin.x - previo.x);
        const largo = 16 * dpr;
        ctx.fillStyle = AMARILLO;
        ctx.strokeStyle = OSCURO;
        ctx.lineWidth = 2 * dpr;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(fin.x * lado, fin.y * lado);
        ctx.lineTo(fin.x * lado - largo * Math.cos(angulo - 0.45), fin.y * lado - largo * Math.sin(angulo - 0.45));
        ctx.lineTo(fin.x * lado - largo * Math.cos(angulo + 0.45), fin.y * lado - largo * Math.sin(angulo + 0.45));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    };

    const ubicar = (el: HTMLElement | null, p: Vec, phi: number, theta: number) => {
      if (!el) return null;
      const pos = proyectar(p, phi, theta);
      el.style.left = `${pos.x * 100}%`;
      el.style.top = `${pos.y * 100}%`;
      el.style.opacity = pos.visible ? "1" : "0";
      return pos;
    };

    const tick = (ahora: number) => {
      const dt = s.ultimo ? Math.min(0.1, (ahora - s.ultimo) / 1000) : 0;
      s.ultimo = ahora;
      if (s.vistoAt && s.revelado < 1) s.revelado = Math.min(1, (ahora - s.vistoAt) / 1600);
      if (s.abierto) {
        // Con la tarjeta abierta, el país queda de frente.
        s.phi += delta(s.phi, PHI_PAIS) * Math.min(1, dt * 4);
        s.theta += (THETA_PAIS - s.theta) * Math.min(1, dt * 4);
      } else if (!s.quieto && !s.arrastre) {
        s.reloj += dt * 60;
        s.phi += VELOCIDAD * dt;
        s.theta += (s.inclinacion - s.theta) * Math.min(1, dt * 1.5);
      }
      const { phi, theta } = s;
      tierra?.dibujar(phi, theta);
      dibujarArco(phi, theta);

      ubicar(origenRef.current, escalar(V_ORIGEN, 0.8 + ELEVACION), phi, theta);
      const punto = puntoRef.current;
      const pos = ubicar(punto, escalar(V_DESTINO, 0.8 + ELEVACION), phi, theta);
      if (punto && pos) {
        punto.style.pointerEvents = pos.visible ? "auto" : "none";
        // La etiqueta va hacia el lado del globo que tiene lugar, para que no se corte contra el borde.
        punto.dataset.lado = pos.x > 0.5 ? "izq" : "der";
        punto.tabIndex = pos.visible ? 0 : -1;
      }
      frame = requestAnimationFrame(tick);
    };

    crear();
    setListo(true);
    frame = requestAnimationFrame(tick);
    const resize = new ResizeObserver(() => {
      if (contenedor.offsetWidth !== ancho) crear();
    });
    resize.observe(contenedor);
    // La flecha se dibuja recién cuando el globo aparece en pantalla.
    const visto = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !s.vistoAt) s.vistoAt = performance.now();
    }, { threshold: 0.35 });
    visto.observe(contenedor);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visto.disconnect();
      tierra?.destruir();
    };
  }, []);

  const alternar = useCallback(() => {
    const nuevo = !estado.current.abierto;
    estado.current.abierto = nuevo;
    setAbierto(nuevo);
  }, []);

  const cerrar = useCallback(() => {
    estado.current.abierto = false;
    setAbierto(false);
  }, []);

  // Se cierran con Escape o tocando afuera.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") cerrar(); };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (document.getElementById("mision-fotos")?.contains(target) || puntoRef.current?.contains(target)) return;
      cerrar();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [abierto, cerrar]);

  return (
    <section
      aria-labelledby="mision-titulo"
      className="relative isolate overflow-hidden text-white"
      style={{
        backgroundColor: "#220c04",
        backgroundImage: "url('/assets/header/headerbg.webp')",
        backgroundSize: "520px",
        backgroundBlendMode: "soft-light",
      }}
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_50%,rgba(246,196,69,0.18),transparent_55%),linear-gradient(to_bottom,rgba(31,11,4,0.85),rgba(31,11,4,0.95))]" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-4 pb-24 pt-12 sm:px-6 sm:pb-32 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <FadeInSection>
          <div aria-hidden className="mb-5 flex items-center gap-2.5">
            {["#2e9e4f", "#d62828", "#ffffff", "#2563eb", AMARILLO].map((color, index) => (
              <span key={color} className="pop-in block h-3 w-3 rounded-full" style={{ backgroundColor: color, ["--d" as string]: `${index * 70}ms` }} />
            ))}
          </div>
          <h2 id="mision-titulo" className="pop-in m-0 text-balance text-left font-display text-[clamp(2.1rem,5.4vw,4rem)] font-extrabold leading-[1] tracking-[-0.03em] text-white" style={{ ["--d" as string]: "120ms" }}>
            Este {MISION_DEL_ANIO.anio} nuestro país amigo es <span className="text-[#f6c445]">{MISION_DEL_ANIO.pais}</span>
          </h2>
          <p className="pop-in m-0 mt-5 max-w-xl text-left text-base leading-relaxed text-white/80 sm:text-lg" style={{ ["--d" as string]: "240ms" }}>{MISION_DEL_ANIO.resumen}</p>
          <dl className="m-0 mt-7 grid max-w-md grid-cols-3 gap-3">
            {MISION_DEL_ANIO.datos.map((dato, index) => (
              <div key={dato.label} className="pop-in rounded-2xl bg-white/[0.07] px-3 py-3 ring-1 ring-white/10" style={{ ["--d" as string]: `${340 + index * 90}ms` }}>
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">{dato.label}</dt>
                <dd className="m-0 mt-1 font-display text-base font-extrabold leading-tight text-white sm:text-lg">{dato.valor}</dd>
              </div>
            ))}
          </dl>
        </FadeInSection>

        <FadeInSection delay={120}>
          <div ref={contenedorRef} className="globo-in relative mx-auto aspect-square w-full max-w-[560px]">
            <canvas
              ref={canvasRef}
              aria-hidden
              className={`h-full w-full cursor-grab touch-pan-y transition-opacity duration-1000 active:cursor-grabbing ${listo ? "opacity-100" : "opacity-0"}`}
              onPointerDown={(event) => {
                estado.current.arrastre = { x: event.clientX, y: event.clientY, phi: estado.current.phi, theta: estado.current.theta };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const arrastre = estado.current.arrastre;
                if (!arrastre) return;
                const ancho = event.currentTarget.offsetWidth || 1;
                estado.current.phi = arrastre.phi + ((event.clientX - arrastre.x) / ancho) * Math.PI;
                // Con el dedo, arrastrar hacia arriba o abajo desplaza la página; con mouse o lápiz inclina el globo.
                if (event.pointerType !== "touch") {
                  const theta = arrastre.theta + ((event.clientY - arrastre.y) / ancho) * Math.PI;
                  estado.current.theta = Math.max(-INCLINACION_MAX, Math.min(INCLINACION_MAX, theta));
                  estado.current.inclinacion = estado.current.theta;
                }
              }}
              onPointerUp={() => { estado.current.arrastre = null; }}
              onPointerCancel={() => { estado.current.arrastre = null; }}
            />
            <canvas ref={arcoRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

            <span ref={origenRef} aria-hidden className="pointer-events-none absolute z-10 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-bold text-white opacity-0 ring-1 ring-white/20 transition-opacity duration-300">
              {MISION_DEL_ANIO.origen.nombre}
            </span>

            <button
              ref={puntoRef}
              type="button"
              onClick={alternar}
              aria-expanded={abierto}
              aria-controls="mision-fotos"
              aria-label={`${MISION_DEL_ANIO.pais}: ${abierto ? "cerrar las fotos" : "ver fotos de los chicos"}`}
              className="group absolute z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden className="absolute inset-2 rounded-full bg-[#f6c445]/50 motion-safe:animate-ping" />
              <span aria-hidden className="relative h-4 w-4 rounded-full bg-[#f6c445] ring-[3px] ring-[#3a1508] shadow-[0_0_0_7px_rgba(255,255,255,0.55)] transition-transform duration-300 group-hover:scale-125" />
              <span aria-hidden className="pointer-events-none absolute left-full top-1/2 -ml-1 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-extrabold text-brand-deep shadow-lg ring-2 ring-[#3a1508] group-data-[lado=izq]:left-auto group-data-[lado=izq]:right-full group-data-[lado=izq]:-mr-1 group-data-[lado=izq]:ml-0">
                {MISION_DEL_ANIO.pais}
              </span>
            </button>

            {abierto && (
              <div ref={abanicoRef} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center [&>*]:pointer-events-auto">
                <TarjetaMision onCerrar={cerrar} />
              </div>
            )}
          </div>
        </FadeInSection>
      </div>
      <Ondas hacia="#fbf8f3" simple />
    </section>
  );
}

function TarjetaMision({ onCerrar }: { onCerrar: () => void }) {
  const fotos = MISION_DEL_ANIO.fotos.slice(0, 3);
  const video = MISION_DEL_ANIO.video;
  const [reproduciendo, setReproduciendo] = useState(false);

  return (
    <div
      id="mision-fotos"
      role="group"
      aria-label={`Fotos y video de ${MISION_DEL_ANIO.pais}`}
      className="w-[min(100%,26rem)] rounded-3xl bg-brand-paper p-3 text-brand-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/20 duration-500 ease-out animate-in fade-in-0 zoom-in-90 motion-reduce:animate-none sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="m-0 max-w-none text-left font-display text-lg font-extrabold leading-tight text-brand-ink">{MISION_DEL_ANIO.pais}</p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown transition-colors hover:bg-brand-brown hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      {fotos.length > 0 && (
        <div className="mb-4 flex justify-center px-1">
          {fotos.map((foto, index) => (
            <div key={foto.src} className="-mx-1.5 w-1/3" style={{ transform: `rotate(${[-7, 2, 8][index]}deg) translateY(${[4, -4, 3][index]}px)` }}>
              <figure
                className="m-0 rounded-[4px] bg-white p-1 pb-3 shadow-[0_10px_22px_-10px_rgba(0,0,0,0.6)] ring-1 ring-black/5 duration-500 ease-out animate-in fade-in-0 zoom-in-50 slide-in-from-bottom-4 fill-mode-both motion-reduce:animate-none sm:p-1.5 sm:pb-4"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <div className="aspect-[4/3] overflow-hidden rounded-[2px] bg-brand-brown/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getGoogleDriveProxyImageUrl(foto.src) ?? foto.src} alt={foto.alt} className="h-full w-full object-cover" />
                </div>
              </figure>
            </div>
          ))}
        </div>
      )}

      {video && (
        <>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            {reproduciendo ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}?start=${video.inicio}&autoplay=1&rel=0`}
                title={video.titulo}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : (
              // Hasta que se toca, solo se carga la miniatura: YouTube no recibe nada antes.
              <button type="button" onClick={() => setReproduciendo(true)} aria-label={`Reproducir: ${video.titulo}`} className="group block h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d62828] text-white shadow-lg transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </span>
                </span>
              </button>
            )}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}&t=${video.inicio}s`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-bold text-brand-brown no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
          >
            <ExternalLink size={15} aria-hidden />
            Abrir en YouTube
          </a>
        </>
      )}
    </div>
  );
}

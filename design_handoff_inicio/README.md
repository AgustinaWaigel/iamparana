# Handoff: Rediseño del Inicio — IAM Paraná

## Overview
Rediseño de la página de inicio del sitio de la **Infancia y Adolescencia Misionera
de Paraná** (Next.js App Router + Tailwind). Objetivos del pedido:

1. **Carrusel más chico y prolijo** — pasar de una banda casi a pantalla completa a
   una **banda contenida** (ancho máximo + más baja), con transición *fade* + *ken
   burns*, título sobre degradado elegante e indicadores con barra de progreso.
2. **Noticias con más relevancia** — pasar a ser **protagonistas**, a todo el ancho
   y arriba, con layout editorial (**nota destacada grande + lista lateral**).
3. **Agenda movida abajo**, como banda secundaria.
4. **Refresh visual** manteniendo la identidad marrón/dorado.

## About the Design Files
Los archivos en `maqueta/` son una **referencia de diseño hecha en HTML** (prototipo
con React + Babel + Tailwind CDN) que muestra el look & feel y las interacciones
buscadas. **No es código para copiar y pegar tal cual**: la tarea es **recrear ese
diseño dentro del codebase existente** (Next.js App Router, Server/Client Components,
Tailwind), respetando sus patrones, su fetching de datos y sus utilidades.

La carpeta `referencia-tsx/` contiene una **primera implementación drop-in** ya
escrita contra las funciones reales del repo. Sirve como punto de partida: hay que
terminar de igualarla a la maqueta (fuentes + tokens, ver abajo).

## Fidelity
**Alta (hifi).** Colores, tipografías, espaciados y transiciones son finales.
Recrear pixel-perfect usando las librerías/patrones del repo.

## Codebase — archivos a modificar
Rutas reales del repo (`src/app/...`):

| Componente | Ruta | Qué hace hoy |
|---|---|---|
| Carrusel (client) | `src/app/components/common/carousel.tsx` | Recibe `initialItems` de `listCarouselItems()`, imágenes vía `getGoogleDriveProxyImageUrl`, autoplay 6.5s, dots con progreso, `animate-kenburns`, `CarouselAdminTools`. |
| Noticias (server) | `src/app/components/common/novedades.tsx` | `await listNoticiasPreview()`, imágenes vía `getGoogleDriveImageUrl`, props `gridLayout` y `limit`. |
| Home | `src/app/page.tsx` | Server component. Hoy: Carrusel → separador → (Noticias + Agenda en flex lado a lado) → Áreas → Redes. |
| Agenda | `src/app/components/common/agenda.tsx` | Se mantiene; solo cambia su contenedor. |
| Tailwind | `tailwind.config.ts` | Define `brand.brown`. Faltan tokens nuevos (ver Design Tokens). |

## Screens / Views

### 1. Hero — Carrusel (banda contenida)
- **Layout**: contenedor centrado `max-w-6xl` con `px-4` y `mt-6`. Dentro, una caja
  `rounded-[26px]` con relación de aspecto **`aspect-[5/6]` (mobile) → `sm:aspect-[16/9]`
  → `md:aspect-[21/9]`** (antes era full-width `aspect-[21/8]`). `overflow-hidden`,
  `bg-stone-900`, sombra `0 24px 60px -20px rgba(58,21,8,0.5)`, `ring-1 ring-black/5`.
- **Slides**: cada uno `absolute inset-0`, crossfade con `transition-opacity
  duration-[900ms]`. Imagen `object-cover` + `animate-kenburns` solo en la activa.
- **Degradados** (tono marca, no negro): `from-[#3a1508] via-[#3a1508]/45 to-transparent`
  (vertical) + `from-[#3a1508]/70 via-transparent to-transparent` (horizontal).
- **Texto del slide activo**: ⚠️ va en una **capa ÚNICA con `key={active}`** (NO una
  por slide). Esto es el fix clave: al rotar, React remonta la capa y la animación
  `animate-in fade-in slide-in-from-bottom-3 duration-700` se redispara; el estado en
  reposo es visible (opacity 1). El bug original era usar una animación de una sola
  pasada por-slide, que dejaba el texto en opacity:0 al volver.
  - Título: `text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.04] text-balance`.
  - Bajada: `text-sm md:text-[15px] text-white/80 max-w-xl`.
  - Botón: pill blanco `rounded-full bg-white text-[#3a1508] px-6 py-2.5 text-sm font-black`,
    hover `-translate-y-0.5`.
- **Flechas**: `h-10 w-10 rounded-full bg-white/15 border-white/20 backdrop-blur`,
  ocultas y `opacity-0 group-hover:opacity-100`.
- **Indicadores**: barras `h-[3px]` (activa `w-30`, resto `w-12`), pista `bg-white/30`,
  progreso animado en **`#e3a92c`** (dorado), pasadas en `bg-white/60`.

### 2. Noticias (protagonistas, ancho completo)
- **Sección**: `max-w-6xl mx-auto px-4 py-12 md:py-16`.
- **Encabezado**: kicker `text-xs font-bold uppercase tracking-[0.2em] text-[#e3a92c]`
  "Lo último"; título `text-3xl md:text-4xl font-black text-stone-900`; a la derecha
  pill outline "Ver todas" → `/noticias`.
- **Grid editorial** (`gridLayout`): `grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8`.
  - **Destacada** (izq): card blanca `rounded-[24px]`, imagen arriba `h-[280px]
    sm:h-[340px] object-cover` (hover `scale-[1.05]`), cuerpo `p-7`: chip categoría
    (`bg-brand-brown/10 text-brand-brown` con punto dorado), título `text-2xl
    sm:text-[28px] font-black leading-[1.1] text-balance`, bajada `line-clamp-3`,
    link "Leer la nota" con flecha que se desplaza en hover.
  - **Lista** (der): contenedor `rounded-[24px] bg-[#f6f1ea]/70 p-3 ring-1
    ring-brand-brown/10`. Cada item: foto `h-[92px] w-[120px] rounded-xl` + categoría
    + título `text-[16.5px] font-bold line-clamp-3`. Separadores `h-px bg-brand-brown/10`.

### 3. Agenda (banda secundaria, abajo)
- **Sección**: fondo `bg-[#3a1508]` (marrón profundo), `py-14 md:py-16`,
  contenido `max-w-6xl mx-auto px-4`.
- **Encabezado** sobre oscuro: kicker dorado "Próximas fechas", título blanco
  "Agenda misionera", pill "Calendario completo" → `/calendario`.
- El componente `<Agenda />` se reusa tal cual, envuelto en card translúcida
  `bg-white/[0.04] ring-1 ring-white/10 backdrop-blur`. Si `<Agenda />` usa texto
  oscuro, agregarle una variante "clara" o mantener una card blanca interna.
- **En la maqueta** la agenda se muestra como grilla de 4 cards con chip de fecha
  cuadrado en dorado (`d` grande + mes). Ver `maqueta/app.jsx` componente `Agenda`.

## Interactions & Behavior
- Carrusel: autoplay 6500ms; pausa en hover (en la maqueta) / barra de progreso (en el
  repo); click en flechas y dots reinicia el intervalo; crossfade 900ms; ken burns en
  la imagen activa.
- Hover en cards de noticias: `-translate-y-1` + sombra mayor; imagen `scale`.
- Respetar `prefers-reduced-motion` (la maqueta gatea animaciones; en el repo el
  `tailwindcss-animate` ya lo respeta).

## State Management
- Sin cambios de estado nuevos. Carrusel mantiene `active` + `progress` (ya existentes).
- Los datos siguen viniendo de `listCarouselItems()` y `listNoticiasPreview()` en el
  Server Component `page.tsx` / `novedades.tsx`. No introducir fetching nuevo.

## Design Tokens
Sumar a `tailwind.config.ts → theme.extend`:

```ts
colors: {
  brand: {
    brown:  "#622d0d", // ya existe
    deep:   "#3a1508", // fondos oscuros / degradados
    gold:   "#e3a92c", // acento (kickers, progreso, puntos)
    cream:  "#f6f1ea", // fondos suaves de listas
    ink:    "#2c1d11", // texto principal
  },
},
fontFamily: {
  display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
  sans:    ['"Hanken Grotesk"', "system-ui", "sans-serif"],
},
```

**Para que quede IDÉNTICO a la maqueta** (lo que hoy difiere):
1. Cargar las fuentes **Bricolage Grotesque** (títulos) y **Hanken Grotesk** (texto)
   vía `next/font/google` en `layout.tsx` y aplicarlas (títulos `font-display`).
   La maqueta usa estas; el repo hoy usa `font-black` del sistema.
2. Reemplazar los hex sueltos (`#3a1508`, `#e3a92c`, `#f6f1ea`) por los tokens
   `brand-deep`, `brand-gold`, `brand-cream` una vez agregados.

- Radios: cards `rounded-[24px]`, carrusel `rounded-[26px]`, miniaturas `rounded-xl`.
- Sombras: cards `0 18px 44px -26px rgba(58,21,8,0.5)`; carrusel `0 24px 60px -20px rgba(58,21,8,0.5)`.

## Assets
En `maqueta/assets/` (son de muestra para el prototipo; en producción las imágenes
vienen de Google Drive vía los helpers del repo):
- `logo-iam-redondo.png`, `LOGOIAMPNA.svg`, `headerbg.webp` (textura del header).
- Fotos de ejemplo: `iam-santo-espiritu.webp`, `foto-francisco.png`, `campadol.png`,
  `cris-camargo.webp`, `fano.webp`.

## Files
- `maqueta/Inicio IAM Parana.html` — abrir en navegador para ver el diseño objetivo.
  - `maqueta/app.jsx` — todos los componentes del prototipo (Header, Carousel,
    Noticias con 3 variantes: `portada`/`grilla`/`lista`, Agenda, Footer) + panel de Tweaks.
  - `maqueta/data.jsx` — contenido de muestra.
- `referencia-tsx/carousel.tsx` — implementación drop-in (reemplaza el real).
- `referencia-tsx/novedades.tsx` — implementación drop-in (reemplaza el real).
- `referencia-tsx/page-seccion-noticias-agenda.tsx` — bloque a pegar en `page.tsx`.

## Capturas (`capturas/`)
- `01-carrusel.png` — banda contenida con degradado, título, botón e indicadores.
- `02-noticias.png` — sección Noticias (nota destacada + lista). En desktop (≥1024px)
  la lista va al costado derecho; en las capturas se apila por el ancho del render.
- `03-agenda.png` — banda Agenda en marrón profundo con cards de fecha.
> Nota: las capturas son orientativas. La **fuente de verdad visual** es
> `maqueta/Inicio IAM Parana.html` (abrir en navegador).

## Variantes (decisión de producto)
La maqueta permite 3 disposiciones de noticias (panel Tweaks, arriba a la derecha):
- **`portada`** (default elegido): destacada + lista lateral. → es la que está en `referencia-tsx`.
- **`grilla`**: 3 columnas de cards iguales.
- **`lista`**: destacada + filas anchas + sidebar.
Si el equipo prefiere otra, está toda en `maqueta/app.jsx` (función `Noticias`).

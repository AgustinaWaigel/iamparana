// Ondas de colores para el borde inferior de una sección: una capa por color, que se mecen
// despacio a destiempo. La última capa lleva el color de la sección que sigue, así se funden.

const MISIONEROS = ["#2e9e4f", "#d62828", "#ffffff", "#2563eb", "#f6c445"];

/** Una onda que arranca en la altura `y` (de 0 a 200) y rellena hasta abajo. */
function trazo(y: number, alto: number, largo: number, fase: number) {
  // Arranca bien a la izquierda del borde: así, al mecerse, nunca queda un hueco a la vista.
  const inicio = (fase % largo) - largo * 2;
  let d = `M ${inicio} ${y}`;
  for (let x = inicio; x < 1440 + largo * 2; x += largo) {
    d += ` Q ${x + largo / 4} ${y - alto} ${x + largo / 2} ${y} T ${x + largo} ${y}`;
  }
  return `${d} V 260 H ${inicio} Z`;
}

interface OndasProps {
  /** Color de la sección que viene después. */
  hacia: string;
  /** Solo la onda final, sin las capas de colores. */
  simple?: boolean;
  /** Va en el borde de arriba de la sección, dada vuelta; `hacia` es entonces el color de la sección anterior. */
  arriba?: boolean;
  className?: string;
}

export function Ondas({ hacia, simple = false, arriba = false, className = "" }: OndasProps) {
  const capas = simple ? [] : MISIONEROS;
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 240"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 w-full ${arriba ? "top-[-1px] -scale-y-100" : "bottom-[-1px]"} ${simple ? "h-10 sm:h-16" : "h-28 sm:h-44"} ${className}`}
    >
      {capas.map((color, index) => (
        <path
          key={color}
          className="onda"
          d={trazo(56 + index * 30, 36 - index * 3, 520 - index * 46, index * 137)}
          fill={color}
          style={{ ["--t" as string]: `${9 + index * 2.5}s`, ["--x" as string]: `${index % 2 ? -46 : 46}px` }}
        />
      ))}
      <path
        className={simple ? undefined : "onda"}
        d={simple ? "M0 150 C 240 230 480 70 720 122 C 960 174 1200 222 1440 114 V 240 H 0 Z" : trazo(202, 18, 300, 60)}
        fill={hacia}
        style={{ ["--t" as string]: "13s", ["--x" as string]: "34px" }}
      />
    </svg>
  );
}

// Cada persona de la cuenta familiar tiene un color y un círculo con su inicial, siempre los
// mismos en todas las pantallas: así se reconoce de un vistazo de quién se está hablando.

/** Colores misioneros y dos más, por si la familia es grande. El color sale del lugar en la lista. */
const COLORES = [
  { fondo: '#2e9e4f', texto: '#ffffff' },
  { fondo: '#d62828', texto: '#ffffff' },
  { fondo: '#2563eb', texto: '#ffffff' },
  { fondo: '#f6c445', texto: '#3a1508' },
  { fondo: '#7c3aed', texto: '#ffffff' },
  { fondo: '#ea580c', texto: '#ffffff' },
] as const;

export function colorPersona(indice: number) {
  return COLORES[((indice % COLORES.length) + COLORES.length) % COLORES.length];
}

const TAMANOS = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-11 w-11 text-lg',
  lg: 'h-14 w-14 text-2xl',
} as const;

interface PersonaAvatarProps {
  nombre: string;
  /** Lugar de la persona en la lista de la cuenta. */
  indice: number;
  size?: keyof typeof TAMANOS;
  className?: string;
}

export function PersonaAvatar({ nombre, indice, size = 'md', className = '' }: PersonaAvatarProps) {
  const color = colorPersona(indice);
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-extrabold ring-2 ring-white ${TAMANOS[size]} ${className}`}
      style={{ backgroundColor: color.fondo, color: color.texto }}
    >
      {nombre.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

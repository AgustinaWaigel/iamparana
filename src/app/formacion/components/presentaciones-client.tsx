'use client';

import { ReactNode } from 'react';
import { useSession } from '@/app/hooks/use-session';

// Envoltorio liviano para la sección de presentaciones; hoy solo renderiza contenido público.
interface PresentacionesClientProps {
  children: ReactNode;
}

export function PresentacionesClient({ children }: PresentacionesClientProps) {
  const { isAdmin } = useSession();

  return <>{children}</>;
}

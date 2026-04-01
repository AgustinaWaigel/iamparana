'use client';

import { ReactNode } from 'react';
import { useSession } from '@/app/hooks/use-session';

interface PresentacionesClientProps {
  children: ReactNode;
}

export function PresentacionesClient({ children }: PresentacionesClientProps) {
  const { isAdmin } = useSession();

  return <>{children}</>;
}

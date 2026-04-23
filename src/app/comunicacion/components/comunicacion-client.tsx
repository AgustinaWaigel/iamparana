'use client';

import { useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ComunicacionEditor } from './comunicacion-editor';
import { useSession } from '@/app/hooks/use-session';

interface ComunicacionClientProps {
  children: ReactNode;
}

export function ComunicacionClient({ children }: ComunicacionClientProps) {
  const router = useRouter();
  const { isAdmin } = useSession();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {children}
      <ComunicacionEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

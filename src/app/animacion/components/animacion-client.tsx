'use client';

import { ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/app/hooks/use-session';
import { AnimacionEditor } from './animacion-editor';

interface AnimacionClientProps {
  children: ReactNode;
}

export function AnimacionClient({ children }: AnimacionClientProps) {
  const router = useRouter();
  const { isAdmin, user } = useSession();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {children}
      <AnimacionEditor isAdmin={isAdmin || user?.areas?.includes('animacion') === true} onRefresh={handleRefresh} />
    </>
  );
}

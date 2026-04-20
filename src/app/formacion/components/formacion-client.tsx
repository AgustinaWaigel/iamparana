'use client';

import { ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FormacionEditor } from './formacion-editor';
import { useSession } from '@/app/hooks/use-session';

interface FormacionClientProps {
  children: ReactNode;
}

export function FormacionClient({ children }: FormacionClientProps) {
  const router = useRouter();
  const { isAdmin } = useSession();
  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {children}

      <FormacionEditor isAdmin={isAdmin} onRefresh={handleRefresh} />
    </>
  );
}

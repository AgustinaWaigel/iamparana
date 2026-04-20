'use client';

import { useSession } from '@/app/hooks/use-session';

export type UserRole = 'admin' | 'equipo' | 'redactor' | 'coordinador' | 'animador';

export type UserSession = {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function useSessionUser() {
  const { user, isLoading, isAdmin } = useSession();

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.replace('/');
    }
  };

  return {
    user: user as UserSession | null,
    loading: isLoading,
    logout,
    isAdmin,
    refreshSession: async () => undefined,
  };
}
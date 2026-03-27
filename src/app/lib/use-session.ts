'use client';

import { useEffect, useState } from 'react';

export type UserSession = {
  id: number;
  email: string;
  role: 'admin' | 'equipo' | 'redactor' | 'coordinador' | 'animador';
  isActive: boolean;
};

export function useSessionUser() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return { user, loading, logout };
}

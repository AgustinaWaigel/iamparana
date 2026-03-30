'use client';

import { useEffect, useState, useCallback } from 'react';

export type UserRole = 'admin' | 'equipo' | 'redactor' | 'coordinador' | 'animador';

export type UserSession = {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function useSessionUser() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // La respuesta es directamente el objeto de usuario
        if (data && typeof data === 'object' && 'id' in data) {
          setUser(data as UserSession);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      // Usamos replace para que no puedan volver atrás al panel con el botón del navegador
      window.location.replace('/');
    }
  };

  return { 
    user, 
    loading, 
    logout, 
    isAdmin: user?.role === 'admin',
    refreshSession: fetchUser 
  };
}
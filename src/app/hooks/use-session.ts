'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  nombre: string;
  role: string;
  isActive: boolean;
}

interface SessionState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAdmin: false,
  });

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const user: User = await response.json();
          setState({
            user,
            isLoading: false,
            isAdmin: user.role === 'admin',
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setState({
          user: null,
          isLoading: false,
          isAdmin: false,
        });
      }
    }

    fetchSession();
  }, []);

  return state;
}

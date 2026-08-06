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

let cachedSession: SessionState | null = null;
let sessionPromise: Promise<SessionState> | null = null;
const sessionListeners = new Set<(state: SessionState) => void>();

async function loadSession(): Promise<SessionState> {
  if (cachedSession) {
    return cachedSession;
  }

  if (!sessionPromise) {
    sessionPromise = fetch('/api/auth/me', {
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          return {
            user: null,
            isLoading: false,
            isAdmin: false,
          } satisfies SessionState;
        }

        const user: User | null = await response.json().catch(() => null);
        if (!user) {
          return {
            user: null,
            isLoading: false,
            isAdmin: false,
          } satisfies SessionState;
        }

        const normalizedRole = typeof user.role === 'string' ? user.role.toLowerCase() : '';
        return {
          user,
          isLoading: false,
          isAdmin: normalizedRole === 'admin' || normalizedRole === 'equipo' || normalizedRole === 'coordinador',
        } satisfies SessionState;
      })
      .catch((error) => {
        console.error('Failed to fetch session:', error);
        return {
          user: null,
          isLoading: false,
          isAdmin: false,
        } satisfies SessionState;
      })
      .then((state) => {
        cachedSession = state;
        sessionPromise = null;
        for (const listener of sessionListeners) {
          listener(state);
        }
        return state;
      });
  }

  return sessionPromise;
}

export async function refreshSession(): Promise<SessionState> {
  cachedSession = null;
  sessionPromise = null;
  return loadSession();
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    isLoading: true,
    isAdmin: false,
  });

  useEffect(() => {
    const listener = (nextState: SessionState) => setState(nextState);
    sessionListeners.add(listener);

    if (cachedSession) {
      setState(cachedSession);
    } else {
      loadSession().catch(() => undefined);
    }

    return () => {
      sessionListeners.delete(listener);
    };
  }, []);

  return state;
}

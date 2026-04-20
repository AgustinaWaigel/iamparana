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

        const user: User = await response.json();
        return {
          user,
          isLoading: false,
          isAdmin: user.role === 'admin',
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

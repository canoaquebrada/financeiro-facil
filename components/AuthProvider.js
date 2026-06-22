'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function refresh() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 403) {
          const data = await response.json();
          if (data.blocked) {
            if (mounted) {
              setUser(null);
              router.replace('/subscriptions');
            }
            return;
          }
        }
        if (!response.ok) {
          if (mounted) setUser(null);
          return;
        }
        const data = await response.json();
        if (mounted) setUser(data.user);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const authRoutes = ['/login', '/register', '/subscriptions'];
    if (!user && !authRoutes.includes(pathname)) {
      router.replace('/login');
    }

    if (user && authRoutes.includes(pathname)) {
      router.replace('/dashboard');
    }
  }, [loading, user, pathname, router]);

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    router.replace('/login');
  }

  const value = {
    user,
    loading,
    logout,
    refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}

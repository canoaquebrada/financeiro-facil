'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

function SubscriptionBadge() {
  const { user } = useAuth();
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/subscriptions/status', { credentials: 'include' })
      .then((res) => res.json())
      .then(setSubInfo)
      .catch(() => {});
  }, [user]);

  const days = subInfo?.daysRemaining;
  const plan = subInfo?.plan;
  const isUnlimited = days === null || days === undefined;
  const isPaid = plan && plan !== 'trial';
  const isExpired = subInfo?.status === 'paused' || (days !== null && days !== undefined && days === 0);

  if (subInfo && isPaid && !isExpired) {
    return (
      <div className="mb-3 block rounded-3xl bg-gradient-to-br from-blue-600 to-emerald-500 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Assinatura</p>
        <p className="mt-1 text-sm font-bold capitalize">{plan}</p>
      </div>
    );
  }

  let color;
  if (subInfo?.status === 'active' && (isUnlimited || days > 0)) {
    if (!isUnlimited && days <= 3) color = 'bg-amber-500';
    else color = 'bg-emerald-500';
  } else {
    color = 'bg-rose-500';
  }

  return (
    <Link
      href="/subscriptions"
      className={`mb-3 block rounded-3xl p-4 text-white transition ${subInfo ? 'hover:opacity-95' : ''} ${subInfo?.status === 'active' && (isUnlimited || days > 3) ? 'bg-gradient-to-br from-blue-600 to-emerald-500' : ''} ${!subInfo || (!isUnlimited && days <= 3) ? 'bg-slate-800 dark:bg-slate-800' : ''}`}
      style={!subInfo ? { background: '#1e293b' } : {}}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {subInfo ? (isExpired ? 'Assinatura' : isUnlimited ? 'Ilimitado' : 'Trial') : '...'}
        </p>
        {subInfo && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>
            {isExpired ? 'Expirado' : isUnlimited ? '∞' : `${days}d`}
          </span>
        )}
      </div>
        {subInfo && (
          <p className="mt-1 text-sm font-bold">
            {isExpired ? 'Renovar plano' : isUnlimited ? 'Acesso vitalício' : subInfo.timeRemaining}
          </p>
        )}
      {!subInfo && <p className="mt-1 text-sm font-bold">Carregando...</p>}
    </Link>
  );
}

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/transactions', label: 'Lançamentos', icon: '💸' },
  { href: '/reports', label: 'Relatórios', icon: '📈' },
  { href: '/notifications', label: 'Notificações', icon: '🔔' },
  { href: '/subscriptions', label: 'Assinatura', icon: '⭐' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
  { href: '/admin', label: 'Administrativo', icon: '🛡️', adminOnly: true },
  { href: '/admin/audit', label: 'Audit Log', icon: '📋', adminOnly: true }
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Lançamentos',
  '/reports': 'Relatórios',
  '/notifications': 'Notificações',
  '/subscriptions': 'Assinatura',
  '/settings': 'Configurações',
  '/admin': 'Administrativo',
  '/admin/audit': 'Audit Log'
};

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    const stored = localStorage.getItem('theme') || 'light';
    setTheme(stored);
    document.documentElement.classList.toggle('dark', stored === 'dark');
  }, [loading]);

  useEffect(() => {
    if (loading || !user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [loading, user]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="font-semibold">Carregando Financeiro Fácil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/30">
            F
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">Financeiro Fácil</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">SaaS financeiro</p>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <SubscriptionBadge />
          <button
            onClick={logout}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sair do sistema
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700"
            >
              Menu
            </button>
            <p className="text-sm font-bold">Financeiro Fácil</p>
            <button
              onClick={toggleTheme}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700"
            >
              {theme === 'dark' ? 'Claro' : 'Escuro'}
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div
              className="ml-auto flex h-full w-72 flex-col bg-white p-6 shadow-2xl dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="font-bold">Financeiro Fácil</p>
                <button onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-2 text-sm">
                  Fechar
                </button>
              </div>
              <nav className="space-y-1">
                {nav.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <button
                onClick={logout}
                className="mt-6 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700"
              >
                Sair do sistema
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Olá, <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{pageTitles[pathname] || 'Painel de controle'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/notifications"
                className="relative rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={toggleTheme}
                className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
              >
                Tema {theme === 'dark' ? 'claro' : 'escuro'}
              </button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

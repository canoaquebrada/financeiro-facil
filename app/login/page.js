'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

export default function LoginPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      if (response.status === 403 && data.blocked) {
        router.replace('/subscriptions');
        return;
      }
      setError(data.error || 'Não foi possível entrar.');
      return;
    }

    await refresh();
    router.replace('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[2rem] bg-white p-10 shadow-2xl shadow-blue-950/10 dark:bg-slate-900 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-xl font-bold text-white">
              F
            </div>
            <div>
              <h1 className="text-2xl font-bold">Financeiro Fácil</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Controle financeiro simples e moderno</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
            Organize suas finanças em minutos.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            Acompanhe entradas, saídas, contas a pagar, contas a receber e relatórios com uma interface limpa,
            responsiva e segura.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Dados separados', 'Cada usuário vê apenas suas informações.'],
              ['Tema claro/escuro', 'Escolha o visual preferido.'],
              ['Relatórios simples', 'Gráficos mensais e por categoria.']
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-blue-950/10 dark:bg-slate-900 sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-xl font-bold text-white">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold">Financeiro Fácil</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Entre para continuar</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Entrar</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Acesse sua conta para gerenciar suas finanças.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400"
                placeholder="voce@empresa.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Senha</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-400"
                placeholder="Sua senha"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-3 font-bold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 dark:text-blue-300 font-medium">
              Esqueceu sua senha?
            </Link>
          </p>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Não tem conta?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">
              Criar conta
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../components/AuthProvider';

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState('light');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
    setTheme(localStorage.getItem('theme') || 'light');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || 'Não foi possível salvar as configurações.');
      return;
    }

    setMessage('Configurações salvas com sucesso.');
    setPassword('');
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <h2 className="text-xl font-bold">Editar nome do usuário</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Atualize como seu nome aparece no sistema.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Nome</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Alterar senha</span>
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Deixe em branco para manter a atual"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <button
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-70"
            >
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <h2 className="text-xl font-bold">Aparência</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Escolha o tema claro ou escuro para a interface.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setTheme('light')}
              className={`rounded-3xl border p-5 text-left transition ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-500/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
              }`}
            >
              <span className="block text-lg font-bold">Tema claro</span>
              <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">Fundo branco e detalhes azuis.</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`rounded-3xl border p-5 text-left transition ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-500/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
              }`}
            >
              <span className="block text-lg font-bold">Tema escuro</span>
              <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">Fundo escuro para menos cansaço visual.</span>
            </button>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-5 dark:bg-slate-950">
            <p className="text-sm font-semibold">Conta atual</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Nome: <span className="font-medium text-slate-900 dark:text-white">{user?.name}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              E-mail: <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span>
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

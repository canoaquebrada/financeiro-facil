'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../components/AuthProvider';

const emptyForm = {
  name: '',
  color: '#2563eb'
};

export default function CategoriesPage() {
  const { loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function loadCategories() {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '50');

    const response = await fetch(`/api/categories?${params.toString()}`, { credentials: 'include' });
    const data = await response.json();
    if (response.ok) {
      setCategories(data.categories);
      setPages(data.pagination?.pages || 1);
    }
  }

  useEffect(() => {
    if (!authLoading) loadCategories();
  }, [page, authLoading]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const response = await fetch(editing ? `/api/categories/${editing.id}` : '/api/categories', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || 'Não foi possível salvar a categoria.');
      return;
    }

    setForm(emptyForm);
    setEditing(null);
    loadCategories();
  }

  async function removeCategory(id) {
    if (!window.confirm('Deseja realmente excluir esta categoria?')) return;

    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) loadCategories();
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <h2 className="text-xl font-bold">{editing ? 'Editar categoria' : 'Nova categoria'}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cadastre categorias para organizar seus lançamentos.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Nome</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex.: Consultoria"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Cor</span>
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-70"
              >
                {saving ? 'Salvando...' : 'Salvar categoria'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                    setError('');
                  }}
                  className="rounded-2xl border border-slate-200 px-5 py-3 font-bold dark:border-slate-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Categorias</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suas categorias ficam separadas por usuário.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-10 w-10 rounded-2xl"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{category.color}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(category);
                      setForm({ name: category.name, color: category.color });
                      setError('');
                    }}
                    className="rounded-xl px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!categories.length && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
              Nenhuma categoria cadastrada.
            </div>
          )}
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </section>
      </div>
    </AppShell>
  );
}

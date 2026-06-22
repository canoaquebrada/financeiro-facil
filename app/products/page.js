'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Modal from '../../components/Modal';
import ErrorBox from '../../components/ErrorBox';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../components/AuthProvider';
import { formatCurrency } from '../../lib/utils';

const emptyForm = {
  name: '',
  description: '',
  purchasePrice: '',
  salePrice: ''
};

export default function ProductsPage() {
  const { loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function loadProducts() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '20');

    const response = await fetch(`/api/products?${params.toString()}`, { credentials: 'include' });
    const data = await response.json();
    if (response.ok) {
      setProducts(data.products);
      setPages(data.pagination?.pages || 1);
    }
  }

  useEffect(() => {
    if (!authLoading) setPage(1);
  }, [search, authLoading]);

  useEffect(() => {
    if (!authLoading) loadProducts();
  }, [page, search, authLoading]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice)
    });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const response = await fetch(editing ? `/api/products/${editing.id}` : '/api/products', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || 'Não foi possível salvar o produto.');
      return;
    }

    setOpen(false);
    loadProducts();
  }

  async function removeProduct(id) {
    if (!window.confirm('Deseja realmente excluir este produto?')) return;

    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) loadProducts();
  }

  function getMarginColor(percent) {
    if (percent >= 40) return 'text-emerald-600';
    if (percent >= 20) return 'text-blue-600';
    if (percent >= 0) return 'text-amber-600';
    return 'text-rose-600';
  }

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold">Produtos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cadastre produtos com preço de compra e venda para calcular a margem de lucro.
            </p>
          </div>
          <button
            onClick={openNew}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-95"
          >
            Adicionar produto
          </button>
        </div>

        <div className="mt-5 flex gap-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 text-right font-semibold">Preço de compra</th>
                <th className="px-4 py-3 text-right font-semibold">Preço de venda</th>
                <th className="px-4 py-3 text-right font-semibold">Lucro</th>
                <th className="px-4 py-3 text-right font-semibold">Margem</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.description || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.purchasePrice)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(item.salePrice)}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(item.profit)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${getMarginColor(item.marginPercent)}`}>
                    {item.marginPercent}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeProduct(item.id)}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && (
          <div className="rounded-b-3xl border-t border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
            Nenhum produto encontrado. Clique em "Adicionar produto" para cadastrar.
          </div>
        )}
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar produto' : 'Novo produto'}
        subtitle="Informe nome, descrição, preço de compra e preço de venda."
      >
        <ErrorBox error={error} />
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Nome</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: Teclado Mecânico"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Descrição (opcional)</span>
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: Teclado RGB switch azul"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Preço de compra</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice}
              onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="0,00"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Preço de venda</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.salePrice}
              onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="0,00"
            />
          </label>

          {form.purchasePrice && form.salePrice && Number(form.salePrice) > 0 && (
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950 sm:col-span-2">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Lucro</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(Number(form.salePrice) - Number(form.purchasePrice))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Margem</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {((Number(form.salePrice) - Number(form.purchasePrice)) / Number(form.salePrice) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Markup</p>
                  <p className="text-lg font-bold text-violet-600">
                    {(Number(form.salePrice) / Number(form.purchasePrice || 1)).toFixed(2)}x
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-slate-200 px-5 py-3 font-bold dark:border-slate-700"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-70"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

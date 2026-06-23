'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import Modal from '../../components/Modal';
import ErrorBox from '../../components/ErrorBox';
import { useAuth } from '../../components/AuthProvider';
import { formatCurrency } from '../../lib/utils';

const emptyForm = { name: '', description: '', purchasePrice: '', salePrice: '' };

export default function ProductsPage() {
  const { loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const res = await fetch(`/api/products?${params}`, { credentials: 'include' });
    const data = await res.json();
    if (res.ok) setProducts(data.products);
  }

  useEffect(() => {
    if (authLoading) return;
    loadProducts();
  }, [search, authLoading]);

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
      description: product.description || '',
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

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      purchasePrice: form.purchasePrice,
      salePrice: form.salePrice
    };

    const res = await fetch(editing ? `/api/products/${editing.id}` : '/api/products', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao salvar produto.');
      return;
    }

    setOpen(false);
    loadProducts();
  }

  async function removeProduct(id) {
    if (!window.confirm('Deseja excluir este produto?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) loadProducts();
  }

  const marginPercent = (p) => {
    if (!p.salePrice || Number(p.salePrice) <= 0) return 0;
    return ((p.salePrice - p.purchasePrice) / p.salePrice) * 100;
  };

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Produtos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cadastre seus produtos para agilizar os lançamentos de vendas.
            </p>
          </div>
          <button
            onClick={openNew}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-95"
          >
            + Novo produto
          </button>
        </div>

        {/* Search */}
        <div className="mt-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500 dark:border-slate-800">
            {search
              ? 'Nenhum produto encontrado para esta busca.'
              : 'Nenhum produto cadastrado. Clique em "Novo produto" para começar.'}
          </div>
        )}

        {products.map((product) => {
          const margin = marginPercent(product);
          return (
            <div
              key={product.id}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Prices */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Custo</p>
                  <p className="mt-0.5 text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(product.purchasePrice)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Venda</p>
                  <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(product.salePrice)}
                  </p>
                </div>
              </div>

              {/* Margin bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Margem</span>
                  <span className={`font-bold ${margin >= 30 ? 'text-emerald-500' : margin >= 10 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {margin.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${margin >= 30 ? 'bg-emerald-500' : margin >= 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(margin, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(product)}
                  className="flex-1 rounded-2xl border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => removeProduct(product.id)}
                  className="flex-1 rounded-2xl border border-rose-200 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar produto' : 'Novo produto'}
        subtitle="Registre o nome, preços e descrição do produto."
      >
        <ErrorBox error={error} />
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Nome do produto</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: Camiseta Básica"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Descrição (opcional)</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: Camiseta 100% algodão, tamanho P"
              rows={2}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Preço de custo (R$)</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="0,00"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Preço de venda (R$)</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="0,00"
            />
          </label>
          {form.purchasePrice && form.salePrice && Number(form.salePrice) > 0 && (
            <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-700 sm:col-span-2 dark:bg-blue-950/20 dark:text-blue-300">
              📊 Margem de lucro:{' '}
              <strong>
                {((Number(form.salePrice) - Number(form.purchasePrice)) / Number(form.salePrice) * 100).toFixed(1)}%
              </strong>
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

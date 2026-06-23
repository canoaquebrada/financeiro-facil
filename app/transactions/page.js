'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import Modal from '../../components/Modal';
import ErrorBox from '../../components/ErrorBox';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../components/AuthProvider';
import { formatCurrency, formatDate } from '../../lib/utils';

const emptyForm = {
  type: 'entrada',
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  category: 'Outros',
  status: 'pago',
  dueDate: '',
  client: ''
};

export default function TransactionsPage() {
  const { loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: '', status: '', startDate: '', endDate: '' });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [quickType, setQuickType] = useState(null); // 'entrada' | 'saida' | null
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function loadTransactions() {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    params.set('page', String(page));
    params.set('limit', '20');

    const response = await fetch(`/api/transactions?${params.toString()}`, { credentials: 'include' });
    const data = await response.json();
    if (response.ok) {
      setTransactions(data.transactions);
      setPages(data.pagination?.pages || 1);
    }
  }

  async function loadCategories() {
    const response = await fetch('/api/categories', { credentials: 'include' });
    const data = await response.json();
    if (response.ok) setCategories(data.categories);
  }

  async function loadProducts() {
    const response = await fetch('/api/products', { credentials: 'include' });
    const data = await response.json();
    if (response.ok) setProducts(data.products);
  }

  useEffect(() => {
    if (authLoading) return;
    setPage(1);
  }, [filters, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    loadTransactions();
    loadCategories();
    loadProducts();
  }, [page, filters, authLoading]);

  function openNew(type) {
    setEditing(null);
    setQuickType(type);
    setForm({
      ...emptyForm,
      type,
      date: new Date().toISOString().slice(0, 10),
      category: categories[0]?.name || 'Outros'
    });
    setCustomCategory('');
    setError('');
    setOpen(true);
  }

  function handleProductSelect(productId) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setForm({
      ...form,
      type: 'entrada',
      description: `Venda de ${product.name}`,
      amount: String(product.salePrice),
      client: form.client
    });
  }

  function openEdit(transaction) {
    setEditing(transaction);
    setQuickType(transaction.type);
    setForm({
      type: transaction.type,
      description: transaction.description,
      amount: String(transaction.amount),
      date: transaction.date,
      category: transaction.category,
      status: transaction.status,
      dueDate: transaction.dueDate || '',
      client: transaction.client || ''
    });
    setCustomCategory('');
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const category = form.category === '__new' ? customCategory.trim() : form.category;
    const payload = { ...form, category, amount: form.amount };

    const response = await fetch(editing ? `/api/transactions/${editing.id}` : '/api/transactions', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || 'Não foi possível salvar o lançamento.');
      return;
    }

    setOpen(false);
    loadTransactions();
  }

  async function removeTransaction(id) {
    if (!window.confirm('Deseja realmente excluir este lançamento?')) return;
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok) loadTransactions();
  }

  const hasActiveFilters = filters.type || filters.status || filters.startDate || filters.endDate;

  return (
    <AppShell>
      {/* Hero + Quick Actions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Lançamentos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Registre entradas e saídas de forma rápida.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => openNew('entrada')}
            className="group rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left transition hover:border-emerald-300 hover:shadow-md dark:border-emerald-900 dark:from-emerald-950/20 dark:to-slate-900 dark:hover:border-emerald-700"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg dark:bg-emerald-800/50">
              💰
            </span>
            <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">Nova entrada</p>
            <p className="mt-0.5 text-xs text-emerald-500 dark:text-emerald-400">Recebimentos, vendas</p>
          </button>
          <button
            onClick={() => openNew('saida')}
            className="group rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 text-left transition hover:border-rose-300 hover:shadow-md dark:border-rose-900 dark:from-rose-950/20 dark:to-slate-900 dark:hover:border-rose-700"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-lg dark:bg-rose-800/50">
              💳
            </span>
            <p className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-300">Nova saída</p>
            <p className="mt-0.5 text-xs text-rose-500 dark:text-rose-400">Despesas, contas</p>
          </button>
        </div>

        {products.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Venda rápida</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setEditing(null);
                    setQuickType('entrada');
                    setForm({
                      ...emptyForm,
                      type: 'entrada',
                      description: `Venda de ${p.name}`,
                      amount: String(p.salePrice),
                      date: new Date().toISOString().slice(0, 10),
                      category: categories[0]?.name || 'Outros'
                    });
                    setCustomCategory('');
                    setError('');
                    setOpen(true);
                  }}
                  className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-left text-xs font-semibold transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
                >
                  <span className="text-emerald-600 dark:text-emerald-400">{p.name}</span>
                  <span className="ml-2 text-emerald-500">{formatCurrency(p.salePrice)}</span>
                </button>
              ))}
              {products.length > 6 && (
                <Link
                  href="/products"
                  className="shrink-0 rounded-2xl border border-dashed border-slate-300 px-4 py-2.5 text-xs text-slate-400 transition hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
                >
                  +{products.length - 6} mais
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="vencido">Vencido</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            onClick={() => setFilters({ type: '', status: '', startDate: '', endDate: '' })}
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Limpar{hasActiveFilters ? ' filtros' : ''}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.client || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.type === 'entrada'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                    }`}>
                      {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.category}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(item.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.displayStatus === 'pago'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                        : item.displayStatus === 'vencido'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    }`}>
                      {item.displayStatus}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    item.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
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
                        onClick={() => removeTransaction(item.id)}
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

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
          {transactions.map((item) => (
            <div key={item.id} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    item.type === 'entrada'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                  }`}>
                    {item.type === 'entrada' ? '↑' : '↓'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-sm font-bold ${
                    item.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.type === 'entrada'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                  }`}>
                    {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.displayStatus === 'pago'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                      : item.displayStatus === 'vencido'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  }`}>
                    {item.displayStatus}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(item.date)}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10">Editar</button>
                  <button onClick={() => removeTransaction(item.id)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">Excluir</button>
                </div>
              </div>
              {item.client && (
                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">Cliente: {item.client}</p>
              )}
            </div>
          ))}
        </div>

        {!transactions.length && (
          <div className="rounded-b-3xl border-t border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
            Nenhum lançamento encontrado.
          </div>
        )}
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar lançamento' : quickType === 'entrada' ? 'Nova entrada' : 'Nova saída'}
        subtitle="Preencha as informações abaixo."
      >
        <ErrorBox error={error} />
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {/* Type selector - simplified */}
          <div className="sm:col-span-2">
            <span className="text-sm font-semibold">Tipo</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'entrada' })}
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                  form.type === 'entrada'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                💰 Entrada
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'saida' })}
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                  form.type === 'saida'
                    ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-950/30 dark:text-rose-300'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                💳 Saída
              </button>
            </div>
          </div>

          {/* Product quick-select (only for entrada) */}
          {form.type === 'entrada' && products.length > 0 && !editing && (
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Produto (opcional — preenche automático)</span>
              <select
                value=""
                onChange={(e) => handleProductSelect(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Selecione um produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.salePrice)}</option>
                ))}
              </select>
            </label>
          )}

          {/* Client */}
          {form.type === 'entrada' && (
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Cliente (opcional)</span>
              <input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex.: João Silva"
              />
            </label>
          )}

          {/* Description */}
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Descrição</span>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder={form.type === 'entrada' ? 'Ex.: Venda de serviço' : 'Ex.: Conta de luz'}
            />
          </label>

          {/* Amount + Date */}
          <label className="block">
            <span className="text-sm font-semibold">Valor (R$)</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="0,00"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Data</span>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          {/* Vencimento (only if not pago) */}
          {form.status !== 'pago' && (
            <label className="block">
              <span className="text-sm font-semibold">Vencimento</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          )}

          {/* Category */}
          <label className="block">
            <span className="text-sm font-semibold">Categoria</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
              <option value="__new">+ Nova categoria</option>
            </select>
          </label>

          {/* Status */}
          <label className="block">
            <span className="text-sm font-semibold">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="pago">Pago ✅</option>
              <option value="pendente">Pendente ⏳</option>
              <option value="vencido">Vencido ❌</option>
            </select>
          </label>

          {/* New category input */}
          {form.category === '__new' && (
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Nome da nova categoria</span>
              <input
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex.: Consultoria"
              />
            </label>
          )}

          {/* Actions */}
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

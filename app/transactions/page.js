'use client';

import { useEffect, useState } from 'react';
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

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10), category: categories[0]?.name || 'Outros' });
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
      amount: String(product.salePrice)
    });
  }

  function openEdit(transaction) {
    setEditing(transaction);
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

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold">Lançamentos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Cadastre entradas e saídas, edite registros e filtre por data ou tipo.
            </p>
          </div>
          <button
            onClick={openNew}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-95"
          >
            Adicionar lançamento
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950 md:grid-cols-5">
          <select
            value={filters.type}
            onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="vencido">Vencido</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            onClick={() => setFilters({ type: '', status: '', startDate: '', endDate: '' })}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
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
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.type === 'entrada'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                      }`}
                    >
                      {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.category}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(item.date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.displayStatus === 'pago'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                          : item.displayStatus === 'vencido'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      }`}
                    >
                      {item.displayStatus}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      item.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
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
        {!transactions.length && (
          <div className="rounded-b-3xl border-t border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
            Nenhum lançamento encontrado.
          </div>
        )}
        <Pagination page={page} pages={pages} onPageChange={setPage} />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar lançamento' : 'Novo lançamento'}
        subtitle="Preencha as informações do registro."
      >
        <ErrorBox error={error} />
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Tipo</span>
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Produto (opcional)</span>
            <select
              value=""
              onChange={(event) => handleProductSelect(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Nenhum</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {formatCurrency(product.salePrice)}
                </option>
              ))}
            </select>
          </label>
          {form.type === 'entrada' && (
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Cliente (opcional)</span>
              <input
                value={form.client}
                onChange={(event) => setForm({ ...form, client: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex.: Empresa ABC"
              />
            </label>
          )}
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Descrição</span>
            <input
              required
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: Venda de serviço"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Valor</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
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
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          {form.status !== 'pago' && (
            <label className="block">
              <span className="text-sm font-semibold">Vencimento</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-semibold">Categoria</span>
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
              <option value="__new">+ Nova categoria</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="vencido">Vencido</option>
            </select>
          </label>
          {form.category === '__new' && (
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">Nome da nova categoria</span>
              <input
                required
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Ex.: Consultoria"
              />
            </label>
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

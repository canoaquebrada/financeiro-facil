'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '../../components/AppShell';
import Modal from '../../components/Modal';
import ErrorBox from '../../components/ErrorBox';
import { useAuth } from '../../components/AuthProvider';
import { formatDate } from '../../lib/utils';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  subscriptionPlan: 'trial',
  subscriptionDays: ''
};

const PLAN_LABELS = {
  trial: 'Trial',
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
  lifetime: 'Vitalício'
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  async function loadUsers() {
    const response = await fetch('/api/admin/users', { credentials: 'include' });
    if (response.status === 403) return;
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadUsers();
  }, [authLoading]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      subscriptionPlan: u.subscriptionPlan || 'trial',
      subscriptionDays: ''
    });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users';
    const method = editing ? 'PUT' : 'POST';
    const payload = { ...form };
    if (!payload.subscriptionDays) delete payload.subscriptionDays;
    if (editing && !payload.password) delete payload.password;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || 'Não foi possível salvar.');
      return;
    }

    setOpen(false);
    loadUsers();
  }

  async function toggleUserStatus(u) {
    if (u.id === user?.id) {
      alert('Você não pode pausar seu próprio usuário.');
      return;
    }

    const newStatus = u.status === 'active' ? 'paused' : 'active';
    const response = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || 'Não foi possível alterar o status.');
      return;
    }

    loadUsers();
  }

  async function removeUser(id) {
    if (!window.confirm('Deseja realmente excluir este usuário? Todos os dados dele serão perdidos.')) return;

    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.error || 'Não foi possível excluir.');
      return;
    }

    loadUsers();
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const filteredSortedUsers = useMemo(() => {
    let list = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    if (filterRole) list = list.filter((u) => u.role === filterRole);
    if (filterStatus) list = list.filter((u) => u.status === filterStatus);
    if (filterPlan) list = list.filter((u) => u.subscriptionPlan === filterPlan);

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return list;
  }, [users, search, filterRole, filterStatus, filterPlan, sortField, sortDir]);

  function SortIcon({ field }) {
    if (sortField !== field) return <span className="ml-1 text-slate-300 dark:text-slate-600">↕</span>;
    return <span className="ml-1 text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (!authLoading && user && user.role !== 'admin') {
    return (
      <AppShell>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-lg font-bold text-rose-600">Acesso restrito</p>
          <p className="mt-2 text-slate-500">Você não tem permissão para acessar esta página.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Administrativo</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie usuários e assinaturas do sistema.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] hover:opacity-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo usuário
        </button>
      </div>

      {/* User count summary bar */}
      <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span>
          <strong className="text-slate-800 dark:text-white">{users.length}</strong> total
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span>
          <strong className="text-emerald-600">{users.filter((u) => u.status === 'active').length}</strong> ativos
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span>
          <strong className="text-rose-600">{users.filter((u) => u.status === 'paused').length}</strong> pausados
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span>
          <strong className="text-violet-600">{users.filter((u) => u.role === 'admin').length}</strong> admins
        </span>
      </div>

      {/* User Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Filters */}
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="">Todos</option>
                <option value="user">Usuários</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="">Status</option>
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
              </select>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <option value="">Plano</option>
                <option value="trial">Trial</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
                <option value="lifetime">Vitalício</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="cursor-pointer px-4 py-3 font-semibold" onClick={() => toggleSort('name')}>
                  Nome <SortIcon field="name" />
                </th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="cursor-pointer px-4 py-3 font-semibold" onClick={() => toggleSort('subscriptionPlan')}>
                  Assinatura <SortIcon field="subscriptionPlan" />
                </th>
                <th className="cursor-pointer px-4 py-3 font-semibold" onClick={() => toggleSort('createdAt')}>
                  Cadastro <SortIcon field="createdAt" />
                </th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSortedUsers.map((u) => (
                <tr key={u.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        u.role === 'admin'
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      {u.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">
                        {PLAN_LABELS[u.subscriptionPlan] || u.subscriptionPlan || 'Nenhum'}
                      </span>
                      {u.subscriptionEnd && (
                        <span className={`text-[10px] ${
                          u.daysRemaining > 0 && u.daysRemaining <= 3
                            ? 'text-amber-500 font-semibold'
                            : u.daysRemaining <= 0 || u.daysRemaining === 0
                            ? 'text-rose-500 font-semibold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {u.timeRemaining || `${u.daysRemaining}d`}
                        </span>
                      )}
                      {u.subscriptionPlan === 'lifetime' && (
                        <span className="text-[10px] text-emerald-500 font-semibold">∞ Vitalício</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        disabled={u.id === user?.id}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-30 ${
                          u.status === 'active'
                            ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10'
                        }`}
                        title={u.id === user?.id ? 'Você não pode alterar seu próprio status' : ''}
                      >
                        {u.status === 'active' ? 'Pausar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeUser(u.id)}
                        disabled={u.id === user?.id}
                        className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        title={u.id === user?.id ? 'Você não pode excluir seu próprio usuário' : ''}
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
          {filteredSortedUsers.map((u) => (
            <div key={u.id} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.role === 'admin'
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    u.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    {u.status === 'active' ? 'Ativo' : 'Pausado'}
                  </span>
                </div>
              </div>

              {/* Subscription Card */}
              <div className={`mb-3 rounded-2xl border p-3 ${
                u.subscriptionPlan === 'lifetime'
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20'
                  : u.daysRemaining !== undefined && u.daysRemaining <= 0
                  ? 'border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-900/20'
                  : u.daysRemaining !== undefined && u.daysRemaining <= 3
                  ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20'
                  : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {u.subscriptionPlan === 'lifetime' ? '💎' : u.subscriptionPlan === 'trial' ? '🆓' : '⭐'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {PLAN_LABELS[u.subscriptionPlan] || u.subscriptionPlan || 'Nenhum'}
                      </p>
                      {u.subscriptionEnd && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Expira: {new Date(u.subscriptionEnd).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {u.subscriptionPlan === 'lifetime' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">∞ Vitalício</span>
                    )}
                    {u.subscriptionEnd && u.subscriptionPlan !== 'lifetime' && (
                      <span className={`text-[10px] font-bold ${
                        u.daysRemaining > 0 && u.daysRemaining <= 3
                          ? 'text-amber-600 dark:text-amber-400'
                          : u.daysRemaining <= 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {u.timeRemaining || `${u.daysRemaining}d`} restantes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Cadastro: {formatDate(u.createdAt)}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleUserStatus(u)}
                    disabled={u.id === user?.id}
                    className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition disabled:opacity-30 ${
                      u.status === 'active'
                        ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    {u.status === 'active' ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => openEdit(u)}
                    className="rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => removeUser(u.id)}
                    disabled={u.id === user?.id}
                    className="rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!filteredSortedUsers.length && (
          <div className="border-t border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
            {search || filterRole || filterStatus || filterPlan
              ? 'Nenhum usuário encontrado com esses filtros.'
              : 'Nenhum usuário cadastrado.'}
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Mostrando {filteredSortedUsers.length} de {users.length} usuário{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        subtitle={editing ? 'Altere os dados do usuário e sua assinatura.' : 'Cadastre um novo usuário no sistema.'}
      >
        <ErrorBox error={error} />
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Nome</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: João Silva"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">E-mail</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Ex.: joao@email.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Senha {editing ? '(deixe em branco para manter)' : ''}</span>
            <input
              type="password"
              minLength={editing ? 0 : 6}
              required={!editing}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo de 6 caracteres'}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Tipo de usuário</span>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          {/* Subscription section */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              📋 Gerenciar Assinatura
            </p>

            {editing && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Assinatura atual</p>
                <p className="mt-1 text-sm font-bold capitalize text-slate-900 dark:text-white">
                  {PLAN_LABELS[editing.subscriptionPlan] || editing.subscriptionPlan || 'Nenhum'}
                </p>
                {editing.subscriptionEnd && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editing.timeRemaining || `${editing.daysRemaining}d`} restantes
                  </p>
                )}
              </div>
            )}

            <label className="block">
              <span className="text-sm font-semibold">Plano</span>
              <select
                value={form.subscriptionPlan}
                onChange={(event) => setForm({ ...form, subscriptionPlan: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="trial">Trial</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
                <option value="lifetime">Vitalício</option>
              </select>
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-semibold">{editing ? 'Adicionar dias extras' : 'Dias de assinatura'}</span>
              <input
                type="number"
                min="0"
                value={form.subscriptionDays}
                onChange={(event) => setForm({ ...form, subscriptionDays: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder={editing ? 'Ex.: 30 para adicionar 30 dias' : 'Ex.: 30'}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3">
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

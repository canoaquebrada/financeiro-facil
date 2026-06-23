'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../components/AuthProvider';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard', { credentials: 'include' })
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      {/* Mobile quick stats row */}
      <section className="grid grid-cols-2 gap-3 md:hidden">
        {loading ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Entradas</p>
              <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">+ {formatCurrency(data?.cards?.entries)}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 dark:border-rose-800 dark:from-rose-950/30 dark:to-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Saídas</p>
              <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">- {formatCurrency(data?.cards?.exits)}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Saldo</p>
              <p className={`mt-1 text-lg font-bold ${(data?.cards?.balance || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {formatCurrency(data?.cards?.balance)}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 dark:border-violet-800 dark:from-violet-950/30 dark:to-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Lucro</p>
              <p className={`mt-1 text-lg font-bold ${(data?.cards?.profit || 0) >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {formatCurrency(data?.cards?.profit)}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pendentes</p>
              <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">{data?.cards?.pending || 0}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 dark:border-rose-800 dark:from-rose-950/30 dark:to-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Vencidos</p>
              <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">{data?.cards?.overdue || 0}</p>
            </div>
          </>
        )}
      </section>

      {/* Desktop stats grid */}
      <section className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Saldo atual"
          value={loading ? '...' : formatCurrency(data?.cards?.balance)}
          description="Entradas menos saídas pagas no mês."
          tone="blue"
        />
        <StatCard
          title="Total de entradas do mês"
          value={loading ? '...' : formatCurrency(data?.cards?.entries)}
          description="Lançamentos de entrada pagos."
          tone="green"
        />
        <StatCard
          title="Total de saídas do mês"
          value={loading ? '...' : formatCurrency(data?.cards?.exits)}
          description="Lançamentos de saída pagos."
          tone="red"
        />
        <StatCard
          title="Lucro do mês"
          value={loading ? '...' : formatCurrency(data?.cards?.profit)}
          description="Resultado mensal atual."
          tone="violet"
        />
        <StatCard
          title="Lançamentos pendentes"
          value={loading ? '...' : data?.cards?.pending}
          description="Transações com status pendente."
          tone="slate"
        />
        <StatCard
          title="Lançamentos vencidos"
          value={loading ? '...' : data?.cards?.overdue}
          description="Transações pendentes com data vencida."
          tone="red"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Lançamentos recentes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Últimos registros deste mês.</p>
            </div>
            <Link
              href="/transactions"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Ver lançamentos
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800">
              Carregando...
            </div>
          ) : data?.recentTransactions?.length ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Descrição</th>
                      <th className="px-4 py-3 font-semibold">Categoria</th>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.recentTransactions.map((item) => (
                      <tr key={item.id} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-3 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.category}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(item.date)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === 'pago'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            item.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                {data.recentTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        item.type === 'entrada'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                      }`}>
                        {item.type === 'entrada' ? '↑' : '↓'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.category}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(item.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          item.status === 'pago'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className={`text-xs font-bold ${
                        item.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800">
              Nenhum lançamento neste mês. Cadastre o primeiro em Lançamentos.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 to-emerald-500 p-6 text-white shadow-xl shadow-blue-950/20">
          <p className="text-sm font-medium text-blue-100">Usuário logado</p>
          <h2 className="mt-3 text-2xl font-bold">{user?.name}</h2>
          <p className="mt-2 text-sm text-blue-100">{user?.email}</p>
          <div className="mt-6 grid gap-3">
            <Link
              href="/transactions"
              className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              Adicionar lançamento
            </Link>
            <Link
              href="/reports"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Ver relatórios
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

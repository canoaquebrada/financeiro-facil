'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import AppShell from '../../components/AppShell';
import { formatCurrency } from '../../lib/utils';

function StatCard({ title, value, tone }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className={`mt-3 text-2xl font-bold ${tone || 'text-slate-950 dark:text-white'}`}>{formatCurrency(value)}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('transactions');

  useEffect(() => {
    fetch('/api/reports', { credentials: 'include' })
      .then((response) => response.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/export?type=${exportType}&format=csv`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'relatorio.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Análise financeira do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="transactions">Transações</option>
            <option value="categories">Por Categoria</option>
            <option value="monthly">Mensal</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Exportar CSV
              </>
            )}
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total de entradas" value={loading ? 0 : report?.totals?.entries} tone="text-emerald-600" />
        <StatCard title="Total de saídas" value={loading ? 0 : report?.totals?.exits} tone="text-rose-600" />
        <StatCard title="Lucro" value={loading ? 0 : report?.totals?.profit} tone="text-blue-600" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Gráfico mensal simples</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Últimos 6 meses.</p>
          </div>
          {loading || !report?.monthly?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-slate-800">
              Carregando gráfico...
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthly} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="entradas" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="saidas" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Gastos por categoria</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Saídas pagas agrupadas por categoria.</p>
          </div>
          {loading || !report?.categories?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
              Nenhum gasto por categoria encontrado.
            </div>
          ) : (
            <div className="space-y-4">
              {report.categories
                .slice()
                .sort((a, b) => b.valor - a.valor)
                .map((item) => {
                  const percent = Math.min(100, Math.round((item.valor / report.totals.exits) * 100));
                  return (
                    <div key={item.categoria}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold">{item.categoria}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.valor)}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

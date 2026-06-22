'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../components/AuthProvider';
import { formatCurrency } from '../../lib/utils';

function planLabel(plan) {
  const labels = { mensal: 'Mensal', trimestral: 'Trimestral', anual: 'Anual', lifetime: 'Vitalício', trial: 'Trial' };
  return labels[plan] || plan;
}

export default function SubscriptionsPage() {
  const { user, refresh } = useAuth();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState('');
  const [blocked, setBlocked] = useState(false);

  async function loadData() {
    setLoading(true);
    const [plansRes, statusRes] = await Promise.all([
      fetch('/api/subscriptions/plans'),
      fetch('/api/subscriptions/status', { credentials: 'include' })
    ]);
    if (plansRes.ok) {
      const data = await plansRes.json();
      setPlans(data.plans);
    }
    if (statusRes.ok) {
      const data = await statusRes.json();
      setStatus(data);
    } else if (statusRes.status === 403) {
      setBlocked(true);
      const data = await statusRes.json();
      setStatus({ status: 'paused', plan: 'expired', timeRemaining: 'Expirado' });
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handlePurchase(planId) {
    setPurchasing(true);
    setMessage('');

    const response = await fetch('/api/subscriptions/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
      credentials: 'include'
    });

    const data = await response.json();
    setPurchasing(false);

    if (!response.ok) {
      setMessage(data.error || 'Erro ao processar assinatura.');
      return;
    }

    setMessage(data.message);
    setBlocked(false);
    await loadData();
    await refresh();
  }

  const daysLeft = status?.daysRemaining;
  const showBlockedLayout = blocked || (!user && !loading);

  const plansSection = (
    <>
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Carregando...
        </div>
      ) : (
        <>
          {status?.plan && status?.plan !== 'trial' && status?.status === 'active' && !blocked ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Plano {planLabel(status.plan)} ativo</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sua assinatura está ativa. Aproveite todos os recursos do Financeiro Fácil!
              </p>
            </div>
          ) : (
            <>
              {blocked && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  Sua assinatura expirou. Escolha um plano abaixo para continuar usando o sistema.
                </div>
              )}

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Plano atual</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {status?.plan ? planLabel(status.plan) : 'nenhum'}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
                  <p className="mt-2 text-2xl font-bold capitalize text-slate-900 dark:text-white">
                    {status?.status === 'active' ? 'Ativo' : status?.status === 'paused' ? 'Pausado' : 'Expirado'}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tempo restante</p>
                  <p className={`mt-2 text-2xl font-bold ${daysLeft === null ? 'text-slate-900' : daysLeft <= 3 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {daysLeft === null ? 'Ilimitado' : status?.timeRemaining || `${daysLeft} dias`}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expira em</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {status?.subscriptionEnd
                      ? new Date(status.subscriptionEnd).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
              </div>

              {message && (
                <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                  message.includes('sucesso')
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl border bg-white p-6 shadow-sm transition dark:bg-slate-900 ${
                      plan.popular
                        ? 'border-blue-400 ring-2 ring-blue-200 dark:border-blue-500 dark:ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                        Mais popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
                      {formatCurrency(plan.price)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {plan.days} dias de acesso
                    </p>
                    <ul className="mt-5 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                            ✓
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePurchase(plan.id)}
                      disabled={purchasing}
                      className={`mt-6 w-full rounded-2xl px-5 py-3 font-bold transition disabled:opacity-50 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/20 hover:opacity-95'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {purchasing ? 'Processando...' : 'Assinar agora'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Precisa de ajuda ou quer renovar pelo suporte?
                </p>
                <a
                  href="https://wa.me/5585981827708?text=Ol%C3%A1!%20Quero%20renovar%20meu%20plano%20do%20Financeiro%20F%C3%A1cil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-green-500 px-6 py-3 font-bold text-white shadow-lg shadow-green-500/25 transition hover:bg-green-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Falar com suporte no WhatsApp
                </a>
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  if (showBlockedLayout) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
              F
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financeiro Fácil</h1>
          </div>
          {plansSection}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-bold">Planos e assinatura</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gerencie seu plano e veja os dias restantes da sua assinatura.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        {plansSection}
      </div>
    </AppShell>
  );
}

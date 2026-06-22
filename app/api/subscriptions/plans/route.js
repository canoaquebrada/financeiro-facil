import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PLANS = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 29.90,
    days: 30,
    popular: false,
    features: [
      'Acesso completo ao sistema',
      'Lançamentos ilimitados',
      'Contas a pagar e receber',
      'Relatórios e gráficos',
      'Produtos e controle de margem',
      'Suporte por e-mail'
    ]
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    price: 79.90,
    days: 90,
    popular: true,
    features: [
      'Tudo do plano Mensal',
      '3 meses de acesso',
      'Economia de R$ 9,80',
      'Suporte prioritário'
    ]
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 249.90,
    days: 365,
    popular: false,
    features: [
      'Tudo do plano Trimestral',
      '12 meses de acesso',
      'Economia de R$ 109,00',
      'Suporte VIP'
    ]
  }
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}

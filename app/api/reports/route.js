import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { requireLogin } from '../../../lib/api';

export const runtime = 'nodejs';

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('pt-BR', { month: 'short' });
}

function sum(rows) {
  return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
}

export async function GET(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, status: 'pago', deletedAt: null },
    orderBy: { date: 'asc' }
  });

  const totalEntries = sum(transactions.filter((item) => item.type === 'entrada'));
  const totalExits = sum(transactions.filter((item) => item.type === 'saida'));
  const profit = totalEntries - totalExits;

  const categoryExpenses = transactions
    .filter((item) => item.type === 'saida')
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

  const categories = Object.entries(categoryExpenses).map(([name, value]) => ({
    categoria: name,
    valor: Number(value.toFixed(2))
  }));

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: monthKey(date),
      label: monthLabel(date),
      date
    };
  });

  const monthly = months.map((month) => {
    const monthTransactions = transactions.filter(
      (item) => monthKey(item.date) === month.key
    );
    const entradas = sum(monthTransactions.filter((item) => item.type === 'entrada'));
    const saidas = sum(monthTransactions.filter((item) => item.type === 'saida'));
    return {
      mes: month.label,
      entradas: Number(entradas.toFixed(2)),
      saidas: Number(saidas.toFixed(2)),
      lucro: Number((entradas - saidas).toFixed(2))
    };
  });

  return NextResponse.json({
    totals: {
      entries: totalEntries,
      exits: totalExits,
      profit
    },
    categories,
    monthly
  });
}

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { endOfDay, requireActiveUser, startOfDay, today } from '../../../lib/api';

export const runtime = 'nodejs';

function sum(rows, field = 'amount') {
  return rows.reduce((total, row) => total + Number(row[field] || 0), 0);
}

export async function GET() {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const todayDate = today();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      date: {
        gte: firstDay,
        lte: lastDay
      }
    },
    orderBy: { date: 'desc' }
  });

  const entries = sum(
    transactions.filter((item) => item.type === 'entrada' && item.status === 'pago')
  );
  const exits = sum(
    transactions.filter((item) => item.type === 'saida' && item.status === 'pago')
  );

  const pending = transactions.filter((item) => item.status === 'pendente').length;
  const overdue = transactions.filter((item) => {
    if (item.status !== 'pendente') return false;
    if (!item.dueDate) return false;
    return startOfDay(item.dueDate) < todayDate;
  }).length;

  const recentTransactions = transactions
    .slice(0, 5)
    .map((item) => ({
      ...item,
      amount: Number(item.amount),
      date: item.date.toISOString().slice(0, 10)
    }));

  return NextResponse.json({
    cards: {
      balance: entries - exits,
      entries,
      exits,
      profit: entries - exits,
      pending,
      overdue
    },
    recentTransactions
  });
}

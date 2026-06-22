import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import {
  endOfDay,
  parseJson,
  requireLogin,
  serializeTransaction,
  toDateString
} from '../../../lib/api';
import { transactionSchema } from '../../../lib/validation';

export const runtime = 'nodejs';

export async function GET(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const client = searchParams.get('client');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
  const skip = (page - 1) * limit;

  const where = { userId: user.id, deletedAt: null };
  if (type === 'entrada' || type === 'saida') where.type = type;
  if (['pago', 'pendente', 'vencido'].includes(status)) where.status = status;
  if (client) where.client = { contains: client };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = toDateString(startDate);
    if (endDate) where.date.lte = endOfDay(toDateString(endDate));
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit
    }),
    prisma.transaction.count({ where })
  ]);

  return NextResponse.json({
    transactions: transactions.map(serializeTransaction),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}

export async function POST(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { type, description, amount, date, category, status, dueDate, client } = parsed.data;

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      type,
      description,
      amount,
      date: toDateString(date),
      category,
      status,
      dueDate: dueDate ? toDateString(dueDate) : null,
      client: client || null
    }
  });

  return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import {
  endOfDay,
  parseJson,
  requireLogin,
  serializeTransaction,
  toDateString
} from '../../../../lib/api';
import { transactionSchema } from '../../../../lib/validation';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null }
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ transaction: serializeTransaction(transaction) });
}

export async function PUT(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
  }

  const { type, description, amount, date, category, status, dueDate, client } = parsed.data;

  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      type, description, amount, date: toDateString(date), category, status,
      dueDate: dueDate ? toDateString(dueDate) : null,
      client: client || null
    }
  });

  return NextResponse.json({ transaction: serializeTransaction(updated) });
}

export async function DELETE(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
  }

  await prisma.transaction.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}

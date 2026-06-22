import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { parseJson, requireLogin, serializeCategory } from '../../../../lib/api';
import { categorySchema } from '../../../../lib/validation';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ category: serializeCategory(category) });
}

export async function PUT(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  }

  try {
    const updated = await prisma.category.update({
      where: { id: params.id },
      data: parsed.data
    });

    return NextResponse.json({ category: serializeCategory(updated) });
  } catch (err) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Esta categoria já existe.' }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!category) {
    return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  }

  await prisma.category.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}

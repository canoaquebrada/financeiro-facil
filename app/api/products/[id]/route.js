import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { parseJson, requireLogin, serializeProduct } from '../../../../lib/api';
import { productSchema } from '../../../../lib/validation';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
  }

  const { name, description, purchasePrice, salePrice } = parsed.data;

  if (salePrice <= 0) {
    return NextResponse.json({ error: 'O preco de venda deve ser maior que zero.' }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { name, description, purchasePrice, salePrice }
  });

  return NextResponse.json({ product: serializeProduct(updated) });
}

export async function DELETE(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const existing = await prisma.product.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}

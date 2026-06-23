import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { parseJson, requireLogin, serializeProduct } from '../../../../lib/api';
import { productSchema } from '../../../../lib/validation';
import { logAudit } from '../../../../lib/audit';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const existing = await prisma.product.findFirst({
    where: { id: params.id, userId: user.id, deletedAt: null }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
  }

  const body = await parseJson(request);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, description, purchasePrice, salePrice } = parsed.data;

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: { name, description, purchasePrice, salePrice }
  });

  await logAudit({
    userId: user.id,
    action: 'update',
    entity: 'product',
    entityId: updated.id,
    details: name
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

  await logAudit({
    userId: user.id,
    action: 'delete',
    entity: 'product',
    entityId: params.id,
    details: existing.name
  });

  return NextResponse.json({ ok: true });
}

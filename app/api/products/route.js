import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { parseJson, requireLogin, serializeProduct } from '../../../lib/api';
import { productSchema } from '../../../lib/validation';
import { logAudit } from '../../../lib/audit';

export const runtime = 'nodejs';

export async function GET(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const where = {
    userId: user.id,
    deletedAt: null,
    ...(search ? { name: { contains: search } } : {})
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ products: products.map(serializeProduct) });
}

export async function POST(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, description, purchasePrice, salePrice } = parsed.data;

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      name,
      description,
      purchasePrice,
      salePrice
    }
  });

  await logAudit({
    userId: user.id,
    action: 'create',
    entity: 'product',
    entityId: product.id,
    details: name
  });

  return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
}

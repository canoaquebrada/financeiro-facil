import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { parseJson, requireLogin, serializeProduct } from '../../../lib/api';
import { productSchema } from '../../../lib/validation';

export const runtime = 'nodejs';

export async function GET(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const skip = (page - 1) * limit;

  const where = { userId: user.id, deletedAt: null };
  if (search) {
    where.name = { contains: search };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit
    }),
    prisma.product.count({ where })
  ]);

  return NextResponse.json({
    products: products.map(serializeProduct),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}

export async function POST(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, description, purchasePrice, salePrice } = parsed.data;

  if (salePrice <= 0) {
    return NextResponse.json({ error: 'O prec-o de venda deve ser maior que zero.' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      name,
      description,
      purchasePrice,
      salePrice
    }
  });

  return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
}

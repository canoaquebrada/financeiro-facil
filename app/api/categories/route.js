import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { parseJson, requireLogin, serializeCategory } from '../../../lib/api';
import { categorySchema } from '../../../lib/validation';

export const runtime = 'nodejs';

export async function GET(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
  const skip = (page - 1) * limit;

  const where = { userId: user.id, deletedAt: null };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit
    }),
    prisma.category.count({ where })
  ]);

  return NextResponse.json({
    categories: categories.map(serializeCategory),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
}

export async function POST(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    const category = await prisma.category.create({
      data: { userId: user.id, ...parsed.data }
    });

    return NextResponse.json({ category: serializeCategory(category) }, { status: 201 });
  } catch (err) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Esta categoria já existe.' }, { status: 400 });
    }
    throw err;
  }
}

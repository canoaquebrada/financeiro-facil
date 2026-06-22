import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { requireActiveUser } from '../../../../lib/api';

export const runtime = 'nodejs';

export async function PUT() {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true }
  });

  return NextResponse.json({ ok: true });
}

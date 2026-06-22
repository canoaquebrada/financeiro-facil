import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { requireActiveUser } from '../../../../lib/api';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  const { id } = params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id }
  });

  if (!notification) {
    return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true }
  });

  return NextResponse.json({ notification: updated });
}

export async function DELETE(request, { params }) {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  const { id } = params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id }
  });

  if (!notification) {
    return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
  }

  await prisma.notification.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}

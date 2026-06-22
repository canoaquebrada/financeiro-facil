import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { requireActiveUser } from '../../../lib/api';
import { startOfDay, today } from '../../../lib/api';

export const runtime = 'nodejs';

export async function GET() {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false }
  });

  return NextResponse.json({
    notifications: notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString()
    })),
    unreadCount
  });
}

export async function POST() {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  const now = new Date();
  const todayDate = today();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      status: 'pendente'
    }
  });

  const notifications = [];

  for (const t of transactions) {
    if (!t.dueDate) continue;

    const dueDate = startOfDay(t.dueDate);
    const diffDays = Math.ceil((dueDate - todayDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'overdue',
          message: { contains: t.id }
        }
      });

      if (!existing) {
        notifications.push({
          userId: user.id,
          type: 'overdue',
          title: 'Pagamento Vencido',
          message: `A transação "${t.description}" (R$ ${Number(t.amount).toFixed(2)}) está vencida há ${Math.abs(diffDays)} dia(s).`
        });
      }
    } else if (diffDays <= 3) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'due_soon',
          message: { contains: t.id }
        }
      });

      if (!existing) {
        notifications.push({
          userId: user.id,
          type: 'due_soon',
          title: 'Pagamento Próximo do Vencimento',
          message: `A transação "${t.description}" (R$ ${Number(t.amount).toFixed(2)}) vence em ${diffDays} dia(s).`
        });
      }
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    });
  }

  return NextResponse.json({ created: notifications.length });
}

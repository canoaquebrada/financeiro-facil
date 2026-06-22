import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../../lib/db';
import { requireAdmin, daysRemaining, formatTimeRemaining } from '../../../../../lib/auth';
import { parseJson } from '../../../../../lib/api';
import { logAudit } from '../../../../../lib/audit';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      subscriptionPlan: true,
      subscriptionEnd: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          transactions: true,
          products: true,
          categories: true
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
      daysRemaining: daysRemaining(user.subscriptionEnd),
      timeRemaining: formatTimeRemaining(user.subscriptionEnd),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString()
    }
  });
}

export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const { id } = params;
  const body = await parseJson(request);
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined;
  const password = String(body.password || '');
  const role = body.role === 'admin' || body.role === 'user' ? body.role : undefined;
  const status = body.status === 'paused' || body.status === 'active' ? body.status : undefined;
  const subscriptionPlan = body.subscriptionPlan || undefined;
  const isLifetime = subscriptionPlan === 'lifetime';
  const PLAN_DEFAULT_DAYS = { trial: 3, mensal: 30, trimestral: 90, anual: 365 };

  if (name !== undefined && !name) {
    return NextResponse.json({ error: 'Informe o nome.' }, { status: 400 });
  }
  if (email !== undefined && !email) {
    return NextResponse.json({ error: 'Informe o e-mail.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  if (email) {
    const emailConflict = await prisma.user.findFirst({
      where: { email, NOT: { id } }
    });
    if (emailConflict) {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
    }
  }

  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;
  if (status !== undefined) data.status = status;
  if (subscriptionPlan) data.subscriptionPlan = subscriptionPlan;

  if (isLifetime) {
    data.subscriptionEnd = null;
    data.status = 'active';
  } else if (body.subscriptionDays !== undefined) {
    const days = parseInt(body.subscriptionDays, 10);
    if (days > 0) {
      const base = existing.subscriptionEnd && new Date(existing.subscriptionEnd) > new Date()
        ? new Date(existing.subscriptionEnd)
        : new Date();
      base.setDate(base.getDate() + days);
      data.subscriptionEnd = base;
      data.status = 'active';
    } else if (days === 0) {
      data.subscriptionEnd = null;
    }
  } else if (subscriptionPlan && PLAN_DEFAULT_DAYS[subscriptionPlan] && !existing.subscriptionEnd) {
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + PLAN_DEFAULT_DAYS[subscriptionPlan]);
    data.subscriptionEnd = subscriptionEnd;
    data.status = 'active';
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }
    data.password = await bcrypt.hash(password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      subscriptionPlan: true,
      subscriptionEnd: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const changes = [];
  if (name) changes.push('nome');
  if (email) changes.push('email');
  if (role) changes.push('função');
  if (status !== undefined) changes.push('status');
  if (subscriptionPlan) changes.push('plano');
  if (password) changes.push('senha');

  await logAudit({
    userId: admin.id,
    action: 'update',
    entity: 'user',
    entityId: id,
    details: `Atualizou ${changes.join(', ')} do usuário ${updated.name}`
  });

  return NextResponse.json({
    user: {
      ...updated,
      subscriptionEnd: updated.subscriptionEnd?.toISOString() || null,
      daysRemaining: daysRemaining(updated.subscriptionEnd),
      timeRemaining: formatTimeRemaining(updated.subscriptionEnd),
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString()
    }
  });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const { id } = params;

  if (id === admin.id) {
    return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  await logAudit({
    userId: admin.id,
    action: 'delete',
    entity: 'user',
    entityId: id,
    details: `Excluiu usuário ${user.name} (${user.email})`
  });

  return NextResponse.json({ ok: true });
}

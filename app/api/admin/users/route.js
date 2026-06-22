import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/db';
import { requireAdmin, daysRemaining, formatTimeRemaining } from '../../../../lib/auth';
import { parseJson } from '../../../../lib/api';
import { logAudit } from '../../../../lib/audit';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
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
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      subscriptionEnd: u.subscriptionEnd?.toISOString() || null,
      daysRemaining: daysRemaining(u.subscriptionEnd),
      timeRemaining: formatTimeRemaining(u.subscriptionEnd),
      createdAt: u.createdAt?.toISOString(),
      updatedAt: u.updatedAt?.toISOString()
    }))
  });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }

  const body = await parseJson(request);
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = body.role === 'admin' ? 'admin' : 'user';
  const status = body.status === 'paused' ? 'paused' : 'active';
  const subscriptionPlan = body.subscriptionPlan || 'trial';

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 });
  }

  const PLAN_DEFAULT_DAYS = { trial: 3, mensal: 30, trimestral: 90, anual: 365 };

  let subscriptionEnd = null;
  if (subscriptionPlan === 'lifetime') {
    subscriptionEnd = null;
  } else if (body.subscriptionDays) {
    const days = parseInt(body.subscriptionDays, 10);
    if (days > 0) {
      subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + days);
    }
  } else if (PLAN_DEFAULT_DAYS[subscriptionPlan]) {
    subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + PLAN_DEFAULT_DAYS[subscriptionPlan]);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      status,
      subscriptionPlan,
      subscriptionEnd,
      categories: {
        create: [
          { name: 'Vendas', color: '#2563eb' },
          { name: 'Serviços', color: '#059669' },
          { name: 'Marketing', color: '#d97706' },
          { name: 'Alimentação', color: '#dc2626' },
          { name: 'Transporte', color: '#7c3aed' },
          { name: 'Ferramentas', color: '#0891b2' },
          { name: 'Outros', color: '#64748b' }
        ]
      }
    },
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

  await logAudit({
    userId: admin.id,
    action: 'create',
    entity: 'user',
    entityId: user.id,
    details: `Criou usuário ${user.name} (${user.email})`
  });

  return NextResponse.json({
    user: {
      ...user,
      subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
      timeRemaining: user.subscriptionEnd ? formatTimeRemaining(user.subscriptionEnd) : null,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString()
    }
  }, { status: 201 });
}

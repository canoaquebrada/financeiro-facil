import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/db';
import { createSessionResponse, daysRemaining, formatTimeRemaining } from '../../../../lib/auth';
import { parseJson } from '../../../../lib/api';
import { loginSchema } from '../../../../lib/validation';
import { loginLimiter } from '../../../../lib/rateLimit';
import { logAudit } from '../../../../lib/audit';

export const runtime = 'nodejs';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = loginLimiter(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 }
    );
  }

  const body = await parseJson(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    if (user.status === 'paused') {
      return NextResponse.json(
        { error: 'Sua assinatura expirou. Renove para continuar usando o sistema.', blocked: true },
        { status: 403 }
      );
    }

    if (user.subscriptionEnd && new Date(user.subscriptionEnd) < new Date()) {
      await prisma.user.update({ where: { id: user.id }, data: { status: 'paused' } });
      return NextResponse.json(
        { error: 'Sua assinatura expirou. Renove para continuar usando o sistema.', blocked: true },
        { status: 403 }
      );
    }
  }

  return await createSessionResponse(user.id, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
      daysRemaining: daysRemaining(user.subscriptionEnd),
      timeRemaining: formatTimeRemaining(user.subscriptionEnd),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString()
    },
    _audit: await logAudit({
      userId: user.id,
      action: 'login',
      entity: 'auth',
      details: `Login realizado de ${user.email}`
    })
  });
}

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/db';
import { createSessionResponse } from '../../../../lib/auth';
import { parseJson } from '../../../../lib/api';
import { registerSchema } from '../../../../lib/validation';
import { DEFAULT_CATEGORIES } from '../../../../lib/defaults';
import { registerLimiter } from '../../../../lib/rateLimit';
import { logAudit } from '../../../../lib/audit';

export const runtime = 'nodejs';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = registerLimiter(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas de registro. Tente novamente mais tarde.' },
      { status: 429 }
    );
  }

  const body = await parseJson(request);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const role = process.env.ADMIN_EMAIL === email ? 'admin' : 'user';
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 3);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      subscriptionPlan: 'trial',
      subscriptionEnd: trialEnd,
      categories: {
        create: DEFAULT_CATEGORIES
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

  return await createSessionResponse(user.id, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString()
    },
    _audit: await logAudit({
      userId: user.id,
      action: 'register',
      entity: 'auth',
      details: `Conta criada para ${user.email}`
    })
  });
}

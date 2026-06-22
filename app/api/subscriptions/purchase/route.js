import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { parseJson, requireLogin } from '../../../../lib/api';
import { daysRemaining, formatTimeRemaining } from '../../../../lib/auth';

export const runtime = 'nodejs';

const PLANS = {
  mensal: { days: 30, name: 'Mensal' },
  trimestral: { days: 90, name: 'Trimestral' },
  anual: { days: 365, name: 'Anual' }
};

export async function POST(request) {
  const { error, user } = await requireLogin();
  if (error) return error;

  const body = await parseJson(request);
  const { plan: planId, paymentToken } = body;

  const plan = PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
  }

  if (!paymentToken) {
    return NextResponse.json({ error: 'Token de pagamento é obrigatório.' }, { status: 400 });
  }

  // TODO: Integrar com gateway de pagamento real (Stripe, PagSeguro, etc.)
  // Por enquanto, valida que o token não está vazio
  // Em produção, aqui seria feita a verificação com o provider de pagamento
  const isValidPayment = paymentToken && paymentToken.length > 0;
  if (!isValidPayment) {
    return NextResponse.json({ error: 'Pagamento não confirmado.' }, { status: 402 });
  }

  const now = new Date();
  const currentEnd = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
  let subscriptionEnd;

  if (currentEnd && currentEnd > now) {
    subscriptionEnd = new Date(currentEnd);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.days);
  } else {
    subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + plan.days);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'active',
      subscriptionPlan: planId,
      subscriptionEnd
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      subscriptionPlan: true,
      subscriptionEnd: true
    }
  });

  return NextResponse.json({
    success: true,
    message: `Assinatura ${plan.name} ativada com sucesso!`,
    subscriptionEnd: updated.subscriptionEnd?.toISOString(),
    daysRemaining: daysRemaining(updated.subscriptionEnd),
    timeRemaining: formatTimeRemaining(updated.subscriptionEnd)
  });
}

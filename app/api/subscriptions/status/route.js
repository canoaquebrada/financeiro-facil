import { NextResponse } from 'next/server';
import { requireLogin } from '../../../../lib/api';
import { daysRemaining, formatTimeRemaining } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const { error, user } = await requireLogin();
  if (error) return error;

  return NextResponse.json({
    status: user.status,
    plan: user.subscriptionPlan,
    subscriptionEnd: user.subscriptionEnd,
    daysRemaining: daysRemaining(user.subscriptionEnd),
    timeRemaining: formatTimeRemaining(user.subscriptionEnd)
  });
}

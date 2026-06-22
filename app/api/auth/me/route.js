import { NextResponse } from 'next/server';
import { requireUser, isSubscriptionExpired } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (isSubscriptionExpired(user)) {
    return NextResponse.json(
      { error: 'Sua assinatura expirou. Renove para continuar usando o sistema.', blocked: true },
      { status: 403 }
    );
  }

  return NextResponse.json({ user });
}

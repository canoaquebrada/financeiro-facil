import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { token } = params;

    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      select: { id: true, expiresAt: true, used: true }
    });

    if (!passwordReset) {
      return NextResponse.json({ valid: false, error: 'Token inválido.' }, { status: 400 });
    }

    if (passwordReset.used) {
      return NextResponse.json({ valid: false, error: 'Token já utilizado.' }, { status: 400 });
    }

    if (new Date() > passwordReset.expiresAt) {
      return NextResponse.json({ valid: false, error: 'Token expirado.' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json({ valid: false, error: 'Erro ao verificar token.' }, { status: 500 });
  }
}

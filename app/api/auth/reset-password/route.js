import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
    }

    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token }
    });

    if (!passwordReset) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    if (passwordReset.used) {
      return NextResponse.json({ error: 'Token já utilizado.' }, { status: 400 });
    }

    if (new Date() > passwordReset.expiresAt) {
      return NextResponse.json({ error: 'Token expirado. Solicite uma nova redefinição.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword }
    });

    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true }
    });

    return NextResponse.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro ao redefinir senha.' }, { status: 500 });
  }
}

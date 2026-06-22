import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET must be defined in environment variables');
}

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionEnd: user.subscriptionEnd?.toISOString() || null,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString()
  };
}

export function daysRemaining(subscriptionEnd) {
  if (!subscriptionEnd) return null;
  const now = new Date();
  const end = new Date(subscriptionEnd);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatTimeRemaining(subscriptionEnd) {
  if (!subscriptionEnd) return null;
  const now = new Date();
  const end = new Date(subscriptionEnd);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 'Expirado';

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0 && hours > 0) return `${days} dia${days !== 1 ? 's' : ''} e ${hours} hora${hours !== 1 ? 's' : ''}`;
  if (days > 0) return `${days} dia${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hora${hours !== 1 ? 's' : ''}`;
  return 'Menos de 1 hora';
}

export function isSubscriptionExpired(user) {
  if (user.role === 'admin') return false;
  if (user.status === 'paused') return true;
  if (!user.subscriptionEnd) return false;
  return new Date(user.subscriptionEnd) < new Date();
}

const SESSION_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30
};

async function signToken(userId) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function createSession(userId) {
  const token = await signToken(userId);
  cookies().set('session', token, SESSION_OPTIONS);
}

export async function createSessionResponse(userId, data) {
  const token = await signToken(userId);
  const response = NextResponse.json(data);
  response.cookies.set('session', token, SESSION_OPTIONS);
  return response;
}

export async function getSession() {
  const cookie = cookies().get('session')?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, secret);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  return getSession();
}

export async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== 'admin') return null;
  return user;
}

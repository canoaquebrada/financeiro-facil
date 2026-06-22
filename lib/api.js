import { NextResponse } from 'next/server';
import { requireUser, isSubscriptionExpired } from './auth';

export async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 });
}

export function blockedResponse() {
  return NextResponse.json(
    { error: 'Sua assinatura expirou. Renove para continuar usando o sistema.', blocked: true },
    { status: 403 }
  );
}

export async function requireLogin() {
  const user = await requireUser();
  if (!user) return { error: unauthorized() };
  return { user };
}

export async function requireActiveUser() {
  const user = await requireUser();
  if (!user) return { error: unauthorized() };
  if (isSubscriptionExpired(user)) return { error: blockedResponse() };
  return { user };
}

export function toNumber(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function toDateString(value) {
  if (!value) return new Date();
  const parts = String(value).split('-').map(Number);
  if (parts.length === 3 && parts.every((p) => !Number.isNaN(p))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function startOfDay(date) {
  const value = date instanceof Date ? date : new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function endOfDay(date) {
  const value = date instanceof Date ? date : new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

export function today() {
  return startOfDay(new Date());
}

export function serializeTransaction(transaction) {
  let displayStatus = transaction.status;
  if (transaction.dueDate && transaction.status === 'pendente') {
    const dueDate = startOfDay(transaction.dueDate);
    if (dueDate < today()) {
      displayStatus = 'vencido';
    }
  }
  return {
    ...transaction,
    amount: Number(transaction.amount),
    date: transaction.date.toISOString().slice(0, 10),
    dueDate: transaction.dueDate?.toISOString().slice(0, 10) || null,
    client: transaction.client || null,
    displayStatus,
    isOverdue: displayStatus === 'vencido',
    createdAt: transaction.createdAt?.toISOString(),
    updatedAt: transaction.updatedAt?.toISOString()
  };
}

export function serializeCategory(category) {
  return {
    ...category,
    createdAt: category.createdAt?.toISOString(),
    updatedAt: category.updatedAt?.toISOString()
  };
}

export function serializeProduct(product) {
  const purchasePrice = Number(product.purchasePrice);
  const salePrice = Number(product.salePrice);
  const profit = salePrice - purchasePrice;
  const marginPercent = salePrice > 0 ? (profit / salePrice) * 100 : 0;
  return {
    ...product,
    purchasePrice,
    salePrice,
    profit,
    marginPercent: Math.round(marginPercent * 100) / 100,
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString()
  };
}

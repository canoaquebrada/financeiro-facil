import { prisma } from './db';

export async function logAudit({ userId, action, entity, entityId, details }) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details || null
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return null;
  }
}

export function getAuditDescription(action, entity, details) {
  const descriptions = {
    'create': {
      'user': 'Criou um usuário',
      'transaction': 'Criou uma transação',
      'category': 'Criou uma categoria',
      'product': 'Criou um produto'
    },
    'update': {
      'user': 'Atualizou um usuário',
      'transaction': 'Atualizou uma transação',
      'category': 'Atualizou uma categoria',
      'product': 'Atualizou um produto'
    },
    'delete': {
      'user': 'Excluiu um usuário',
      'transaction': 'Excluiu uma transação',
      'category': 'Excluiu uma categoria',
      'product': 'Excluiu um produto'
    },
    'login': {
      'auth': 'Fez login no sistema'
    },
    'logout': {
      'auth': 'Fez logout do sistema'
    },
    'register': {
      'auth': 'Criou uma conta'
    },
    'password_change': {
      'auth': 'Alterou a senha'
    },
    'password_reset_request': {
      'auth': 'Solicitou redefinição de senha'
    },
    'password_reset': {
      'auth': 'Redefiniu a senha'
    },
    'subscription_change': {
      'subscription': 'Alterou plano de assinatura'
    }
  };

  const base = descriptions[action]?.[entity] || `${action} em ${entity}`;
  return details ? `${base}: ${details}` : base;
}

import { prisma } from '../../../../lib/db';
import { requireActiveUser, startOfDay, today } from '../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(request) {
  const { error, user } = await requireActiveUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'transactions';
  const format = searchParams.get('format') || 'csv';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let data = [];
  let filename = '';

  const where = {
    userId: user.id,
    deletedAt: null
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate + 'T23:59:59.999Z');
  }

  if (type === 'transactions') {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    data = transactions.map(t => ({
      'Data': t.date.toISOString().slice(0, 10),
      'Descrição': t.description,
      'Tipo': t.type === 'entrada' ? 'Entrada' : 'Saída',
      'Categoria': t.category,
      'Valor': Number(t.amount).toFixed(2),
      'Status': t.status,
      'Data Vencimento': t.dueDate?.toISOString().slice(0, 10) || '',
      'Cliente': t.client || ''
    }));

    filename = `transacoes_${new Date().toISOString().slice(0, 10)}`;
  } else if (type === 'categories') {
    const transactions = await prisma.transaction.findMany({
      where: { ...where, status: 'pago' },
      orderBy: { date: 'desc' }
    });

    const categoryMap = {};
    transactions.forEach(t => {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { entradas: 0, saidas: 0 };
      }
      if (t.type === 'entrada') {
        categoryMap[t.category].entradas += Number(t.amount);
      } else {
        categoryMap[t.category].saidas += Number(t.amount);
      }
    });

    data = Object.entries(categoryMap).map(([name, values]) => ({
      'Categoria': name,
      'Total Entradas': values.entradas.toFixed(2),
      'Total Saídas': values.saidas.toFixed(2),
      'Lucro': (values.entradas - values.saidas).toFixed(2)
    }));

    filename = `categorias_${new Date().toISOString().slice(0, 10)}`;
  } else if (type === 'monthly') {
    const transactions = await prisma.transaction.findMany({
      where: { ...where, status: 'pago' },
      orderBy: { date: 'asc' }
    });

    const monthlyMap = {};
    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { entradas: 0, saidas: 0 };
      }
      if (t.type === 'entrada') {
        monthlyMap[monthKey].entradas += Number(t.amount);
      } else {
        monthlyMap[monthKey].saidas += Number(t.amount);
      }
    });

    data = Object.entries(monthlyMap).map(([month, values]) => ({
      'Mês': month,
      'Total Entradas': values.entradas.toFixed(2),
      'Total Saídas': values.saidas.toFixed(2),
      'Lucro': (values.entradas - values.saidas).toFixed(2)
    }));

    filename = `mensal_${new Date().toISOString().slice(0, 10)}`;
  }

  if (format === 'csv') {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const csvWithBom = '\uFEFF' + csvContent;

    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    });
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}.json"`
    }
  });
}

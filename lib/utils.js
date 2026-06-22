export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value + (typeof value === 'string' && value.length === 10 ? 'T12:00:00' : ''));
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

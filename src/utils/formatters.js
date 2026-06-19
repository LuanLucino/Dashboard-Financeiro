import { format, parseISO, isToday, isTomorrow, isPast, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'dd/MM', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), 'MMM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export const getVencimentoLabel = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    if (isPast(date)) return 'Vencido';
    if (isThisWeek(date)) return 'Esta semana';
    if (isThisMonth(date)) return 'Este mês';
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
};

export const calcularPercentual = (atual, meta) => {
  if (!meta || meta === 0) return 0;
  return Math.min(100, Math.round((atual / meta) * 100));
};

export const getStatusColor = (status) => {
  const map = {
    'Recebido': 'success',
    'Pago': 'success',
    'Pendente': 'warning',
    'Não Pago': 'warning',
    'Vencido': 'danger',
  };
  return map[status] || 'muted';
};

export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const formatCompact = (value) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
};

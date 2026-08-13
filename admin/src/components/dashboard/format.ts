import type { DashboardDateValue } from '../../types/dashboard';

export function formatDashboardDate(value: DashboardDateValue) {
  const date = toDate(value);
  if (!date) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDashboardTime(value: DashboardDateValue) {
  const date = toDate(value);
  if (!date) return 'Sin hora';

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toDate(value: DashboardDateValue) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate() as Date;
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000);
  }
  return null;
}

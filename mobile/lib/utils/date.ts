import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return `Today ${format(d, 'hh:mm a')}`;
  if (isYesterday(d)) return `Yesterday ${format(d, 'hh:mm a')}`;
  return format(d, 'dd MMM yyyy');
}

export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDueDate(date: string | Date): { text: string; isOverdue: boolean; isUrgent: boolean } {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 2;
  let text: string;
  if (isOverdue) {
    text = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    text = 'Due today';
  } else if (diffDays === 1) {
    text = 'Due tomorrow';
  } else {
    text = `Due ${format(d, 'dd MMM')}`;
  }
  return { text, isOverdue, isUrgent };
}

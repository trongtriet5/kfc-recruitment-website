import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Chưa có';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Chưa có';
    return format(d, 'dd/MM/yyyy', { locale: vi });
  } catch (e) {
    return 'Chưa có';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Chưa có';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Chưa có';
    return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch (e) {
    return 'Chưa có';
  }
};

// Utility to join conditional classNames (shadcn/ui compatibility)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    APPROVED: 'text-success bg-success/10',
    REJECTED: 'text-error bg-error/10',
    PENDING: 'text-warning bg-warning/10',
    DRAFT: 'text-text-tertiary bg-surface-tertiary',
    FINALIZED: 'text-brand-600 bg-brand-50',
    PAID: 'text-success bg-success/10',
    ACTIVE: 'text-success bg-success/10',
    INACTIVE: 'text-text-tertiary bg-surface-tertiary',
    DELIVERED: 'text-brand-600 bg-brand-50',
    ON_HOLD: 'text-warning bg-warning/10',
    CANCELLED: 'text-error bg-error/10',
    TODO: 'text-text-tertiary bg-surface-tertiary',
    IN_PROGRESS: 'text-info bg-info/10',
    IN_REVIEW: 'text-warning bg-warning/10',
    DONE: 'text-success bg-success/10',
    CHECK_IN: 'text-success bg-success/10',
    CHECK_OUT: 'text-info bg-info/10',
    MANUALLY_OVERRIDDEN: 'text-warning bg-warning/10',
    LOW: 'text-text-tertiary bg-surface-tertiary',
    MEDIUM: 'text-info bg-info/10',
    HIGH: 'text-warning bg-warning/10',
    URGENT: 'text-error bg-error/10',
  };
  return map[status] ?? 'text-text-secondary bg-surface-tertiary';
}

export function getStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

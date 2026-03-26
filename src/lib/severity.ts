export type Severity = 'critical' | 'warning' | 'opportunity' | 'info';

export const severityConfig: Record<
  Severity,
  { dot: string; badge: string; text: string; bar: string; label: string }
> = {
  critical: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    text: 'text-red-600 dark:text-red-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-red-500',
    label: 'Critical'
  },
  warning: {
    dot: 'bg-amber-500',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-amber-500',
    label: 'Warning'
  },
  opportunity: {
    dot: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
    text: 'text-sky-600 dark:text-sky-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-sky-500',
    label: 'Opportunity'
  },
  info: {
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-400',
    bar: '[&_[data-slot=progress-indicator]]:bg-slate-500',
    label: 'Info'
  }
};

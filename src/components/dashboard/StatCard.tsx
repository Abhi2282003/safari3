import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      'card-stat rounded-xl border bg-card p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md',
      variant === 'success' && 'border-success/20',
      variant === 'warning' && 'border-warning/20',
      variant === 'destructive' && 'border-destructive/20'
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            'mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold tracking-tight truncate',
            variant === 'success' && 'text-success',
            variant === 'warning' && 'text-warning',
            variant === 'destructive' && 'text-destructive'
          )}>
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg shrink-0 ml-2',
          variant === 'default' && 'bg-primary/10 text-primary',
          variant === 'success' && 'bg-success/10 text-success',
          variant === 'warning' && 'bg-warning/10 text-warning',
          variant === 'destructive' && 'bg-destructive/10 text-destructive'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

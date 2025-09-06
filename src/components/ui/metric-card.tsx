import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  children?: ReactNode;
}

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  className, 
  children 
}: MetricCardProps) => {
  return (
    <Card className={cn("metric-card", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-primary ml-3">
            {icon}
          </div>
        )}
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </Card>
  );
};
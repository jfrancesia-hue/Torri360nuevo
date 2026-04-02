'use client';

import { Badge } from '@/components/ui/badge';
import { cn, PRIORITY_CONFIG } from '@/lib/utils';
import { Priority } from '@toori360/shared';
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react';

const PRIORITY_ICONS: Record<Priority, React.ReactNode> = {
  CRITICAL: <AlertTriangle className="w-3 h-3" />,
  HIGH: <ArrowUp className="w-3 h-3" />,
  MEDIUM: <Minus className="w-3 h-3" />,
  LOW: <ArrowDown className="w-3 h-3" />,
};

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium gap-1',
        config.className,
        size === 'sm' && 'text-xs px-2 py-0',
      )}
    >
      <span className={config.iconColor}>{PRIORITY_ICONS[priority]}</span>
      {config.label}
    </Badge>
  );
}

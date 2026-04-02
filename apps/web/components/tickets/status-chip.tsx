'use client';

import { Badge } from '@/components/ui/badge';
import { cn, STATUS_CONFIG } from '@/lib/utils';
import { TicketStatus } from '@toori360/shared';

interface StatusChipProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium gap-1.5',
        config.className,
        size === 'sm' && 'text-xs px-2 py-0',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      {config.label}
    </Badge>
  );
}

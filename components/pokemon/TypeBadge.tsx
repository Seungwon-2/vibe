import { Badge } from '@/components/ui/badge';
import { POKEMON_TYPE_LABELS, POKEMON_TYPE_COLORS } from '@/const/pokemon';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const label = POKEMON_TYPE_LABELS[type] ?? type;
  const colorClass = POKEMON_TYPE_COLORS[type] ?? 'bg-gray-400';

  return (
    <Badge className={cn(colorClass, 'border-none text-white', className)}>{label}</Badge>
  );
}

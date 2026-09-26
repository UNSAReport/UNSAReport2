import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ChecklistItem {
  task: string;
  status: 'completed' | 'in-progress' | 'pending';
  assignedTo?: string;
}

export interface ListChecklistProps {
  tag?: string;
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
}

/**
 * Lista de verificación de requerimientos (Checklist) con indicadores de estado temáticos.
 */
export function ListChecklist({
  tag = 'Control de Calidad',
  title,
  subtitle,
  items = [],
}: ListChecklistProps) {
  const getBadgeVariant = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      default:
        return 'muted';
    }
  };

  const getStatusLabel = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in-progress':
        return 'En Curso';
      default:
        return 'Pendiente';
    }
  };

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={2} gap="1.5rem" className="my-auto">
        {items.map((item) => (
          <SlideCard
            key={`check-${item.task}`}
            variant="default"
            className="p-5 flex-row items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="w-6 h-6 rounded border border-current flex items-center justify-center text-xs font-bold shrink-0">
                {item.status === 'completed'
                  ? '✓'
                  : item.status === 'in-progress'
                    ? '◐'
                    : '○'}
              </span>
              <div>
                <span
                  className={`text-base font-medium ${item.status === 'completed' ? 'line-through opacity-70' : ''}`}
                >
                  {item.task}
                </span>
                {item.assignedTo && (
                  <span className="text-xs opacity-60 block mt-0.5 font-mono">
                    Resp: {item.assignedTo}
                  </span>
                )}
              </div>
            </div>
            <SlideBadge
              variant={getBadgeVariant(item.status)}
              className="text-[10px]"
            >
              {getStatusLabel(item.status)}
            </SlideBadge>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

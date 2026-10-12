import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface QuoteTestimonialCardProps {
  tag?: string;
  title?: string;
  quote: string;
  author: string;
  role: string;
  company?: string;
  rating?: number;
}

/**
 * Cita estructurada estilo testimonio profesional o evaluación externa.
 */
export function QuoteTestimonialCard({
  tag = 'Evaluación',
  title = 'Opinión de Expertos',
  quote,
  author,
  role,
  company = 'Ecosistema de Software',
  rating = 5,
}: QuoteTestimonialCardProps) {
  return (
    <SlideSection tag={tag} title={title}>
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col justify-center overflow-hidden">
        <SlideCard
          variant="elevated"
          className="p-8 min-w-0 min-h-0 overflow-hidden"
        >
          <div className="flex items-center gap-1 mb-4 text-lg opacity-80 shrink-0">
            {['star-1', 'star-2', 'star-3', 'star-4', 'star-5']
              .slice(0, rating)
              .map((starKey) => (
                <span key={starKey}>★</span>
              ))}
          </div>

          <blockquote className="text-2xl font-normal leading-relaxed italic mb-6 break-words line-clamp-[5] min-w-0">
            “{quote}”
          </blockquote>

          <div className="flex justify-between items-end gap-4 pt-6 border-t border-current/10 min-w-0 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="text-xl font-bold truncate">{author}</div>
              <div className="text-sm opacity-70 truncate">
                {role} • <span className="opacity-90">{company}</span>
              </div>
            </div>
            <span className="text-xs uppercase font-mono tracking-widest opacity-60 shrink-0">
              Validado
            </span>
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

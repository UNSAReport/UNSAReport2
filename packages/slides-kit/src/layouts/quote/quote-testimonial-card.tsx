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
      <div className="max-w-3xl mx-auto w-full my-auto">
        <SlideCard variant="elevated" className="p-10">
          <div className="flex items-center gap-1 mb-6 text-xl opacity-80">
            {['star-1', 'star-2', 'star-3', 'star-4', 'star-5']
              .slice(0, rating)
              .map((starKey) => (
                <span key={starKey}>★</span>
              ))}
          </div>

          <blockquote className="text-2xl md:text-3xl font-normal leading-relaxed italic mb-8">
            “{quote}”
          </blockquote>

          <div className="flex justify-between items-end pt-6 border-t border-current/10">
            <div>
              <div className="text-xl font-bold">{author}</div>
              <div className="text-sm opacity-70">
                {role} • <span className="opacity-90">{company}</span>
              </div>
            </div>
            <span className="text-xs uppercase font-mono tracking-widest opacity-60">
              Validado
            </span>
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

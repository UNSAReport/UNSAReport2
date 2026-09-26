import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface QuoteSplitAuthorProps {
  tag?: string;
  quote: string;
  author: string;
  authorRole: string;
  authorBio?: string;
  authorImageUrl?: string;
}

/**
 * Cita con cita textual prominente a la izquierda y tarjeta de autor a la derecha.
 */
export function QuoteSplitAuthor({
  tag = 'Referencia Teórica',
  quote,
  author,
  authorRole,
  authorBio,
  authorImageUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
}: QuoteSplitAuthorProps) {
  return (
    <SlideSection withGradientBar={true}>
      <SlideSplit
        ratio="60-40"
        gap="3rem"
        left={
          <div className="flex flex-col justify-center h-full">
            {tag && (
              <div className="mb-4">
                <SlideBadge variant="accent">{tag}</SlideBadge>
              </div>
            )}
            <span className="text-7xl leading-none font-serif opacity-30 select-none mb-2">
              “
            </span>
            <blockquote className="text-3xl md:text-4xl font-normal leading-relaxed italic mb-6">
              {quote}
            </blockquote>
          </div>
        }
        right={
          <div className="flex items-center justify-center h-full">
            <SlideCard
              variant="elevated"
              className="p-8 items-center text-center w-full max-w-sm"
            >
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-current/20 mb-4 shadow-xl">
                <img
                  src={authorImageUrl}
                  alt={author}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-xl font-bold">{author}</h4>
              <p className="text-sm font-medium opacity-80 mb-3">
                {authorRole}
              </p>
              {authorBio && (
                <p className="text-xs opacity-60 leading-relaxed border-t border-current/10 pt-3">
                  {authorBio}
                </p>
              )}
            </SlideCard>
          </div>
        }
      />
    </SlideSection>
  );
}

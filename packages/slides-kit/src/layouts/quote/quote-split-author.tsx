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
        gap="1.5rem"
        className="flex-1 min-h-0"
        style={{ gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)' }}
        left={
          <div className="flex flex-col justify-center h-full min-h-0 min-w-0 overflow-hidden">
            {tag && (
              <div className="mb-4 shrink-0">
                <SlideBadge variant="accent">{tag}</SlideBadge>
              </div>
            )}
            <span className="text-5xl leading-none font-serif opacity-30 select-none mb-2 shrink-0">
              “
            </span>
            <blockquote className="text-2xl font-normal leading-relaxed italic break-words line-clamp-[6] min-w-0">
              {quote}
            </blockquote>
          </div>
        }
        right={
          <div className="flex items-center justify-center h-full min-h-0 min-w-0 overflow-hidden">
            <SlideCard
              variant="elevated"
              className="p-6 items-center text-center w-full min-w-0 min-h-0 max-w-sm overflow-hidden"
            >
              <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 border-current/20 mb-4 shadow-xl">
                <img
                  src={authorImageUrl}
                  alt={author}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-lg font-bold truncate w-full min-w-0">
                {author}
              </h4>
              <p className="text-sm font-medium opacity-80 mb-3 truncate w-full min-w-0">
                {authorRole}
              </p>
              {authorBio && (
                <p className="text-xs opacity-60 leading-relaxed border-t border-current/10 pt-3 break-words line-clamp-4 min-w-0 w-full">
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

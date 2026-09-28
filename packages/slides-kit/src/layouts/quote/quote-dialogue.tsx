import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface DialogueSpeaker {
  name: string;
  role: string;
  quote: string;
}

export interface QuoteDialogueProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  speakerA: DialogueSpeaker;
  speakerB: DialogueSpeaker;
}

/**
 * Diálogo o debate entre dos posiciones contrastadas o interlocutores académicos.
 */
export function QuoteDialogue({
  tag = 'Debate Conceptual',
  title = 'Dialéctica y Discusión de Tesis',
  subtitle = 'Dos perspectivas ontológicas contrapuestas en el desarrollo del sistema.',
  speakerA,
  speakerB,
}: QuoteDialogueProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
        left={
          <SlideCard
            variant="elevated"
            className="p-8 justify-between h-full min-h-0 min-w-0 overflow-hidden border-l-4 border-l-current"
          >
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center gap-3 mb-4 min-w-0">
                <span className="shrink-0">
                  <SlideBadge variant="accent">Postura A</SlideBadge>
                </span>
                <span className="font-bold text-lg min-w-0 break-words line-clamp-1 overflow-hidden">
                  {speakerA.name}
                </span>
              </div>
              <blockquote className="text-xl italic leading-relaxed min-w-0 break-words line-clamp-6 overflow-hidden">
                “{speakerA.quote}”
              </blockquote>
            </div>
            <div className="text-xs opacity-60 mt-4 font-mono shrink-0 min-w-0 break-words line-clamp-2 overflow-hidden">
              {speakerA.role}
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="elevated"
            className="p-8 justify-between h-full min-h-0 min-w-0 overflow-hidden border-r-4 border-r-current"
          >
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center justify-end gap-3 mb-4 min-w-0">
                <span className="font-bold text-lg min-w-0 break-words line-clamp-1 overflow-hidden text-right">
                  {speakerB.name}
                </span>
                <span className="shrink-0">
                  <SlideBadge variant="secondary">Postura B</SlideBadge>
                </span>
              </div>
              <blockquote className="text-xl italic leading-relaxed min-w-0 break-words line-clamp-6 overflow-hidden">
                “{speakerB.quote}”
              </blockquote>
            </div>
            <div className="text-xs opacity-60 mt-4 font-mono text-right shrink-0 min-w-0 break-words line-clamp-2 overflow-hidden">
              {speakerB.role}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

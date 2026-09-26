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
        className="my-auto"
        left={
          <SlideCard
            variant="elevated"
            className="p-8 justify-between h-full border-l-4 border-l-current"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <SlideBadge variant="accent">Postura A</SlideBadge>
                <span className="font-bold text-lg">{speakerA.name}</span>
              </div>
              <blockquote className="text-xl italic leading-relaxed">
                “{speakerA.quote}”
              </blockquote>
            </div>
            <div className="text-xs opacity-60 mt-4 font-mono">
              {speakerA.role}
            </div>
          </SlideCard>
        }
        right={
          <SlideCard
            variant="elevated"
            className="p-8 justify-between h-full border-r-4 border-r-current"
          >
            <div>
              <div className="flex items-center justify-end gap-3 mb-4">
                <span className="font-bold text-lg">{speakerB.name}</span>
                <SlideBadge variant="secondary">Postura B</SlideBadge>
              </div>
              <blockquote className="text-xl italic leading-relaxed">
                “{speakerB.quote}”
              </blockquote>
            </div>
            <div className="text-xs opacity-60 mt-4 font-mono text-right">
              {speakerB.role}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface ContactChannel {
  label: string;
  value: string;
  icon?: string;
}

export interface ClosingContactCardProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  name: string;
  role: string;
  institution?: string;
  channels: ContactChannel[];
}

/**
 * Diapositiva de contacto profesional con canales institucionales y redes de investigación.
 */
export function ClosingContactCard({
  tag = 'Contacto',
  title = 'Sigamos en Comunicación',
  subtitle = 'Para colaboraciones académicas, consultas de investigación o asesorías.',
  name,
  role,
  institution = 'Universidad Nacional de San Agustín',
  channels = [],
}: ClosingContactCardProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col justify-center overflow-hidden">
        <SlideCard
          variant="elevated"
          className="p-8 min-w-0 min-h-0 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-4 mb-6 pb-6 border-b border-current/10 min-w-0 shrink-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-extrabold mb-1 truncate">{name}</h3>
              <p className="text-base font-medium opacity-80 truncate">
                {role}
              </p>
              <p className="text-sm opacity-60 mt-1 truncate">{institution}</p>
            </div>
            <SlideBadge variant="accent">Contacto Oficial</SlideBadge>
          </div>

          <div
            className="grid gap-4 min-w-0 min-h-0 overflow-hidden"
            style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}
          >
            {channels.slice(0, 4).map((ch, idx) => (
              <SlideCard
                key={`contact-ch-${ch.label || idx}`}
                variant="muted"
                className="p-4 min-w-0 min-h-0 overflow-hidden"
              >
                <span className="text-xs uppercase font-mono opacity-60 block mb-1 truncate">
                  {ch.label}
                </span>
                <span className="text-sm font-semibold font-mono truncate block min-w-0">
                  {ch.value}
                </span>
              </SlideCard>
            ))}
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

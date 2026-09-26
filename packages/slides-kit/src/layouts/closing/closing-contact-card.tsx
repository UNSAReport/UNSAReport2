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
      <div className="max-w-3xl mx-auto w-full my-auto">
        <SlideCard variant="elevated" className="p-10">
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-current/10">
            <div>
              <h3 className="text-3xl font-extrabold mb-1">{name}</h3>
              <p className="text-lg font-medium opacity-80">{role}</p>
              <p className="text-sm opacity-60 mt-1">{institution}</p>
            </div>
            <SlideBadge variant="accent">Contacto Oficial</SlideBadge>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {channels.map((ch, idx) => (
              <SlideCard
                key={`contact-ch-${ch.label || idx}`}
                variant="muted"
                className="p-4"
              >
                <span className="text-xs uppercase font-mono opacity-60 block mb-1">
                  {ch.label}
                </span>
                <span className="text-base font-semibold font-mono">
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

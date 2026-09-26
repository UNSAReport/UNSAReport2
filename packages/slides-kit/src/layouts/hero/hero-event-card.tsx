import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface HeroEventCardProps {
  tag?: string;
  title: string;
  subtitle?: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  organizer?: string;
  speaker: string;
  speakerRole?: string;
  children?: ReactNode;
}

/**
 * Portada estilo tarjeta de evento institucional o seminario de posgrado.
 */
export function HeroEventCard({
  tag = 'Seminario Académico',
  title,
  subtitle,
  eventDate,
  eventTime,
  eventLocation,
  organizer = 'Universidad Nacional de San Agustín',
  speaker,
  speakerRole,
  children,
}: HeroEventCardProps) {
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
            <h1
              className="text-5xl font-black mb-4 leading-tight"
              style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl opacity-80 leading-relaxed">{subtitle}</p>
            )}
            <div className="mt-8">
              <div className="text-xs uppercase font-mono opacity-70">
                Expositor Principal
              </div>
              <div className="text-2xl font-bold mt-1">{speaker}</div>
              {speakerRole && (
                <div className="text-sm opacity-70">{speakerRole}</div>
              )}
            </div>
            {children}
          </div>
        }
        right={
          <div className="flex items-center justify-center h-full">
            <SlideCard variant="elevated" className="w-full p-8 space-y-6">
              <div className="text-xs uppercase tracking-wider font-bold border-b border-current/10 pb-3">
                Información del Evento
              </div>
              <div>
                <span className="text-xs opacity-60 block">Fecha:</span>
                <span className="text-xl font-bold">{eventDate}</span>
              </div>
              {eventTime && (
                <div>
                  <span className="text-xs opacity-60 block">Horario:</span>
                  <span className="text-base font-semibold">{eventTime}</span>
                </div>
              )}
              {eventLocation && (
                <div>
                  <span className="text-xs opacity-60 block">
                    Lugar / Plataforma:
                  </span>
                  <span className="text-sm">{eventLocation}</span>
                </div>
              )}
              {organizer && (
                <div className="pt-3 border-t border-current/10 text-xs opacity-70">
                  Organizado por:{' '}
                  <strong className="opacity-100">{organizer}</strong>
                </div>
              )}
            </SlideCard>
          </div>
        }
      />
    </SlideSection>
  );
}

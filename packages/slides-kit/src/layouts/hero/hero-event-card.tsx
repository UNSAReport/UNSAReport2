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
      <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden">
        <SlideSplit
          ratio="60-40"
          gap="2rem"
          left={
            <div className="flex min-h-0 min-w-0 w-full flex-col justify-center overflow-hidden">
              {tag && (
                <div className="mb-4 shrink-0">
                  <SlideBadge variant="accent">{tag}</SlideBadge>
                </div>
              )}
              <h1
                className="text-5xl font-black mb-4 leading-tight line-clamp-2 break-words min-w-0"
                style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-xl opacity-80 leading-relaxed line-clamp-3 break-words min-w-0">
                  {subtitle}
                </p>
              )}
              <div className="mt-6 min-w-0 overflow-hidden shrink-0">
                <div className="text-xs uppercase font-mono opacity-70">
                  Expositor Principal
                </div>
                <div className="text-2xl font-bold mt-1 truncate min-w-0">
                  {speaker}
                </div>
                {speakerRole && (
                  <div className="text-sm opacity-70 truncate min-w-0">
                    {speakerRole}
                  </div>
                )}
              </div>
              {children}
            </div>
          }
          right={
            <div className="flex min-h-0 min-w-0 w-full items-center justify-center overflow-hidden">
              <SlideCard
                variant="elevated"
                className="w-full p-8 space-y-6 min-w-0 overflow-hidden"
              >
                <div className="text-xs uppercase tracking-wider font-bold border-b border-current/10 pb-3 truncate">
                  Información del Evento
                </div>
                <div className="min-w-0">
                  <span className="text-xs opacity-60 block">Fecha:</span>
                  <span className="text-xl font-bold truncate block min-w-0">
                    {eventDate}
                  </span>
                </div>
                {eventTime && (
                  <div className="min-w-0">
                    <span className="text-xs opacity-60 block">Horario:</span>
                    <span className="text-base font-semibold truncate block min-w-0">
                      {eventTime}
                    </span>
                  </div>
                )}
                {eventLocation && (
                  <div className="min-w-0">
                    <span className="text-xs opacity-60 block">
                      Lugar / Plataforma:
                    </span>
                    <span className="text-sm line-clamp-2 break-words min-w-0">
                      {eventLocation}
                    </span>
                  </div>
                )}
                {organizer && (
                  <div className="pt-3 border-t border-current/10 text-xs opacity-70 line-clamp-2 break-words min-w-0">
                    Organizado por:{' '}
                    <strong className="opacity-100">{organizer}</strong>
                  </div>
                )}
              </SlideCard>
            </div>
          }
        />
      </div>
    </SlideSection>
  );
}

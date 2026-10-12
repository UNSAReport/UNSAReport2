import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideDivider } from '@/primitives/SlideDivider';
import { SlideSection } from '@/primitives/SlideSection';
export interface HeroInstitutionalProps {
  university?: string;
  faculty?: string;
  department?: string;
  title: string;
  subtitle?: string;
  course?: string;
  author: string;
  advisor?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada académica formal con datos institucionales completos (universidad, facultad, curso, asesor).
 */
export function HeroInstitutional({
  university = 'Universidad Nacional de San Agustín de Arequipa',
  faculty = 'Facultad de Ingeniería de Producción y Servicios',
  department = 'Escuela Profesional de Ingeniería de Sistemas',
  title,
  subtitle,
  course,
  author,
  advisor,
  date,
  children,
}: HeroInstitutionalProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col justify-between w-full h-full min-h-0 min-w-0 overflow-hidden text-center">
        {/* Cabecera institucional */}
        <div className="border-b border-current/10 pb-3 shrink-0 min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-wider opacity-90 truncate">
            {university}
          </h4>
          <p className="text-xs opacity-60 mt-1 truncate">
            {faculty} — {department}
          </p>
        </div>

        {/* Título central */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-4 min-w-0 overflow-hidden">
          {course && (
            <div className="mb-3 shrink-0">
              <SlideBadge variant="accent">{course}</SlideBadge>
            </div>
          )}
          <h1
            className="text-5xl font-black mb-3 max-w-4xl mx-auto leading-tight line-clamp-2 break-words"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl opacity-80 max-w-2xl mx-auto line-clamp-3 break-words">
              {subtitle}
            </p>
          )}
        </div>

        {/* Metadatos inferiores de autores y asesor */}
        <div className="opacity-75 shrink-0">
          <SlideDivider thickness="1px" opacity={0.12} />
          <div className="grid grid-cols-2 gap-4 text-xs pt-3">
            <div className="text-left min-w-0 truncate">
              <span className="font-semibold">Autor(es): </span>
              {author}
            </div>
            <div className="text-right min-w-0 truncate">
              {advisor && (
                <>
                  <span className="font-semibold">Docente / Asesor: </span>
                  {advisor}
                </>
              )}
              {date && <span className="ml-3 font-mono">({date})</span>}
            </div>
          </div>
        </div>

        {children}
      </div>
    </SlideSection>
  );
}

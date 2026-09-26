import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
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
      <div className="flex flex-col justify-between h-full text-center px-8 py-4">
        {/* Cabecera institucional */}
        <div className="border-b border-current/10 pb-4">
          <h4 className="text-sm font-bold uppercase tracking-wider opacity-90">
            {university}
          </h4>
          <p className="text-xs opacity-60 mt-1">
            {faculty} — {department}
          </p>
        </div>

        {/* Título central */}
        <div className="my-auto py-6">
          {course && (
            <div className="mb-4">
              <SlideBadge variant="accent">{course}</SlideBadge>
            </div>
          )}
          <h1
            className="text-5xl font-black mb-4 max-w-4xl mx-auto leading-tight"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl opacity-80 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Metadatos inferiores de autores y asesor */}
        <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-current/10 opacity-75">
          <div className="text-left">
            <span className="font-semibold">Autor(es): </span>
            {author}
          </div>
          <div className="text-right">
            {advisor && (
              <>
                <span className="font-semibold">Docente / Asesor: </span>
                {advisor}
              </>
            )}
            {date && <span className="ml-3 font-mono">({date})</span>}
          </div>
        </div>

        {children}
      </div>
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface TeamGridMember {
  /** Nombre del miembro */
  name: string;
  /** Rol o cargo */
  role?: string;
  /** URL de la foto */
  imageUrl?: string;
}

export interface StatsTeamGridProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal */
  title: string;
  /** Miembros del equipo (máximo 4) */
  members: TeamGridMember[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Grilla de equipo 4-up con marco de foto y nombre en mayúsculas.
 */
export function StatsTeamGrid({ tag, title, members }: StatsTeamGridProps) {
  const cards = members.slice(0, 4);
  return (
    <SlideSection withGradientBar={false}>
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-5xl mx-auto px-8 overflow-hidden">
        {tag && (
          <div className="mb-5 shrink-0">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-4xl font-extrabold tracking-tight mb-8 line-clamp-2 break-words min-w-0"
          style={{ fontFamily: 'var(--slide-heading-font-family, inherit)' }}
        >
          {title}
        </h2>

        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5 w-full min-w-0 overflow-hidden">
          {cards.map((m) => (
            <li
              key={`team-${m.name}`}
              className="flex flex-col items-center text-center min-w-0 rounded-2xl border p-6 overflow-hidden"
              style={{
                borderColor: 'var(--slide-border)',
                background: 'var(--slide-surface)',
              }}
            >
              {m.imageUrl ? (
                <img
                  src={m.imageUrl}
                  alt={m.name}
                  className="w-20 h-20 rounded-full object-cover mb-4 shrink-0"
                  loading="lazy"
                />
              ) : (
                <span
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black mb-4 shrink-0"
                  style={{
                    background: 'var(--slide-accent)',
                    color: 'var(--slide-accent-contrast, #fff)',
                  }}
                  aria-hidden="true"
                >
                  {initials(m.name)}
                </span>
              )}
              <p className="text-base font-bold uppercase tracking-wide line-clamp-2 break-words min-w-0">
                {m.name}
              </p>
              {m.role && (
                <p
                  className="text-sm mt-1 line-clamp-2 break-words min-w-0"
                  style={{
                    borderTop:
                      '1px solid var(--slide-stat-divider, var(--slide-border))',
                    paddingTop: '0.5rem',
                    marginTop: '0.5rem',
                    opacity: 0.7,
                  }}
                >
                  {m.role}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </SlideSection>
  );
}

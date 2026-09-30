import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Button, buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { TextInput } from '@/components/TextInput';
import {
  listOrganizationsServerFn,
  listPresentationsServerFn,
  type SlidesOrganization,
  type SlidesPresentation,
} from '@/lib/slides/client';

export const Route = createFileRoute('/presentations/')({
  loader: async () => {
    try {
      const [presentations, organizations] = await Promise.all([
        listPresentationsServerFn(),
        listOrganizationsServerFn(),
      ]);
      return {
        presentations,
        organizations,
        error: null as string | null,
      };
    } catch (err) {
      return {
        presentations: [] as SlidesPresentation[],
        organizations: [] as SlidesOrganization[],
        error:
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las presentaciones.',
      };
    }
  },
  component: PresentationsDashboard,
});

function PresentationsDashboard() {
  const { presentations, organizations, error } = Route.useLoaderData();
  const [filter, setFilter] = useState<'all' | 'user' | 'org'>('all');
  const [search, setSearch] = useState('');

  const orgMap = useMemo(() => {
    const orgs = new Map<string, SlidesOrganization>();
    for (const org of organizations) {
      orgs.set(org.id, org);
    }
    return orgs;
  }, [organizations]);

  const filtered = useMemo(() => {
    return presentations.filter((p) => {
      if (filter === 'user' && p.ownerType !== 'user') return false;
      if (filter === 'org' && p.ownerType !== 'organization') return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesSlug = p.slug.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSlug) return false;
      }
      return true;
    });
  }, [presentations, filter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Presentaciones UNSA
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plataforma institucional para diseño, autoría y publicación de
            diapositivas académicas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/presentations/catalog"
            className={buttonClasses('primary', 'md')}
          >
            <span>Explorar Catálogo de Layouts</span>
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href="/presentations/upload"
            className={buttonClasses('secondary', 'md')}
          >
            Publicar presentación
          </a>
        </div>
      </header>

      <nav
        aria-label="Filtro de presentaciones"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <fieldset className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <legend className="sr-only">Filtrar por propietario</legend>
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            ariaPressed={filter === 'all'}
          >
            Todas ({presentations.length})
          </Button>
          <Button
            variant={filter === 'user' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('user')}
            ariaPressed={filter === 'user'}
          >
            Personales
          </Button>
          <Button
            variant={filter === 'org' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('org')}
            ariaPressed={filter === 'org'}
          >
            Organizaciones
          </Button>
        </fieldset>

        <div className="min-w-[260px]">
          <TextInput
            label="Buscar presentaciones"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar presentación…"
          />
        </div>
      </nav>

      {error ? (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-sm text-rose-300"
        >
          No se pudieron cargar las presentaciones desde el servicio. Revisa tu
          sesión y la conexión con el backend: {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          titleId="empty-heading"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Presentación vacía"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 4v16M17 4v16M3 8h18M3 16h18"
              />
            </svg>
          }
          title="No se encontraron presentaciones"
          body={
            <>
              <p className="mb-6">
                Crea una nueva presentación en tu terminal con el CLI oficial y
                publícala con un solo comando. Si ya tienes acceso, explora los
                diseños disponibles en el{' '}
                <Link
                  to="/presentations/catalog"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  catálogo de layouts
                </Link>
                .
              </p>
              <div className="inline-block bg-slate-950 p-4 rounded-xl text-left border border-slate-800 font-mono text-xs text-indigo-300">
                <p className="text-slate-500">
                  # 1. Crear proyecto con el kit oficial
                </p>
                <p>unsarep slides init mi-presentacion</p>
                <p className="text-slate-500 mt-2">
                  # 2. Vista previa en tiempo real
                </p>
                <p>cd mi-presentacion && unsarep slides dev</p>
                <p className="text-slate-500 mt-2">
                  # 3. Despliegue en la nube
                </p>
                <p>unsarep slides deploy</p>
              </div>
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <PresentationCard
              key={item.id}
              item={item}
              orgName={orgMap.get(item.ownerId)?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PresentationCard({
  item,
  orgName,
}: {
  item: SlidesPresentation;
  orgName?: string;
}) {
  return (
    <Card
      padding="md"
      className="group flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/20"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Chip status={item.visibility} />
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono">
            v{item.activeVersion}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
          {item.title}
        </h3>

        <p className="text-xs text-slate-400 font-mono mt-1 mb-3">
          /{item.slug}
        </p>

        {item.description ? (
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>
        ) : (
          <p className="text-sm text-slate-500 italic mb-4">Sin descripción</p>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {item.ownerType === 'organization' ? (
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {orgName || 'Organización'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Personal
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/presentations/$slug"
            params={{ slug: item.slug }}
            search={{ present: 1 }}
            className={buttonClasses('primary', 'sm')}
          >
            <span>Presentar</span>
            <span aria-hidden="true">⛶</span>
          </Link>
          <Link
            to="/presentations/$slug"
            params={{ slug: item.slug }}
            className={buttonClasses('secondary', 'sm')}
          >
            <span>Abrir</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

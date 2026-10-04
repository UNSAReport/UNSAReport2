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

  const publicDecks = useMemo(() => {
    return presentations.filter(
      (p) =>
        p.visibility === 'public' &&
        (p.ownerType !== 'organization' || !orgMap.has(p.ownerId)),
    );
  }, [presentations, orgMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans bg-[#E3E2DE] text-[#141414]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C7C7C7] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#141414]">
            Presentaciones UNSA
          </h1>
          <p className="text-sm text-[#444343] mt-1">
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
        <fieldset className="flex items-center gap-2 bg-transparent p-1 rounded-none border border-[#C7C7C7]">
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
          className="p-4 rounded-none border border-[#C7C7C7] text-sm text-red-700"
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
                  className="text-[#1351AA] underline underline-offset-4 transition-colors duration-300"
                >
                  catálogo de layouts
                </Link>
                .
              </p>
              <div className="inline-block bg-[#141414] p-4 rounded-none text-left border border-[#C7C7C7] font-mono text-xs text-[#E3E2DE]">
                <p className="text-[#7A7A7A]">
                  # 1. Crear proyecto con el kit oficial
                </p>
                <p>unsarep slides init mi-presentacion</p>
                <p className="text-[#7A7A7A] mt-2">
                  # 2. Vista previa en tiempo real
                </p>
                <p>cd mi-presentacion && unsarep slides dev</p>
                <p className="text-[#7A7A7A] mt-2">
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

      {publicDecks.length > 0 ? (
        <section aria-label="Decks públicos de terceros" className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#141414]">
              Decks públicos de terceros
            </h2>
            <p className="text-sm text-[#444343] mt-1">
              Presentaciones públicas de propietarios fuera de tus
              organizaciones.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicDecks.map((item) => (
              <PresentationCard
                key={item.id}
                item={item}
                orgName={orgMap.get(item.ownerId)?.name}
              />
            ))}
          </div>
        </section>
      ) : null}
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
      className="group flex flex-col justify-between transition-colors duration-300 hover:border-[#1351AA]"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Chip status={item.visibility} />
          <span className="px-2 py-0.5 rounded-none bg-[#141414] text-[#E3E2DE] text-[11px] font-mono">
            v{item.activeVersion}
          </span>
        </div>

        <h3 className="text-lg font-bold text-[#141414] group-hover:text-[#1351AA] transition-colors duration-300 line-clamp-1">
          {item.title}
        </h3>

        <p className="text-xs text-[#7A7A7A] font-mono mt-1 mb-3">
          /{item.slug}
        </p>

        {item.description ? (
          <p className="text-sm text-[#444343] line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>
        ) : (
          <p className="text-sm text-[#7A7A7A] italic mb-4">Sin descripción</p>
        )}
      </div>

      <div className="pt-4 border-t border-[#C7C7C7] flex items-center justify-between">
        <div className="text-xs text-[#7A7A7A]">
          {item.ownerType === 'organization' ? (
            <span className="inline-flex items-center gap-1.5 text-[#444343]">
              <span className="w-2 h-2 rounded-none bg-[#1351AA]" />
              {orgName || 'Organización'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[#7A7A7A]">
              <span className="w-2 h-2 rounded-none bg-[#C7C7C7]" />
              Personal
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/presentations/$slug"
            params={{ slug: item.id }}
            search={{ present: 1 }}
            className={buttonClasses('primary', 'sm')}
          >
            <span>Presentar</span>
            <span aria-hidden="true">⛶</span>
          </Link>
          <Link
            to="/presentations/$slug"
            params={{ slug: item.id }}
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

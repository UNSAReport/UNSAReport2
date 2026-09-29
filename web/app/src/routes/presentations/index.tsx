import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
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
      return { presentations, organizations };
    } catch {
      return { presentations: [], organizations: [] };
    }
  },
  component: PresentationsDashboard,
});

function PresentationsDashboard() {
  const { presentations, organizations } = Route.useLoaderData();
  const [filter, setFilter] = useState<'all' | 'user' | 'org'>('all');
  const [search, setSearch] = useState('');

  const orgMap = useMemo(() => {
    const map = new Map<string, SlidesOrganization>();
    for (const org of organizations) {
      map.set(org.id, org);
    }
    return map;
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
      {/* Header section */}
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
        <div className="flex items-center gap-3">
          <Link
            to="/presentations/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <span>Explorar Catálogo de Layouts</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {/* Controls: Search and filter tabs */}
      <nav
        aria-label="Filtro de presentaciones"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({presentations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('user')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'user'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Personales
          </button>
          <button
            type="button"
            onClick={() => setFilter('org')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'org'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Organizaciones
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Buscar presentación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </nav>

      {/* Content list */}
      {filtered.length === 0 ? (
        <section
          aria-labelledby="empty-heading"
          className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30"
        >
          <div className="inline-flex p-3 rounded-full bg-slate-800 text-slate-400 mb-4">
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
          </div>
          <h2 id="empty-heading" className="text-lg font-bold text-slate-200">
            No se encontraron presentaciones
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
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
            <p className="text-slate-500 mt-2"># 3. Despliegue en la nube</p>
            <p>unsarep slides deploy</p>
          </div>
        </section>
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
  const visibilityColors = {
    public: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    org: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    private: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    unlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <article className="group flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-indigo-950/20">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border uppercase tracking-wider ${
              visibilityColors[item.visibility] || visibilityColors.private
            }`}
          >
            {item.visibility}
          </span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Presentar</span>
            <span aria-hidden="true">⛶</span>
          </Link>
          <Link
            to="/presentations/$slug"
            params={{ slug: item.slug }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors"
          >
            <span>Abrir</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

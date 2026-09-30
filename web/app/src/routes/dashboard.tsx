import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useMemo } from 'react';
import { buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { fetchCurrentUser, requireAuthServerFn } from '@/lib/auth/server';
import {
  listOrganizationsServerFn,
  listPresentationsServerFn,
  type SlidesOrganization,
  type SlidesPresentation,
} from '@/lib/slides/client';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    try {
      await requireAuthServerFn();
    } catch {
      throw redirect({ to: '/auth/login' });
    }
  },
  loader: async () => {
    const user = await fetchCurrentUser().catch(() => null);
    let presentations: SlidesPresentation[] = [];
    let organizations: SlidesOrganization[] = [];
    let error: string | null = null;
    try {
      const [p, o] = await Promise.all([
        listPresentationsServerFn(),
        listOrganizationsServerFn(),
      ]);
      presentations = p;
      organizations = o;
    } catch (err) {
      error =
        err instanceof Error ? err.message : 'No se pudieron cargar tus datos.';
    }
    return { user, presentations, organizations, error };
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  const { user, presentations, organizations, error } = Route.useLoaderData();

  const orgNameById = useMemo(() => {
    const byId: Record<string, string> = {};
    for (const org of organizations) {
      byId[org.id] = org.name;
    }
    return byId;
  }, [organizations]);

  const personalSlides = useMemo(
    () => presentations.filter((p) => p.ownerType !== 'organization'),
    [presentations],
  );
  const orgSlides = useMemo(
    () => presentations.filter((p) => p.ownerType === 'organization'),
    [presentations],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            UNSAReport · Espacio personal
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            Mi dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tus slides, organizaciones y cuenta en un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/presentations/upload"
            className={buttonClasses('primary', 'md')}
          >
            Publicar presentación
          </Link>
          <Link
            to="/presentations/catalog"
            className={buttonClasses('secondary', 'md')}
          >
            Explorar catálogo
          </Link>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-sm text-rose-300"
        >
          No se pudieron cargar tus datos desde los servicios: {error}
        </div>
      ) : null}

      <section
        aria-label="Mi cuenta"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card labelledBy="dashboard-account-heading" className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cuenta
            </p>
            <h2
              id="dashboard-account-heading"
              className="text-lg font-bold text-white mt-1"
            >
              {user?.name ?? 'Mi cuenta'}
            </h2>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-200"
                >
                  {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-100">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
          ) : null}
          {user?.roles && Object.keys(user.roles).length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {Object.entries(user.roles).map(([subApp, role]) => (
                <li
                  key={subApp}
                  className="text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {subApp}: {String(role)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-2">
            <Link
              to="/auth/me"
              className={buttonClasses('secondary', 'sm', 'w-full')}
            >
              Ver mi cuenta →
            </Link>
            <Link
              to="/auth/pat"
              className={buttonClasses('ghost', 'sm', 'w-full')}
            >
              Gestionar tokens de acceso
            </Link>
          </div>
        </Card>

        <Card
          labelledBy="dashboard-orgs-heading"
          className="space-y-4 lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pertenencia
              </p>
              <h2
                id="dashboard-orgs-heading"
                className="text-lg font-bold text-white mt-1"
              >
                Mis organizaciones ({organizations.length})
              </h2>
            </div>
            <Link
              to="/scopes"
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 shrink-0"
            >
              Scopes e invitaciones →
            </Link>
          </div>
          {organizations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no perteneces a ninguna organización. Pide acceso desde la
              página de scopes.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {organizations.map((org) => {
                const slidesCount = presentations.filter(
                  (p) => p.ownerType === 'organization' && p.ownerId === org.id,
                ).length;
                return (
                  <li
                    key={org.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <p className="font-bold text-slate-100">{org.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      @{org.slug}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {org.role ? `${org.role} · ` : ''}
                      {slidesCount} {slidesCount === 1 ? 'slide' : 'slides'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section aria-label="Mis slides personales" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Mis slides ({personalSlides.length})
          </h2>
          <Link
            to="/presentations"
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Ver todas →
          </Link>
        </div>
        {personalSlides.length === 0 ? (
          <EmptyState
            titleId="dashboard-personal-empty"
            title="Sin slides personales"
            body="Crea tu primer deck con el kit oficial y despliega con unsarep slides deploy."
            action={
              <Link
                to="/presentations/upload"
                className={buttonClasses('primary', 'md')}
              >
                Publicar presentación
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalSlides.map((item) => (
              <DashboardSlideCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Slides de mis organizaciones" className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-white">
          Slides de mis organizaciones ({orgSlides.length})
        </h2>
        {orgSlides.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ninguna organización ha publicado slides todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgSlides.map((item) => (
              <DashboardSlideCard
                key={item.id}
                item={item}
                orgName={orgNameById[item.ownerId]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardSlideCard({
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
        <p className="text-xs text-slate-500 mb-4">
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
        </p>
      </div>
      <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
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
    </Card>
  );
}

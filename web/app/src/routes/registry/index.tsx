import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { TextInput } from '@/components/TextInput';
import { fetchPackagesServerFn } from '@/lib/registry/client';

export const Route = createFileRoute('/registry/')({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || undefined,
    tag: (search.tag as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({
    search: search.search,
    tag: search.tag,
  }),
  loader: async ({ deps }) => {
    const pkgs = await fetchPackagesServerFn({
      data: { search: deps.search, tag: deps.tag },
    }).catch(() => []);
    return { packages: pkgs };
  },
  component: RegistryIndexComponent,
});

function RegistryIndexComponent() {
  const { packages } = Route.useLoaderData();
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.search ?? '');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Paquetes y plantillas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plantillas Typst, scopes y versiones publicadas para tus informes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/registry/upload"
            className={buttonClasses('primary', 'md')}
          >
            <span>Publicar paquete</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link to="/scopes" className={buttonClasses('secondary', 'md')}>
            Mis scopes
          </Link>
        </div>
      </header>

      <form
        method="get"
        className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
      >
        <div className="min-w-[260px] flex-1">
          <TextInput
            label="Buscar paquetes"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paquete…"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {packages.length === 0 ? (
        <EmptyState
          titleId="empty-heading"
          title="No se encontraron paquetes"
          body={
            <p>
              Publica tu primer paquete con el CLI o ajusta la búsqueda para ver
              las plantillas disponibles.
            </p>
          }
          action={
            <Link
              to="/registry/upload"
              className={buttonClasses('primary', 'md')}
            >
              Publicar paquete
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isScoped = pkg.name.startsWith('@') && pkg.name.includes('/');
            const scopePart = isScoped ? pkg.name.split('/')[0] : null;
            return (
              <Card
                key={pkg.name}
                padding="md"
                className="group flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {pkg.latestVersion ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono">
                        v{pkg.latestVersion}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 text-[11px] font-mono">
                        sin versión
                      </span>
                    )}
                    {scopePart && (
                      <Link
                        to="/scopes/$scope"
                        params={{ scope: scopePart }}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300"
                      >
                        {scopePart}
                      </Link>
                    )}
                  </div>
                  <Link
                    to="/registry/$name"
                    params={{ name: pkg.name }}
                    className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1"
                  >
                    {pkg.displayName || pkg.name}
                  </Link>
                  <p className="text-xs text-slate-400 font-mono mt-1 mb-3">
                    {pkg.name}
                  </p>
                  {pkg.description ? (
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {pkg.description}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 italic mb-4">
                      Sin descripción
                    </p>
                  )}
                  {pkg.tags?.length ? (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pkg.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
                  <Link
                    to="/registry/$name"
                    params={{ name: pkg.name }}
                    className={buttonClasses('secondary', 'sm')}
                  >
                    <span>Ver paquete</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

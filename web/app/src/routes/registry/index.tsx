import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, buttonClasses } from '@/components/Button';
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
    <div className="min-h-screen bg-[#E3E2DE] text-[#141414] font-sans">
      {/* HERO */}
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 md:border-r border-b md:border-b-0 border-[#C7C7C7] p-6 flex md:flex-col flex-row items-center md:items-start gap-4">
          <span aria-hidden="true" className="block w-4 h-4 bg-[#141414]" />
          <p className="grid-label">Registry</p>
          <p className="md:mt-auto font-mono text-[11px] text-[#7A7A7A]">
            {packages.length}{' '}
            {packages.length === 1 ? 'paquete' : 'paquetes'}
            <br />
            Scopes + versiones
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 flex flex-col justify-center gap-10">
          <h1 className="poster-headline uppercase text-6xl md:text-8xl xl:text-9xl">
            Paquetes.
            <br />
            Plantillas.
            <br />
            <span className="text-[#1351AA]">Versiones.</span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <p className="max-w-[400px] text-lg text-[#444343] leading-relaxed">
              Plantillas Typst, scopes y versiones publicadas para tus
              informes. Lo que compila hoy compila en la defensa.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                to="/registry/upload"
                className="poster-button poster-button-primary"
              >
                Publicar paquete
              </Link>
              <Link
                to="/scopes"
                className="text-sm font-bold uppercase tracking-wider underline decoration-[#1351AA] decoration-2 underline-offset-4 transition-colors duration-300 hover:text-[#1351AA]"
              >
                Mis scopes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
          <p className="grid-label md:sticky md:top-32">Search</p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12">
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
        </div>
      </section>

      {/* INDEX — typographic list */}
      <section className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
          <p className="grid-label md:sticky md:top-32">
            Index — {String(packages.length).padStart(3, '0')}
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12">
          {packages.length === 0 ? (
            <div className="border border-dashed border-[#C7C7C7] p-8 md:p-12 space-y-6">
              <p className="font-mono text-xs text-[#7A7A7A]">000</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-none">
                Sin paquetes todavía.
              </h2>
              <p className="text-sm text-[#444343] leading-relaxed max-w-xl">
                Publica tu primer paquete con el CLI o ajusta la búsqueda para
                ver las plantillas disponibles.
              </p>
              <code className="block p-3 rounded-none bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] font-mono text-xs overflow-x-auto max-w-xl">
                unsarep registry publish ./mi-paquete
              </code>
              <Link
                to="/registry/upload"
                className={buttonClasses('primary', 'md')}
              >
                Publicar paquete
              </Link>
            </div>
          ) : (
            <div>
              {packages.map((pkg, i) => {
                const isScoped =
                  pkg.name.startsWith('@') && pkg.name.includes('/');
                const scopePart = isScoped
                  ? pkg.name.split('/')[0]
                  : null;
                return (
                  <article
                    key={pkg.name}
                    className="poster-row min-h-[100px] md:min-h-[150px]"
                  >
                    <p className="font-mono text-xs text-[#7A7A7A] pt-2 shrink-0 w-10">
                      {String(i + 1).padStart(3, '0')}
                    </p>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {pkg.latestVersion ? (
                          <span className="px-2 py-0.5 rounded-none bg-[#141414] text-[#E3E2DE] text-[11px] font-mono">
                            v{pkg.latestVersion}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-none bg-[#141414] text-[#E3E2DE] text-[11px] font-mono">
                            sin versión
                          </span>
                        )}
                        {scopePart && (
                          <Link
                            to="/scopes/$scope"
                            params={{ scope: scopePart }}
                            className="font-mono text-[11px] text-[#1351AA] underline decoration-[#1351AA] underline-offset-2 transition-colors duration-300 hover:text-[#141414]"
                          >
                            {scopePart}
                          </Link>
                        )}
                      </div>
                      <Link
                        to="/registry/$name"
                        params={{ name: pkg.name }}
                        className="poster-row-title block text-3xl md:text-5xl font-bold leading-none tracking-tight text-[#141414] line-clamp-2"
                      >
                        {pkg.displayName || pkg.name}
                      </Link>
                      <p className="text-xs text-[#7A7A7A] font-mono mt-2">
                        {pkg.name}
                      </p>
                      {pkg.description ? (
                        <p className="text-sm text-[#444343] leading-relaxed mt-3 max-w-xl line-clamp-2">
                          {pkg.description}
                        </p>
                      ) : (
                        <p className="text-sm text-[#7A7A7A] italic mt-3">
                          Sin descripción
                        </p>
                      )}
                      {pkg.tags?.length ? (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {pkg.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-none border border-[#C7C7C7] text-[#444343] text-[11px] font-bold uppercase tracking-wider"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <Link
                        to="/registry/$name"
                        params={{ name: pkg.name }}
                        className="inline-block mt-4 text-sm font-bold uppercase tracking-wider underline decoration-[#1351AA] decoration-2 underline-offset-4 transition-colors duration-300 hover:text-[#1351AA]"
                      >
                        Ver paquete →
                      </Link>
                    </div>
                  </article>
                );
              })}
              <div
                className="border-b border-[#C7C7C7]"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
